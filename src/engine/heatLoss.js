/**
 * ThermoShelter - Heat Loss Engine
 * Implements equations from ThermoShelter Project Spec Section 7.5
 */

import { CONFIG } from '../config.js';
import { computeGeometry } from './geometry.js';
import { computeAllUValues } from './thermalProperties.js';
import { SURFACE_RESISTANCES } from '../data/materials.js';

/**
 * Returns outdoor air temperature for a given hour (0-23)
 * @param {Object} climate
 * @param {number} hour
 * @returns {number} Outdoor temperature in °C
 */
export function getHourlyOutdoorTemp(climate, hour) {
  if (climate.hourlyOutdoorTempC && Array.isArray(climate.hourlyOutdoorTempC) && climate.hourlyOutdoorTempC.length === 24) {
    return climate.hourlyOutdoorTempC[hour];
  }

  const tDay = climate.dayTempC ?? 8;
  const tNight = climate.nightTempC ?? -15;
  const mean = (tDay + tNight) / 2;
  const amp = (tDay - tNight) / 2;

  // Diurnal sinusoidal temperature wave with peak at 14:00 and trough at 02:00
  return mean + amp * Math.cos(((hour - 14) * 2 * Math.PI) / 24);
}

/**
 * Computes heat loss breakdown and total in Watts for a single hour
 * @param {Object} climate
 * @param {Object} shelter
 * @param {Object} materials
 * @param {number} T_in - Indoor air temperature in °C
 * @param {number} hour - Hour of day (0-23)
 * @param {Object} [precomputed] - Optional cached geometry and U-values for optimization speed
 * @returns {Object} Heat loss breakdown in Watts
 */
export function computeHourlyHeatLoss(climate, shelter, materials, T_in, hour, precomputed = null) {
  const geom = precomputed?.geom || computeGeometry(shelter);
  const uVals = precomputed?.uVals || computeAllUValues(shelter, materials);

  const T_out = getHourlyOutdoorTemp(climate, hour);
  const dT = T_in - T_out;

  // 1. Conductive loss through opaque and glazed building elements (§7.5.1)
  const qWalls = uVals.uWall * geom.wallAreaNetM2 * dT;
  const qRoof = uVals.uRoof * geom.roofAreaM2 * dT;

  const T_ground = (CONFIG.GROUND_TEMP_ASSUMPTION_C !== null) ? CONFIG.GROUND_TEMP_ASSUMPTION_C : T_out;
  const dT_floor = T_in - T_ground;
  const qFloor = uVals.uFloor * geom.floorAreaM2 * dT_floor;

  const windowAreaM2 = shelter.windowAreaM2 || 0;
  const qWindows = uVals.uWindow * windowAreaM2 * dT;

  const doorAreaM2 = shelter.doorAreaM2 || 0;
  const qDoors = uVals.uDoor * doorAreaM2 * dT;

  // 2. Ventilation and infiltration loss (§7.5.2)
  const ach = materials.airChangesPerHour ?? shelter.airChangesPerHour ?? 0.6;
  const qVent = (ach * geom.volumeM3 * CONFIG.AIR_DENSITY_KGM3 * CONFIG.AIR_SPECIFIC_HEAT_JKGK * dT) / 3600;

  // 3. High-altitude clear-sky radiative loss (§7.5.3)
  // Physical correction for Section 10.2 / 15.3:
  // Sky radiation occurs at the roof's exterior surface; the heat extracted from the indoor node
  // must conduct through the roof's thermal resistance (attenuated by U_roof * R_se).
  const tSky = T_out - CONFIG.SKY_TEMP_DEPRESSION_C;
  const tInK = T_in + 273.15;
  const tSkyK = tSky + 273.15;

  const rSe = SURFACE_RESISTANCES.roof.R_se || 0.04;
  const qSkyExt = CONFIG.OUTDOOR_SURFACE_EMISSIVITY * CONFIG.STEFAN_BOLTZMANN * geom.roofAreaM2 *
    (Math.pow(tInK, 4) - Math.pow(tSkyK, 4));
  
  // Heat flow from the indoor node into the sky is coupled through the roof's thermal conductance
  const qSky = (uVals.uRoof * rSe) * qSkyExt;

  const total = qWalls + qRoof + qFloor + qWindows + qDoors + qVent + qSky;

  return {
    walls: qWalls,
    roof: qRoof,
    floor: qFloor,
    windows: qWindows,
    doors: qDoors,
    ventilation: qVent,
    sky: qSky,
    total
  };
}
