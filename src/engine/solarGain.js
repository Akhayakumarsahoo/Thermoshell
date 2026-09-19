/**
 * ThermoShelter - Solar Gain Engine
 * Implements equations from ThermoShelter Project Spec Section 7.4
 */

import { WINDOW_TYPES } from '../data/materials.js';

export const ORIENTATION_FACTORS = {
  'south': 1.00,
  'south-east': 0.85,
  'south-west': 0.85,
  'east': 0.55,
  'west': 0.55,
  'north-east': 0.30,
  'north-west': 0.30,
  'north': 0.15
};

/**
 * Computes solar irradiance I(h) in W/m² for a given hour (0-23)
 * @param {Object} climate
 * @param {number} hour
 * @returns {number} Irradiance in W/m²
 */
export function getHourlyIrradiance(climate, hour) {
  // If per-hour weather radiation is explicitly available (from Open-Meteo or NASA POWER)
  if (climate.hourlySolarIrradiance && Array.isArray(climate.hourlySolarIrradiance)) {
    return Math.max(0, climate.hourlySolarIrradiance[hour] || 0);
  }

  // Otherwise, use Section 7.4.1 sinusoidal daylight-hours profile centered at 12:00
  const sunshineHours = climate.sunshineHoursPerDay ?? 7.9;
  const peakRad = climate.peakSolarRadiationWm2 ?? 850;

  const sunrise = 12 - (sunshineHours / 2);
  const sunset = 12 + (sunshineHours / 2);

  if (hour >= sunrise && hour <= sunset && sunshineHours > 0) {
    const fraction = (hour - sunrise) / sunshineHours;
    return Math.max(0, peakRad * Math.sin(Math.PI * fraction));
  }

  return 0;
}

/**
 * Computes hourly solar heat gain in Watts
 * @param {Object} climate
 * @param {Object} shelter
 * @param {Object} materials
 * @param {number} hour - 0 to 23
 * @returns {number} Solar thermal power gain in Watts
 */
export function computeHourlySolarGain(climate, shelter, materials, hour) {
  const Ih = getHourlyIrradiance(climate, hour);
  if (Ih <= 0) return 0;

  const orientation = (shelter.orientation || 'south').toLowerCase();
  const theta = ORIENTATION_FACTORS[orientation] ?? 1.00;

  const winTypeKey = materials.windowType || 'double-glazed';
  const winDef = WINDOW_TYPES[winTypeKey] || WINDOW_TYPES['double-glazed'];
  const shgc = winDef.SHGC;
  const windowAreaM2 = shelter.windowAreaM2 || 0;

  // Direct solar heat gain through windows: Q = A * SHGC * I(h) * θ(h)
  const qWindow = windowAreaM2 * shgc * Ih * theta;

  // Section 7.4.3: Opaque wall solar absorption for Trombe Wall
  let qTrombe = 0;
  if (materials.thermalMassType === 'trombe-wall') {
    const aTrombe = windowAreaM2 > 0 ? windowAreaM2 : 3.0;
    const alpha = 0.90;      // Absorptance of dark painted mass wall
    const tauGlazing = 0.85; // Transmittance of outer glazing
    qTrombe = aTrombe * alpha * Ih * tauGlazing * theta;
  }

  return qWindow + qTrombe;
}
