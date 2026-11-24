<?php

use App\Http\Controllers\CatalogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['ok' => true]));

Route::get('/catalog/{gender}', [CatalogController::class, 'index'])
    ->whereIn('gender', ['men', 'women']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
