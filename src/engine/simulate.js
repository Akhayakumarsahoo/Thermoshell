/**
 * ThermoShelter - Time-Stepping Simulation Engine
 * Implements 24-hour explicit Euler RC solver from ThermoShelter Project Spec Section 7.7
 */

import { CONFIG } from '../config.js';
import { computeGeometry } from './geometry.js';
import { computeAllUValues, computeThermalCapacitance } from './thermalProperties.js';
import { computeHourlySolarGain } from './solarGain.js';
import { computeHourlyHeatLoss, getHourlyOutdoorTemp } from './heatLoss.js';
import { evaluateComfort } from './comfort.js';

/**
 * Runs a 24-hour lumped-capacitance RC thermal simulation
 * @param {Object} climate - Climate inputs
 * @param {Object} shelter - Shelter geometry & orientation inputs
 * @param {Object} materials - Material layers, insulation, mass and window inputs
 * @param {Object} [options]
 * @param {number} [options.initialTempC] - Optional custom initial temperature (defaults to climate.dayTempC per §7.7)
 * @returns {Object} Full simulation results
 */
export function simulate24h(climate, shelter, materials, options = {}) {
  const geom = computeGeometry(shelter);
  const uVals = computeAllUValues(shelter, materials);
  const cTotal = computeThermalCapacitance(shelter, materials);

  const precomputed = { geom, uVals };

  // Initial condition: T_in = inputs.dayTempC per Section 7.7
  let tIn = options.initialTempC !== undefined
    ? options.initialTempC
    : (climate.dayTempC ?? 8);

  const hourlyIndoorTempC = [];
  const hourlyOutdoorTempC = [];
  const hourlySolarGainW = [];
  const hourlyHeatLossW = [];

  const lossJoules = {
    walls: 0,
    roof: 0,
    floor: 0,
    windows: 0,
    doors: 0,
    ventilation: 0,
    sky: 0
  };
  let totalLossJoules = 0;
  let totalSolarJoules = 0;

  const subSteps = 60; // 60 sub-steps per hour (dt = 60s) ensures unconditional numerical stability for all thermal mass levels
  const dtSub = (CONFIG.SIM_TIMESTEP_HOURS * 3600) / subSteps;
  const T_comfort = CONFIG.COMFORT_THRESHOLD_C ?? 15;
  let supplementaryJoules = 0;

  for (let h = 0; h < 24; h++) {
    const tOut = getHourlyOutdoorTemp(climate, h);
    hourlyOutdoorTempC.push(tOut);
    hourlyIndoorTempC.push(tIn);

    const qSolar = computeHourlySolarGain(climate, shelter, materials, h);
    hourlySolarGainW.push(qSolar);
    totalSolarJoules += qSolar * 3600;

    let hourLossSum = 0;

    for (let s = 0; s < subSteps; s++) {
      const qLoss = computeHourlyHeatLoss(climate, shelter, materials, tIn, h, precomputed);

      lossJoules.walls += qLoss.walls * dtSub;
      lossJoules.roof += qLoss.roof * dtSub;
      lossJoules.floor += qLoss.floor * dtSub;
      lossJoules.windows += qLoss.windows * dtSub;
      lossJoules.doors += qLoss.doors * dtSub;
      lossJoules.ventilation += qLoss.ventilation * dtSub;
      lossJoules.sky += qLoss.sky * dtSub;
      totalLossJoules += qLoss.total * dtSub;
      hourLossSum += qLoss.total;

      // Stable Euler sub-step (dt = 60s)
      const dT = ((qSolar - qLoss.total) * dtSub) / cTotal;
      tIn += dT;
    }

    hourlyHeatLossW.push(hourLossSum / subSteps);

    // If indoor temperature drops below comfort threshold, calculate required auxiliary heating power (W):
    if (tIn < T_comfort) {
      const qLossAtComfort = computeHourlyHeatLoss(climate, shelter, materials, T_comfort, h, precomputed).total;
      const deficitWatts = Math.max(0, qLossAtComfort - qSolar);
      supplementaryJoules += deficitWatts * 3600;
    }
  }

  const JOULES_TO_KWH = 1 / (3600 * 1000);
  const solarHeatGainKwh = totalSolarJoules * JOULES_TO_KWH;
  const totalHeatLossKwh = totalLossJoules * JOULES_TO_KWH;

  const heatLossByComponentKwh = {
    walls: lossJoules.walls * JOULES_TO_KWH,
    roof: lossJoules.roof * JOULES_TO_KWH,
    floor: lossJoules.floor * JOULES_TO_KWH,
    windows: lossJoules.windows * JOULES_TO_KWH,
    doors: lossJoules.doors * JOULES_TO_KWH,
    ventilation: lossJoules.ventilation * JOULES_TO_KWH,
    sky: lossJoules.sky * JOULES_TO_KWH
  };

  const comfort = evaluateComfort(hourlyIndoorTempC, cTotal, null, supplementaryJoules);

  return {
    hourlyIndoorTempC,
    hourlyOutdoorTempC,
    hourlySolarGainW,
    hourlyHeatLossW,
    lowestOutdoorTempNightC: Math.min(...hourlyOutdoorTempC),
    lowestIndoorTempNightC: comfort.lowestIndoorTempNightC,
    highestIndoorTempDayC: comfort.highestIndoorTempDayC,
    solarHeatGainKwh,
    heatLossByComponentKwh,
    totalHeatLossKwh,
    comfortAcceptable: comfort.comfortAcceptable,
    hoursBelowComfortThreshold: comfort.hoursBelowComfortThreshold,
    supplementaryHeatingNeededKwhPerDay: comfort.supplementaryHeatingNeededKwhPerDay,
    cTotal,
    geometry: geom,
    uValues: uVals
  };
}
