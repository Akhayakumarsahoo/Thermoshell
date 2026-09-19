/**
 * ThermoShelter - Reactive Application State
 */

import ladakhData from '../data/ladakh-fallback.json' with { type: 'json' };
import { simulate24h } from '../engine/simulate.js';

export const state = {
  currentStep: 1,

  climate: {
    ...ladakhData,
    isLive: false,
    source: 'Offline Ladakh Fallback Profile'
  },

  shelter: {
    lengthM: 6.0,
    widthM: 4.0,
    heightM: 2.6,
    shape: 'rectangular',
    orientation: 'south',
    windowAreaM2: 3.0,
    doorAreaM2: 1.8
  },

  materials: {
    wallLayers: [
      { materialId: 'rammed-earth', thicknessM: 0.30 }
    ],
    roofLayers: [
      { materialId: 'timber-softwood', thicknessM: 0.10 }
    ],
    floorLayers: [
      { materialId: 'dense-concrete', thicknessM: 0.15 }
    ],
    windowType: 'double-glazed',
    doorType: 'uninsulated',
    insulationGrade: 'medium',
    thermalMassType: 'heavy',
    airChangesPerHour: 0.6
  },

  simulationResults: null,
  optimizationResults: null,
  bestOptimization: null,
  isOptimizing: false
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyStateChange(changedKey = null) {
  // Re-run simulation whenever inputs change
  if (changedKey === 'climate' || changedKey === 'shelter' || changedKey === 'materials') {
    state.simulationResults = simulate24h(state.climate, state.shelter, state.materials);
  }

  for (const fn of listeners) {
    try {
      fn(state, changedKey);
    } catch (e) {
      console.error('State subscriber error:', e);
    }
  }
}

// Initial simulation
state.simulationResults = simulate24h(state.climate, state.shelter, state.materials);
