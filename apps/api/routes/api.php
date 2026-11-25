<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\MyModelController;
use App\Http\Controllers\SizeRecommendationController;
use App\Http\Controllers\TryOnController;
use App\Http\Controllers\UploadController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['ok' => true]));

Route::get('/catalog/{gender}', [CatalogController::class, 'index'])
    ->whereIn('gender', ['men', 'women']);

// --- Auth (Sanctum SPA cookie) ---
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('/user', function (Request $request) {
    return response()->json($request->user());
})->middleware('auth:sanctum');

// --- Phase 2: customizer ---
Route::post('/uploads', [UploadController::class, 'store'])->middleware('throttle:20,1');
Route::post('/designs', [DesignController::class, 'store'])->middleware('throttle:30,1');
Route::get('/designs/{token}', [DesignController::class, 'show']);

// --- Phase 3: AI try-on & My Model ---
Route::middleware(['auth:sanctum', 'throttle:10,60'])->group(function () {
    Route::post('/tryon', [TryOnController::class, 'store']);
    Route::get('/tryon/{id}', [TryOnController::class, 'show']);
    Route::delete('/tryon', [TryOnController::class, 'destroyAll']);
});

Route::middleware('auth:sanctum')->prefix('my-model')->group(function () {
    Route::post('/', [MyModelController::class, 'storePhoto']);
    Route::get('/', [MyModelController::class, 'show']);
    Route::delete('/', [MyModelController::class, 'destroy']);
    Route::post('/results', [MyModelController::class, 'request']);
    Route::get('/results', [MyModelController::class, 'statuses']);
});

// --- Phase 3: Size recommendation ---
Route::get('/size-chart', [SizeRecommendationController::class, 'chart']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/size-recommendation', [SizeRecommendationController::class, 'recommend']);
    Route::get('/measurements', [SizeRecommendationController::class, 'showMeasurements']);
    Route::post('/measurements', [SizeRecommendationController::class, 'storeMeasurements']);
    Route::delete('/measurements', [SizeRecommendationController::class, 'destroyMeasurements']);
});
