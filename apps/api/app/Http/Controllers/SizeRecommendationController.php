<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\SizeChart;
use App\Models\UserMeasurement;
use Illuminate\Http\Request;

class SizeRecommendationController extends Controller
{
    public function recommend(Request $request)
    {
        $request->validate(['product_id' => 'required|integer|exists:products,id']);

        $m = $request->user()->measurements()->first();
        $p = Product::with('category')->findOrFail($request->product_id);

        if (! $m) {
            return ['size' => null, 'reason' => 'Add your measurements to get a size.'];
        }

        $group = $p->size_group ?? 'upper';
        $gender = $p->category?->gender === 'women' ? 'women' : 'men';

        $sizes = SizeChart::where('gender', $gender)
            ->where('garment_group', $group)
            ->orderBy('chest_cm')
            ->orderBy('waist_cm')
            ->get();

        foreach ($sizes as $s) {
            $fits = ($s->chest_cm === null || $m->chest_cm === null || $m->chest_cm <= $s->chest_cm)
                && ($s->waist_cm === null || $m->waist_cm === null || $m->waist_cm <= $s->waist_cm)
                && ($s->hip_cm === null || $m->hip_cm === null || $m->hip_cm <= $s->hip_cm);
            if ($fits) {
                return ['size' => $s->size, 'reason' => 'Based on your measurements and our size chart.'];
            }
        }

        return [
            'size' => $sizes->last()?->size,
            'reason' => 'You are at the top of our size range; check the size chart.',
        ];
    }

    public function showMeasurements(Request $request)
    {
        return $request->user()->measurements()->first() ?? response()->json(null);
    }

    public function storeMeasurements(Request $request)
    {
        $data = $request->validate([
            'height_cm' => 'required|integer|min:120|max:230',
            'chest_cm' => 'nullable|integer|min:60|max:160',
            'waist_cm' => 'nullable|integer|min:50|max:150',
            'hip_cm' => 'nullable|integer|min:60|max:165',
            'consent' => 'accepted',
        ]);

        return UserMeasurement::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'height_cm' => $data['height_cm'],
                'chest_cm' => $data['chest_cm'] ?? null,
                'waist_cm' => $data['waist_cm'] ?? null,
                'hip_cm' => $data['hip_cm'] ?? null,
            ]
        );
    }

    public function destroyMeasurements(Request $request)
    {
        $request->user()->measurements()?->delete();

        return response()->noContent();
    }

    public function chart(Request $request)
    {
        $gender = $request->query('gender', 'men');
        $group = $request->query('group', 'upper');

        return SizeChart::where('gender', $gender)
            ->where('garment_group', $group)
            ->orderBy('id')
            ->get(['size', 'chest_cm', 'waist_cm', 'hip_cm']);
    }
}
