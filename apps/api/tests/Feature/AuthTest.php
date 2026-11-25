<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('user can register, fetch /api/user, logout, and login', function () {
    $headers = ['Referer' => 'http://localhost:3000'];

    $reg = $this->withHeaders($headers)->postJson('/api/auth/register', [
        'name' => 'Aathil',
        'email' => 'aathil@example.com',
        'password' => 'secret1234',
    ]);

    $reg->assertStatus(201)->assertJsonPath('email', 'aathil@example.com');
    expect(User::where('email', 'aathil@example.com')->exists())->toBeTrue();

    $this->withHeaders($headers)->getJson('/api/user')->assertStatus(200)->assertJsonPath('email', 'aathil@example.com');

    $this->withHeaders($headers)->postJson('/api/auth/logout')->assertStatus(204);

    // After logout, clear guard state and verify login works
    $this->app['auth']->forgetGuards();
    $this->withHeaders($headers)->getJson('/api/user')->assertStatus(401);

    $login = $this->withHeaders($headers)->postJson('/api/auth/login', [
        'email' => 'aathil@example.com',
        'password' => 'secret1234',
    ]);
    $login->assertStatus(200)->assertJsonPath('email', 'aathil@example.com');
});

test('login rejects invalid password', function () {
    User::factory()->create(['email' => 'bad@example.com', 'password' => 'correctpass']);

    $this->postJson('/api/auth/login', [
        'email' => 'bad@example.com',
        'password' => 'wrongpass',
    ])->assertStatus(422);
});
