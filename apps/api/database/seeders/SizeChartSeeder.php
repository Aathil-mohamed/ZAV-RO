<?php

namespace Database\Seeders;

use App\Models\SizeChart;
use Illuminate\Database\Seeder;

class SizeChartSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            // Men's upper
            ['gender' => 'men', 'garment_group' => 'upper', 'size' => 'XS',  'chest_cm' => 88,  'waist_cm' => 74,  'hip_cm' => 90],
            ['gender' => 'men', 'garment_group' => 'upper', 'size' => 'S',   'chest_cm' => 94,  'waist_cm' => 80,  'hip_cm' => 96],
            ['gender' => 'men', 'garment_group' => 'upper', 'size' => 'M',   'chest_cm' => 100, 'waist_cm' => 86,  'hip_cm' => 102],
            ['gender' => 'men', 'garment_group' => 'upper', 'size' => 'L',   'chest_cm' => 108, 'waist_cm' => 94,  'hip_cm' => 108],
            ['gender' => 'men', 'garment_group' => 'upper', 'size' => 'XL',  'chest_cm' => 116, 'waist_cm' => 102, 'hip_cm' => 116],
            ['gender' => 'men', 'garment_group' => 'upper', 'size' => 'XXL', 'chest_cm' => 124, 'waist_cm' => 110, 'hip_cm' => 124],

            // Men's lower
            ['gender' => 'men', 'garment_group' => 'lower', 'size' => 'XS',  'chest_cm' => null, 'waist_cm' => 74,  'hip_cm' => 90],
            ['gender' => 'men', 'garment_group' => 'lower', 'size' => 'S',   'chest_cm' => null, 'waist_cm' => 80,  'hip_cm' => 96],
            ['gender' => 'men', 'garment_group' => 'lower', 'size' => 'M',   'chest_cm' => null, 'waist_cm' => 86,  'hip_cm' => 102],
            ['gender' => 'men', 'garment_group' => 'lower', 'size' => 'L',   'chest_cm' => null, 'waist_cm' => 94,  'hip_cm' => 108],
            ['gender' => 'men', 'garment_group' => 'lower', 'size' => 'XL',  'chest_cm' => null, 'waist_cm' => 102, 'hip_cm' => 116],
            ['gender' => 'men', 'garment_group' => 'lower', 'size' => 'XXL', 'chest_cm' => null, 'waist_cm' => 110, 'hip_cm' => 124],

            // Women's upper
            ['gender' => 'women', 'garment_group' => 'upper', 'size' => 'XS',  'chest_cm' => 82,  'waist_cm' => 64,  'hip_cm' => 88],
            ['gender' => 'women', 'garment_group' => 'upper', 'size' => 'S',   'chest_cm' => 86,  'waist_cm' => 68,  'hip_cm' => 92],
            ['gender' => 'women', 'garment_group' => 'upper', 'size' => 'M',   'chest_cm' => 92,  'waist_cm' => 74,  'hip_cm' => 98],
            ['gender' => 'women', 'garment_group' => 'upper', 'size' => 'L',   'chest_cm' => 98,  'waist_cm' => 80,  'hip_cm' => 104],
            ['gender' => 'women', 'garment_group' => 'upper', 'size' => 'XL',  'chest_cm' => 106, 'waist_cm' => 88,  'hip_cm' => 112],
            ['gender' => 'women', 'garment_group' => 'upper', 'size' => 'XXL', 'chest_cm' => 114, 'waist_cm' => 96,  'hip_cm' => 120],

            // Women's lower
            ['gender' => 'women', 'garment_group' => 'lower', 'size' => 'XS',  'chest_cm' => null, 'waist_cm' => 64,  'hip_cm' => 88],
            ['gender' => 'women', 'garment_group' => 'lower', 'size' => 'S',   'chest_cm' => null, 'waist_cm' => 68,  'hip_cm' => 92],
            ['gender' => 'women', 'garment_group' => 'lower', 'size' => 'M',   'chest_cm' => null, 'waist_cm' => 74,  'hip_cm' => 98],
            ['gender' => 'women', 'garment_group' => 'lower', 'size' => 'L',   'chest_cm' => null, 'waist_cm' => 80,  'hip_cm' => 104],
            ['gender' => 'women', 'garment_group' => 'lower', 'size' => 'XL',  'chest_cm' => null, 'waist_cm' => 88,  'hip_cm' => 112],
            ['gender' => 'women', 'garment_group' => 'lower', 'size' => 'XXL', 'chest_cm' => null, 'waist_cm' => 96,  'hip_cm' => 120],

            // Women's dress
            ['gender' => 'women', 'garment_group' => 'dress', 'size' => 'XS',  'chest_cm' => 82,  'waist_cm' => 64,  'hip_cm' => 88],
            ['gender' => 'women', 'garment_group' => 'dress', 'size' => 'S',   'chest_cm' => 86,  'waist_cm' => 68,  'hip_cm' => 92],
            ['gender' => 'women', 'garment_group' => 'dress', 'size' => 'M',   'chest_cm' => 92,  'waist_cm' => 74,  'hip_cm' => 98],
            ['gender' => 'women', 'garment_group' => 'dress', 'size' => 'L',   'chest_cm' => 98,  'waist_cm' => 80,  'hip_cm' => 104],
            ['gender' => 'women', 'garment_group' => 'dress', 'size' => 'XL',  'chest_cm' => 106, 'waist_cm' => 88,  'hip_cm' => 112],
            ['gender' => 'women', 'garment_group' => 'dress', 'size' => 'XXL', 'chest_cm' => 114, 'waist_cm' => 96,  'hip_cm' => 120],
        ];

        foreach ($rows as $r) {
            SizeChart::updateOrCreate(
                ['gender' => $r['gender'], 'garment_group' => $r['garment_group'], 'size' => $r['size']],
                ['chest_cm' => $r['chest_cm'], 'waist_cm' => $r['waist_cm'], 'hip_cm' => $r['hip_cm']]
            );
        }
    }
}
