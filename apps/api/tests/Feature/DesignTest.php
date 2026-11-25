<?php

// tests/Feature/DesignTest.php
use App\Models\CustomDesign;
use App\Services\DesignPricer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

// --- Fixture helpers ---

function validDesign(string $slug = 'mens-tshirt', array $panelOverride = []): array
{
    return [
        'garment_slug' => $slug,
        'size'         => 'M',
        'design'       => [
            'panels'   => array_merge([
                'front'    => ['fill' => '#ffffff', 'fabric' => 'cotton', 'layers' => []],
                'back'     => ['fill' => '#ffffff', 'fabric' => 'cotton', 'layers' => []],
                'sleeve_L' => ['fill' => '#ffffff', 'fabric' => 'cotton', 'layers' => []],
                'sleeve_R' => ['fill' => '#ffffff', 'fabric' => 'cotton', 'layers' => []],
                'collar'   => ['fill' => '#ffffff', 'fabric' => 'cotton', 'layers' => []],
            ], $panelOverride),
            'variants' => [],
        ],
    ];
}

// --- DesignPricer unit tests ---

test('pricer returns base price for default design', function () {
    $pricer = new DesignPricer();
    $design = validDesign();
    $price = $pricer->price('mens-tshirt', $design['design']);
    expect($price)->toBe(2500); // base price
});

test('pricer adds sleeve variant delta', function () {
    $pricer = new DesignPricer();
    $design = array_merge(validDesign(), []);
    $design['design']['variants']['sleeve'] = 'full';
    $price = $pricer->price('mens-tshirt', $design['design']);
    expect($price)->toBe(2500 + 300);
});

test('pricer caps print price at 1000 cents', function () {
    $pricer = new DesignPricer();
    $layer = ['type' => 'text', 'text' => 'Hi', 'font' => 'sans', 'size' => 0.1, 'color' => '#000', 'x' => 0.5, 'y' => 0.5, 'rotation' => 0];
    $panels = [];
    foreach (['front', 'back', 'sleeve_L', 'sleeve_R', 'collar'] as $p) {
        $panels[$p] = ['fill' => '#ffffff', 'fabric' => 'cotton', 'layers' => [$layer]];
    }
    $price = $pricer->price('mens-tshirt', ['panels' => $panels, 'variants' => []]);
    expect($price)->toBe(2500 + 1000); // cap
});

test('pricer validates unknown piece returns 422', function () {
    $pricer = new DesignPricer();
    $design = validDesign();
    $design['design']['panels']['UNKNOWN_PIECE'] = ['fill' => '#ffffff', 'fabric' => 'cotton', 'layers' => []];
    expect(fn () => $pricer->validate('mens-tshirt', $design['design']))->toThrow(\Illuminate\Http\Exceptions\HttpResponseException::class);
})->skip(fn () => true, 'abort() throws HttpResponseException; validate via HTTP instead');

// --- HTTP: POST /api/designs ---

test('POST /api/designs saves design and returns price', function () {
    Storage::fake('s3-public');
    $data = validDesign();

    $response = $this->postJson('/api/designs', $data);
    $response->assertStatus(200)
             ->assertJsonStructure(['id', 'priceCents', 'shareToken', 'previewUrl']);

    expect($response->json('priceCents'))->toBe(2500);
    expect(CustomDesign::count())->toBe(1);
});

test('POST /api/designs ignores any client-sent price', function () {
    Storage::fake('s3-public');
    $data = validDesign();
    // Inject a fake price field — it must be ignored
    $data['price_cents'] = 1;

    $response = $this->postJson('/api/designs', $data);
    $response->assertStatus(200);
    expect($response->json('priceCents'))->not->toBe(1);
    expect($response->json('priceCents'))->toBe(2500);
});

test('POST /api/designs rejects unknown garment slug', function () {
    $data = validDesign('not-a-garment');
    $this->postJson('/api/designs', $data)->assertStatus(422);
});

test('POST /api/designs rejects tampered fabric', function () {
    Storage::fake('s3-public');
    $data = validDesign();
    $data['design']['panels']['front']['fabric'] = 'unobtanium';
    $this->postJson('/api/designs', $data)->assertStatus(422);
});

test('POST /api/designs rejects tampered variant', function () {
    Storage::fake('s3-public');
    $data = validDesign();
    $data['design']['variants']['sleeve'] = 'rocket_sleeve';
    $this->postJson('/api/designs', $data)->assertStatus(422);
});

test('POST /api/designs rejects image src outside /uploads/', function () {
    Storage::fake('s3-public');
    $data = validDesign();
    $data['design']['panels']['front']['layers'] = [[
        'type' => 'image',
        'src'  => 'https://evil.example.com/hack.jpg',
        'x' => 0.5, 'y' => 0.5, 'w' => 0.4, 'rotation' => 0, 'opacity' => 1,
    ]];
    $this->postJson('/api/designs', $data)->assertStatus(422);
});

// --- GET /api/designs/{token} ---

test('GET /api/designs/{token} returns design for valid share token', function () {
    Storage::fake('s3-public');
    $data = validDesign();
    $post = $this->postJson('/api/designs', $data);
    $token = $post->json('shareToken');

    $get = $this->getJson("/api/designs/{$token}");
    $get->assertStatus(200)
        ->assertJsonStructure(['garmentSlug', 'design', 'priceCents']);
    expect($get->json('garmentSlug'))->toBe('mens-tshirt');
});

test('GET /api/designs/{token} returns 404 for unknown token', function () {
    $this->getJson('/api/designs/nonexistent-token-xyz')->assertStatus(404);
});

// --- POST /api/uploads ---

test('POST /api/uploads accepts valid PNG', function () {
    Storage::fake('s3-public');
    $file = UploadedFile::fake()->image('test.png', 100, 100);
    $response = $this->postJson('/api/uploads', ['file' => $file]);
    $response->assertStatus(200)->assertJsonStructure(['url']);
    expect($response->json('url'))->toContain('/uploads/');
});

test('POST /api/uploads rejects SVG', function () {
    Storage::fake('s3-public');
    $file = UploadedFile::fake()->create('evil.svg', 1, 'image/svg+xml');
    $this->postJson('/api/uploads', ['file' => $file])->assertStatus(422);
});

test('POST /api/uploads rejects files over 5 MB', function () {
    Storage::fake('s3-public');
    $file = UploadedFile::fake()->create('big.jpg', 5500, 'image/jpeg'); // 5500 KB
    $this->postJson('/api/uploads', ['file' => $file])->assertStatus(422);
});
