/**
 * ThermoShelter - Thermal Properties Engine
 * Implements equations from ThermoShelter Project Spec Section 7.3, 7.6, 8
 */

import { CONFIG } from '../config.js';
import {
  ALL_MATERIALS,
  SURFACE_RESISTANCES,
  INSULATION_GRADES,
  THERMAL_MASS_TYPES,
  WINDOW_TYPES,
  DOOR_TYPES
} from '../data/materials.js';
import { computeGeometry } from './geometry.js';

/**
 * Computes overall U-value for an assembly of layers
 * @param {Array<{materialId: string, thicknessM: number}>} layers
 * @param {'wall'|'roof'|'floor'} surfaceType
 * @returns {number} Overall heat transfer coefficient U in W/(m²·K)
 */
export function computeUValue(layers, surfaceType = 'wall') {
  const surfaceRes = SURFACE_RESISTANCES[surfaceType] || SURFACE_RESISTANCES.wall;
  let rTotal = surfaceRes.R_si + surfaceRes.R_se;

  if (Array.isArray(layers)) {
    for (const layer of layers) {
      if (!layer || layer.thicknessM <= 0) continue;
      const mat = ALL_MATERIALS[layer.materialId];
      if (mat && mat.k > 0) {
        rTotal += layer.thicknessM / mat.k;
      }
    }
  }

  if (rTotal <= 0) return 5.0; // fallback if no resistance
  return 1 / rTotal;
}

/**
 * Returns effective layer array including applied insulation grade
 * @param {Array} baseLayers
 * @param {string} insulationGrade - 'none', 'low', 'medium', 'high'
 * @returns {Array} Augmented layers array
 */
export function getEffectiveLayersWithInsulation(baseLayers = [], insulationGrade = 'none') {
  const layers = [...(baseLayers || [])];
  const grade = INSULATION_GRADES[insulationGrade];

  if (grade && grade.thicknessM > 0 && grade.materialId) {
    layers.push({
      materialId: grade.materialId,
      thicknessM: grade.thicknessM
    });
  }

  return layers;
}

/**
 * Computes total lumped thermal capacitance (C_total) in J/K
 * @param {Object} shelter
 * @param {Object} materials
 * @returns {number} Total capacitance in J/K
 */
export function computeThermalCapacitance(shelter, materials) {
  const geom = computeGeometry(shelter);
  
  // Capacitance of indoor air: ρ_air * Cp_air * Volume
  const cAir = geom.volumeM3 * CONFIG.AIR_DENSITY_KGM3 * CONFIG.AIR_SPECIFIC_HEAT_JKGK;

  // Capacitance of thermal mass element
  const massTypeKey = materials.thermalMassType || 'none';
  const massDef = THERMAL_MASS_TYPES[massTypeKey] || THERMAL_MASS_TYPES.none;

  let cMass = 0;
  if (massDef && massDef.materialId) {
    const vol = massDef.getVolumeM3(geom.floorAreaM2, shelter.windowAreaM2 || 3.0);
    const mat = ALL_MATERIALS[massDef.materialId];
    if (mat && vol > 0) {
      cMass = vol * mat.rho * mat.Cp;
    }
  }

  return cAir + cMass;
}

/**
 * Resolves all element U-values for a shelter given material configurations
 * @param {Object} shelter
 * @param {Object} materials
 * @returns {Object} U-values for walls, roof, floor, windows, doors
 */
export function computeAllUValues(shelter, materials) {
  const insulationGrade = materials.insulationGrade || 'none';

  const effectiveWallLayers = getEffectiveLayersWithInsulation(materials.wallLayers, insulationGrade);
  const effectiveRoofLayers = getEffectiveLayersWithInsulation(materials.roofLayers, insulationGrade);
  const floorLayers = materials.floorLayers || [];

  const uWall = computeUValue(effectiveWallLayers, 'wall');
  const uRoof = computeUValue(effectiveRoofLayers, 'roof');
  const uFloor = computeUValue(floorLayers, 'floor');

  const winTypeKey = materials.windowType || 'double-glazed';
  const winDef = WINDOW_TYPES[winTypeKey] || WINDOW_TYPES['double-glazed'];
  const uWindow = winDef.U;

  const doorTypeKey = materials.doorType || 'uninsulated';
  const doorDef = DOOR_TYPES[doorTypeKey] || DOOR_TYPES.uninsulated;
  const uDoor = doorDef.U;

  return {
    uWall,
    uRoof,
    uFloor,
    uWindow,
    uDoor,
    shgc: winDef.SHGC
  };
}
