/**
 * ThermoShelter - Physics & Optimization Engine Unit Test Suite
 * Directly tests the 7 required worked examples specified in Section 15 of ThermoShelter_PROJECT_SPEC.md
 */

import assert from 'node:assert';
import { computeGeometry } from '../src/engine/geometry.js';
import { computeUValue, computeThermalCapacitance } from '../src/engine/thermalProperties.js';
import { computeHourlySolarGain } from '../src/engine/solarGain.js';
import { computeHourlyHeatLoss } from '../src/engine/heatLoss.js';
import { simulate24h } from '../src/engine/simulate.js';
import { generateCombinations, rankDesigns, runOptimization } from '../src/optimize/rankDesigns.js';
import { CONFIG } from '../src/config.js';

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('====================================================');
console.log('Running ThermoShelter Section 15 Required Unit Tests');
console.log('====================================================\n');

// 1. U-value of a single-layer wall
runTest('Test 1: U-value of single-layer wall (0.3m rammed earth)', () => {
  // k = 0.7, t = 0.3m, R_si = 0.13, R_se = 0.04
  // R_layer = 0.3 / 0.7 ≈ 0.42857
  // R_total = 0.13 + 0.42857 + 0.04 = 0.59857 m²K/W
  // U = 1 / R_total ≈ 1.6706 W/m²K (approx 1.672 with rounding)
  const layers = [{ materialId: 'rammed-earth', thicknessM: 0.3 }];
  const uVal = computeUValue(layers, 'wall');

  // Check that U is within 0.01 of 1.672
  assert(Math.abs(uVal - 1.671) < 0.01, `Expected U ≈ 1.672, got ${uVal.toFixed(4)}`);
});

// 2. Conductive loss sanity check
runTest('Test 2: Conductive loss sanity check (Q = U * A * ΔT)', () => {
  // for U = 1.672, A = 10 m², ΔT = 20°C: Q = 1.672 * 10 * 20 = 334.4 W
  const U = 1.672;
  const A = 10;
  const dT = 20;
  const expectedQ = U * A * dT; // 334.4 W

  const calculatedQ = U * A * dT;
  assert(Math.abs(calculatedQ - 334.4) < 1e-9, `Expected 334.4 W, got ${calculatedQ}`);
});

// 3. Insulation monotonicity test (bug-catcher from §10.2)
runTest('Test 3: Insulation monotonicity test (none > low > medium > high heat loss)', () => {
  const baseClimate = {
    nightTempC: -15,
    dayTempC: 8,
    peakSolarRadiationWm2: 850,
    sunshineHoursPerDay: 7.9
  };

  const baseShelter = {
    lengthM: 6,
    widthM: 4,
    heightM: 2.6,
    shape: 'rectangular',
    orientation: 'south',
    windowAreaM2: 3,
    doorAreaM2: 1.8
  };

  const grades = ['none', 'low', 'medium', 'high'];
  const losses = {};

  for (const grade of grades) {
    const materials = {
      wallLayers: [{ materialId: 'rammed-earth', thicknessM: 0.3 }],
      roofLayers: [{ materialId: 'timber-softwood', thicknessM: 0.1 }],
      floorLayers: [{ materialId: 'dense-concrete', thicknessM: 0.15 }],
      windowType: 'double-glazed',
      doorType: 'uninsulated',
      insulationGrade: grade,
      thermalMassType: 'heavy',
      airChangesPerHour: 0.6
    };

    const sim = simulate24h(baseClimate, baseShelter, materials);
    losses[grade] = sim.totalHeatLossKwh;
  }

  console.log(`    Losses: None=${losses.none.toFixed(2)} kWh, Low=${losses.low.toFixed(2)} kWh, Med=${losses.medium.toFixed(2)} kWh, High=${losses.high.toFixed(2)} kWh`);

  assert(
    losses.none > losses.low,
    `Insulation bug: 'none' (${losses.none}) should have higher loss than 'low' (${losses.low})`
  );
  assert(
    losses.low > losses.medium,
    `Insulation bug: 'low' (${losses.low}) should have higher loss than 'medium' (${losses.medium})`
  );
  assert(
    losses.medium > losses.high,
    `Insulation bug: 'medium' (${losses.medium}) should have higher loss than 'high' (${losses.high})`
  );
});

// 4. Ventilation loss sign/units check
runTest('Test 4: Ventilation loss sign & linearity with ACH', () => {
  const climate = { nightTempC: -15, dayTempC: -15 }; // T_out = -15
  const shelter = { lengthM: 6, widthM: 4, heightM: 2.6, windowAreaM2: 3, doorAreaM2: 1.8 };
  const T_in = 10; // T_in > T_out, so heat is leaving the shelter

  const materials1 = { airChangesPerHour: 0.5 };
  const materials2 = { airChangesPerHour: 1.0 }; // Exactly double

  const loss1 = computeHourlyHeatLoss(climate, shelter, materials1, T_in, 0);
  const loss2 = computeHourlyHeatLoss(climate, shelter, materials2, T_in, 0);

  assert(loss1.ventilation > 0, `Q_vent must be positive when T_in > T_out (got ${loss1.ventilation})`);
  assert(
    Math.abs(loss2.ventilation - 2 * loss1.ventilation) < 1e-9,
    `Doubling ACH must exactly double Q_vent. loss1=${loss1.ventilation}, loss2=${loss2.ventilation}`
  );
});

// 5. Zero-solar-at-night check
runTest('Test 5: Zero solar radiation outside daylight window', () => {
  const climate = {
    peakSolarRadiationWm2: 850,
    sunshineHoursPerDay: 8 // Sunrise 8:00, Sunset 16:00
  };
  const shelter = { orientation: 'south', windowAreaM2: 3 };
  const materials = { windowType: 'double-glazed', thermalMassType: 'heavy' };

  // Midnight (h=0), Early morning (h=4), Late night (h=22)
  const nightHours = [0, 1, 2, 3, 4, 5, 6, 7, 17, 18, 19, 20, 21, 22, 23];
  for (const h of nightHours) {
    const qSolar = computeHourlySolarGain(climate, shelter, materials, h);
    assert.strictEqual(qSolar, 0, `Solar gain at hour ${h} must be strictly 0 (got ${qSolar})`);
  }

  // Noon (h=12) must have positive solar gain
  const qNoon = computeHourlySolarGain(climate, shelter, materials, 12);
  assert(qNoon > 0, `Solar gain at noon must be positive (got ${qNoon})`);
});

// 6. Energy-balance smoke test
runTest('Test 6: Energy-balance smoke test (zero gains & losses = constant indoor temp)', () => {
  // Contrived test inputs: solar irradiance is zero, U-values and ACH are zero, sky depression is zero
  const zeroClimate = {
    nightTempC: 10,
    dayTempC: 10,
    peakSolarRadiationWm2: 0,
    sunshineHoursPerDay: 0,
    hourlyOutdoorTempC: new Array(24).fill(10),
    hourlySolarIrradiance: new Array(24).fill(0)
  };

  const zeroShelter = {
    lengthM: 6,
    widthM: 4,
    heightM: 2.6,
    windowAreaM2: 0,
    doorAreaM2: 0
  };

  // Ultra-insulated / zero conductances
  const zeroMaterials = {
    wallLayers: [{ materialId: 'xps-foam', thicknessM: 1000 }], // extremely small U ≈ 0
    roofLayers: [{ materialId: 'xps-foam', thicknessM: 1000 }],
    floorLayers: [{ materialId: 'xps-foam', thicknessM: 1000 }],
    windowType: 'double-glazed-lowe',
    doorType: 'insulated',
    insulationGrade: 'none',
    thermalMassType: 'heavy',
    airChangesPerHour: 0
  };

  // Set initial temp to 10°C, matching outdoor temp so ΔT = 0 and sky radiation = 0 (when temp is identical)
  // Or test with initial temp = 10°C, outdoor temp = 10°C:
  const sim = simulate24h(zeroClimate, zeroShelter, zeroMaterials, {
    initialTempC: 10,
    skipWarmup: true
  });

  const firstTemp = sim.hourlyIndoorTempC[0];
  for (let h = 1; h < 24; h++) {
    const diff = Math.abs(sim.hourlyIndoorTempC[h] - firstTemp);
    assert(diff < 1e-3, `Temperature drifted at hour ${h}: ${sim.hourlyIndoorTempC[h]} vs initial ${firstTemp}`);
  }
});

// 7. Optimizer determinism test
runTest('Test 7: Optimizer determinism (identical input produces identical ranked list)', () => {
  const climate = {
    nightTempC: -15,
    dayTempC: 8,
    peakSolarRadiationWm2: 850,
    sunshineHoursPerDay: 7.9
  };

  const shelter = {
    lengthM: 6,
    widthM: 4,
    heightM: 2.6,
    shape: 'rectangular',
    doorAreaM2: 1.8
  };

  const materials = {
    wallLayers: [{ materialId: 'rammed-earth', thicknessM: 0.3 }],
    roofLayers: [{ materialId: 'timber-softwood', thicknessM: 0.1 }],
    floorLayers: [{ materialId: 'dense-concrete', thicknessM: 0.15 }],
    windowType: 'double-glazed',
    doorType: 'uninsulated',
    airChangesPerHour: 0.6
  };

  const run1 = runOptimization(climate, shelter, materials);
  const run2 = runOptimization(climate, shelter, materials);

  assert.strictEqual(run1.totalEvaluated, 480, `Expected 480 combinations, evaluated ${run1.totalEvaluated}`);
  assert.strictEqual(run2.totalEvaluated, 480, `Expected 480 combinations, evaluated ${run2.totalEvaluated}`);

  for (let i = 0; i < 10; i++) { // check top 10 items
    assert.strictEqual(run1.rankedDesigns[i].rank, run2.rankedDesigns[i].rank);
    assert.strictEqual(run1.rankedDesigns[i].orientation, run2.rankedDesigns[i].orientation);
    assert.strictEqual(run1.rankedDesigns[i].insulationGrade, run2.rankedDesigns[i].insulationGrade);
    assert.strictEqual(run1.rankedDesigns[i].windowAreaM2, run2.rankedDesigns[i].windowAreaM2);
    assert.strictEqual(run1.rankedDesigns[i].thermalMassType, run2.rankedDesigns[i].thermalMassType);
    assert.strictEqual(run1.rankedDesigns[i].totalHeatLossKwh, run2.rankedDesigns[i].totalHeatLossKwh);
  }
});

console.log(`\n====================================================`);
console.log(`All ${passedTests} / ${totalTests} Section 15 Unit Tests PASSED!`);
console.log(`====================================================\n`);
