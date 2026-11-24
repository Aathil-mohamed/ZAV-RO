<?php

namespace Tests\Feature;

use Tests\TestCase;

class PingTest extends TestCase
{
    public function test_ping_endpoint_returns_ok_true(): void
    {
        $response = $this->getJson('/api/ping');

        $response->assertStatus(200)
            ->assertExactJson(['ok' => true]);
    }
}
