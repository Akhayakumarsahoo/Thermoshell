/**
 * ThermoShelter - Design Optimization Engine
 * Implements 480-combination discrete grid search & lexicographic ranker
 * From ThermoShelter Project Spec Section 10
 */

import { simulate24h } from '../engine/simulate.js';

export const OPTIMIZATION_SPACE = {
  orientations: [
    'south',
    'south-east',
    'south-west',
    'east',
    'west',
    'north-east',
    'north-west',
    'north'
  ],
  insulationGrades: ['none', 'low', 'medium', 'high'],
  windowAreasM2: [1.5, 3.0, 4.5],
  thermalMassTypes: ['none', 'light', 'medium', 'heavy', 'trombe-wall']
};

/**
 * Generates the discrete grid search parameter space (480 combinations)
 * @param {Object} baseShelter
 * @param {Object} baseMaterials
 * @returns {Array<Object>} List of design configurations
 */
export function generateCombinations(baseShelter, baseMaterials) {
  const combinations = [];

  for (const orientation of OPTIMIZATION_SPACE.orientations) {
    for (const insulationGrade of OPTIMIZATION_SPACE.insulationGrades) {
      for (const windowAreaM2 of OPTIMIZATION_SPACE.windowAreasM2) {
        for (const thermalMassType of OPTIMIZATION_SPACE.thermalMassTypes) {
          const shelter = {
            ...baseShelter,
            orientation,
            windowAreaM2
          };

          const materials = {
            ...baseMaterials,
            insulationGrade,
            thermalMassType
          };

          combinations.push({
            orientation,
            insulationGrade,
            windowAreaM2,
            thermalMassType,
            shelter,
            materials
          });
        }
      }
    }
  }

  return combinations;
}

/**
 * Ranks simulation results using the exact lexicographic order from Section 10.2
 * 1. comfortAcceptable descending (true > false)
 * 2. totalHeatLossKwh ascending (lower is better)
 * 3. solarHeatGainKwh descending (higher is better)
 * 4. supplementaryHeatingNeededKwhPerDay ascending (lower is better)
 * @param {Array<Object>} results
 * @returns {Array<Object>} Sorted list of results with rank property
 */
export function rankDesigns(results) {
  const sorted = [...results].sort((a, b) => {
    // 1. Comfort outcome: designs achieving comfort (>= 15°C) rank first
    const comfortA = a.comfortAcceptable ? 1 : 0;
    const comfortB = b.comfortAcceptable ? 1 : 0;
    if (comfortB !== comfortA) {
      return comfortB - comfortA;
    }

    // 2. Supplementary heating needed ascending (minimizes fossil fuel consumption per SIH PS 26051)
    const supDiff = a.supplementaryHeatingNeededKwhPerDay - b.supplementaryHeatingNeededKwhPerDay;
    if (Math.abs(supDiff) > 0.05) {
      return supDiff;
    }

    // 3. Highest nighttime minimum temperature (best passive temperature maintenance through freezing nights)
    const tempDiff = b.lowestIndoorTempNightC - a.lowestIndoorTempNightC;
    if (Math.abs(tempDiff) > 0.05) {
      return tempDiff;
    }

    // 4. Solar heat gain descending (higher solar harvest = better)
    const solarDiff = b.solarHeatGainKwh - a.solarHeatGainKwh;
    if (Math.abs(solarDiff) > 1e-6) {
      return solarDiff;
    }

    // 5. Total heat loss ascending
    return a.totalHeatLossKwh - b.totalHeatLossKwh;
  });

  return sorted.map((res, index) => ({
    ...res,
    rank: index + 1
  }));
}

/**
 * Runs complete optimization search across all 480 combinations
 * @param {Object} climate
 * @param {Object} baseShelter
 * @param {Object} baseMaterials
 * @returns {Object} { rankedDesigns, totalEvaluated, bestDesign }
 */
export function runOptimization(climate, baseShelter, baseMaterials) {
  const combinations = generateCombinations(baseShelter, baseMaterials);
  const evaluated = [];

  for (const combo of combinations) {
    const sim = simulate24h(climate, combo.shelter, combo.materials);
    evaluated.push({
      ...combo,
      ...sim
    });
  }

  const rankedDesigns = rankDesigns(evaluated);
  const bestDesign = rankedDesigns[0] || null;

  return {
    rankedDesigns,
    totalEvaluated: rankedDesigns.length,
    bestDesign,
    ranked: rankedDesigns,
    best: bestDesign
  };
}
