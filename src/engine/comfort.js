/**
 * ThermoShelter - Comfort Evaluation Engine
 * Implements equations from ThermoShelter Project Spec Section 7.8
 */

import { CONFIG } from '../config.js';

/**
 * Assesses thermal comfort metrics for a 24-hour simulation
 * @param {number[]} hourlyIndoorTempC - Array of 24 hourly indoor temperatures
 * @param {number} cTotal - Total thermal capacitance in J/K
 * @param {number} [customThresholdC] - Optional override for comfort threshold
 * @returns {Object} Comfort assessment results
 */
export function evaluateComfort(hourlyIndoorTempC, cTotal, customThresholdC = null, supplementaryJoulesOverride = null) {
  const threshold = (customThresholdC !== null && !isNaN(customThresholdC))
    ? customThresholdC
    : CONFIG.COMFORT_THRESHOLD_C;

  const minIndoor = Math.min(...hourlyIndoorTempC);
  const maxIndoor = Math.max(...hourlyIndoorTempC);
  const comfortAcceptable = minIndoor >= threshold;

  let hoursBelow = 0;
  let supplementaryHeatingJoules = supplementaryJoulesOverride !== null ? supplementaryJoulesOverride : 0;

  if (supplementaryJoulesOverride === null) {
    for (let h = 0; h < hourlyIndoorTempC.length; h++) {
      const tIn = hourlyIndoorTempC[h];
      if (tIn < threshold) {
        hoursBelow++;
        const deficitDegC = threshold - tIn;
        // Energy needed each hour to hold indoor temperature at the comfort threshold:
        // Q = C_total * ΔT (in Joules)
        supplementaryHeatingJoules += cTotal * deficitDegC;
      }
    }
  } else {
    for (let h = 0; h < hourlyIndoorTempC.length; h++) {
      if (hourlyIndoorTempC[h] < threshold) {
        hoursBelow++;
      }
    }
  }

  // Convert Joules to kWh: 1 kWh = 3.6e6 Joules
  const supplementaryHeatingNeededKwhPerDay = supplementaryHeatingJoules / (3600 * 1000);

  return {
    comfortAcceptable,
    hoursBelowComfortThreshold: hoursBelow,
    lowestIndoorTempNightC: minIndoor,
    highestIndoorTempDayC: maxIndoor,
    comfortThresholdC: threshold,
    supplementaryHeatingNeededKwhPerDay
  };
}
