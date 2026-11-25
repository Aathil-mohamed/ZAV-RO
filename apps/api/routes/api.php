<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\UploadController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['ok' => true]));

Route::get('/catalog/{gender}', [CatalogController::class, 'index'])
    ->whereIn('gender', ['men', 'women']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// --- Phase 2: customizer ---
Route::post('/uploads', [UploadController::class, 'store'])->middleware('throttle:20,1');
Route::post('/designs', [DesignController::class, 'store'])->middleware('throttle:30,1');
Route::get('/designs/{token}', [DesignController::class, 'show']);
