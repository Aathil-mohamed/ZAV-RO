<?php

use App\Jobs\RunMyModelTryOn;
use App\Jobs\RunTryOn;
use App\Models\Category;
use App\Models\ModelPhoto;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\TryOnJob;
use App\Models\TryOnResult;
use App\Models\User;
use Database\Seeders\SizeChartSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function validGarmentUrl(): string
{
    return rtrim(config('app.public_assets_url'), '/') . '/uploads/shirt.png';
}

// --- TryOnController ---

test('tryon requires auth and consent and valid garment url', function () {
    Storage::fake('s3-private');
    Http::fake(['*' => Http::response(['ok' => true], 200)]);

    $photo = UploadedFile::fake()->image('person.jpg', 500, 700);

    $this->postJson('/api/tryon', [
        'photo' => $photo,
        'garment_url' => validGarmentUrl(),
        'category' => 'upper',
        'consent' => '1',
    ])->assertStatus(401);

    $user = User::factory()->create();

    // Missing consent
    $this->actingAs($user)->postJson('/api/tryon', [
        'photo' => $photo,
        'garment_url' => validGarmentUrl(),
        'category' => 'upper',
    ])->assertStatus(422);

    // Disallowed garment URL
    $this->actingAs($user)->postJson('/api/tryon', [
        'photo' => $photo,
        'garment_url' => 'https://evil.example.com/shirt.png',
        'category' => 'upper',
        'consent' => '1',
    ])->assertStatus(422);
});

test('tryon owner-only access, job execution, destroyAll, and purge', function () {
    Storage::fake('s3-private');
    Bus::fake([RunTryOn::class]);
    Http::fake(['*' => Http::response(['ok' => true], 200)]);

    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $photo = UploadedFile::fake()->image('person.jpg', 500, 700);

    $res = $this->actingAs($userA)->postJson('/api/tryon', [
        'photo' => $photo,
        'garment_url' => validGarmentUrl(),
        'category' => 'upper',
        'consent' => '1',
    ]);
    $res->assertStatus(202);
    $jobId = $res->json('id');

    Bus::assertDispatched(RunTryOn::class);

    // User B gets 404 on User A's job
    $this->actingAs($userB)->getJson("/api/tryon/{$jobId}")->assertStatus(404);

    // Execute job against fake HTTP tryon service
    Http::fake(['*' => Http::response('fake-png-bytes', 200, ['Content-Type' => 'image/png'])]);
    $job = TryOnJob::findOrFail($jobId);
    (new RunTryOn($job))->handle();

    $job->refresh();
    expect($job->status)->toBe('done');
    expect($job->result_path)->not->toBeNull();
    Storage::disk('s3-private')->assertExists($job->input_path);
    Storage::disk('s3-private')->assertExists($job->result_path);

    // Destroy all deletes files & rows
    $inputPath = $job->input_path;
    $resultPath = $job->result_path;
    $this->actingAs($userA)->deleteJson('/api/tryon')->assertStatus(204);
    expect(TryOnJob::count())->toBe(0);
    Storage::disk('s3-private')->assertMissing($inputPath);
    Storage::disk('s3-private')->assertMissing($resultPath);
});

test('tryon rate limit returns 429 on 11th request', function () {
    Storage::fake('s3-private');
    Bus::fake([RunTryOn::class]);
    Http::fake(['*' => Http::response(['ok' => true], 200)]);

    $user = User::factory()->create();
    $photo = UploadedFile::fake()->image('person.jpg', 500, 700);

    for ($i = 0; $i < 10; $i++) {
        $this->actingAs($user)->postJson('/api/tryon', [
            'photo' => $photo,
            'garment_url' => validGarmentUrl(),
            'category' => 'upper',
            'consent' => '1',
        ])->assertStatus(202);
    }

    $this->actingAs($user)->postJson('/api/tryon', [
        'photo' => $photo,
        'garment_url' => validGarmentUrl(),
        'category' => 'upper',
        'consent' => '1',
    ])->assertStatus(429);
});

test('tryon:purge deletes expired jobs and expired model photos', function () {
    Storage::fake('s3-private');
    $user = User::factory()->create();

    Storage::disk('s3-private')->put('tryon/inputs/old.jpg', 'x');
    Storage::disk('s3-private')->put('tryon/results/old.png', 'y');
    TryOnJob::create([
        'user_id' => $user->id,
        'input_path' => 'tryon/inputs/old.jpg',
        'garment_url' => validGarmentUrl(),
        'category' => 'upper',
        'result_path' => 'tryon/results/old.png',
        'status' => 'done',
        'expires_at' => now()->subMinute(),
    ]);

    Storage::disk('s3-private')->put('tryon/models/oldmodel.jpg', 'm');
    ModelPhoto::create([
        'user_id' => $user->id,
        'path' => 'tryon/models/oldmodel.jpg',
        'consented_at' => now()->subDays(2),
        'expires_at' => now()->subMinute(),
    ]);

    $this->artisan('tryon:purge')->assertSuccessful();

    expect(TryOnJob::count())->toBe(0);
    expect(ModelPhoto::count())->toBe(0);
    Storage::disk('s3-private')->assertMissing('tryon/inputs/old.jpg');
    Storage::disk('s3-private')->assertMissing('tryon/results/old.png');
    Storage::disk('s3-private')->assertMissing('tryon/models/oldmodel.jpg');
});

// --- MyModelController ---

test('my-model caches results, enforces daily quota of 20, isolates users, and deletes cleanly', function () {
    Storage::fake('s3-private');
    Bus::fake([RunMyModelTryOn::class]);
    Http::fake(['*' => Http::response(['ok' => true], 200)]);

    $userA = User::factory()->create();
    $userB = User::factory()->create();

    $cat = Category::create(['name' => 'Men Tops', 'slug' => 'men-tops', 'gender' => 'men']);
    $prod = Product::create([
        'category_id' => $cat->id,
        'name' => 'Tee',
        'price_cents' => 3000,
        'thumb_url' => '/dev-models/men/tee.webp',
        'size_group' => 'upper',
        'active' => true,
    ]);

    $variantIds = [];
    for ($i = 1; $i <= 21; $i++) {
        $v = ProductVariant::create([
            'product_id' => $prod->id,
            'color' => "Color $i",
            'hex' => '#000000',
            'model_image_url' => "/dev-models/men/tee-$i.webp",
            'sku' => "SKU-$i",
            'stock' => 5,
        ]);
        $variantIds[] = $v->id;
    }

    // Upload model photo for User A
    $photo = UploadedFile::fake()->image('model.jpg', 500, 700);
    $this->actingAs($userA)->postJson('/api/my-model', [
        'photo' => $photo,
        'consent' => '1',
        'keep_days' => 30,
    ])->assertStatus(201)->assertJsonPath('hasPhoto', true);

    // Request variant 1 twice -> only 1 row, 1 job, 1 quota used
    $this->actingAs($userA)->postJson('/api/my-model/results', ['variant_ids' => [$variantIds[0]]])->assertStatus(200);
    $this->actingAs($userA)->postJson('/api/my-model/results', ['variant_ids' => [$variantIds[0]]])->assertStatus(200);

    expect(TryOnResult::count())->toBe(1);
    Bus::assertDispatchedTimes(RunMyModelTryOn::class, 1);

    // User B cannot read User A's results
    $this->actingAs($userB)->getJson('/api/my-model/results?variant_ids=' . $variantIds[0])
        ->assertStatus(200)
        ->assertExactJson([]);

    // Request variants 2..20 (19 more -> total 20)
    for ($i = 1; $i < 20; $i += 3) {
        $slice = array_slice($variantIds, $i, min(3, 20 - $i));
        $this->actingAs($userA)->postJson('/api/my-model/results', ['variant_ids' => $slice])->assertStatus(200);
    }

    // 21st new generation returns 429
    $this->actingAs($userA)->postJson('/api/my-model/results', ['variant_ids' => [$variantIds[20]]])
        ->assertStatus(429)
        ->assertJsonPath('remaining', 0);

    // Cached variant 1 still returns
    $this->actingAs($userA)->postJson('/api/my-model/results', ['variant_ids' => [$variantIds[0]]])
        ->assertStatus(200)
        ->assertJsonCount(1, 'results');

    // Destroy removes photo & all results
    $photoPath = ModelPhoto::where('user_id', $userA->id)->first()->path;
    $this->actingAs($userA)->deleteJson('/api/my-model')->assertStatus(204);
    expect(ModelPhoto::count())->toBe(0);
    expect(TryOnResult::count())->toBe(0);
    Storage::disk('s3-private')->assertMissing($photoPath);
});

// --- SizeRecommendationController ---

test('size recommendation picks smallest fitting size and handles missing measurements', function () {
    (new SizeChartSeeder())->run();

    $user = User::factory()->create();
    $cat = Category::create(['name' => 'Men Tops', 'slug' => 'men-tops', 'gender' => 'men']);
    $prod = Product::create([
        'category_id' => $cat->id,
        'name' => 'Shirt',
        'price_cents' => 4000,
        'thumb_url' => '/dev-models/men/shirt.webp',
        'size_group' => 'upper',
        'active' => true,
    ]);

    // No measurements yet
    $this->actingAs($user)->getJson('/api/size-recommendation?product_id=' . $prod->id)
        ->assertStatus(200)
        ->assertJsonPath('size', null);

    // Save measurements fitting M (chest 98 <= 100, waist 84 <= 86)
    $this->actingAs($user)->postJson('/api/measurements', [
        'height_cm' => 178,
        'chest_cm' => 98,
        'waist_cm' => 84,
        'hip_cm' => 99,
        'consent' => '1',
    ])->assertStatus(201);

    $this->actingAs($user)->getJson('/api/size-recommendation?product_id=' . $prod->id)
        ->assertStatus(200)
        ->assertJsonPath('size', 'M');

    // Delete measurements
    $this->actingAs($user)->deleteJson('/api/measurements')->assertStatus(204);
    $this->actingAs($user)->getJson('/api/size-recommendation?product_id=' . $prod->id)
        ->assertStatus(200)
        ->assertJsonPath('size', null);
});
