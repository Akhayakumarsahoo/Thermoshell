/**
 * ThermoShelter - Material Property Reference Database
 * Sourced from ThermoShelter Project Spec Section 8
 */

export const OPAQUE_MATERIALS = {
  'rammed-earth': {
    name: 'Rammed Earth',
    k: 0.7,      // W/(m·K)
    rho: 2000,   // kg/m³
    Cp: 900,     // J/(kg·K)
    notes: 'Local/traditional, high mass, low embodied energy'
  },
  'mud-adobe': {
    name: 'Mud / Adobe Brick',
    k: 0.6,
    rho: 1700,
    Cp: 900,
    notes: 'Local/traditional masonry'
  },
  'stone': {
    name: 'Stone (Granite / Local Stone)',
    k: 2.3,
    rho: 2600,
    Cp: 800,
    notes: 'High thermal mass, widely available in Ladakh'
  },
  'fired-clay-brick': {
    name: 'Fired Clay Brick',
    k: 0.7,
    rho: 1800,
    Cp: 840,
    notes: 'Standard structural masonry'
  },
  'dense-concrete': {
    name: 'Dense Concrete',
    k: 1.5,
    rho: 2300,
    Cp: 880,
    notes: 'Cast structural concrete'
  },
  'timber-softwood': {
    name: 'Timber (Softwood)',
    k: 0.13,
    rho: 500,
    Cp: 1600,
    notes: 'Low mass, used for framing and roof'
  },
  'straw-bale': {
    name: 'Straw Bale (Infill)',
    k: 0.07,
    rho: 110,
    Cp: 1500,
    notes: 'Very high insulation value, low mass'
  }
};

export const INSULATION_MATERIALS = {
  'glass-wool': {
    name: 'Glass Wool',
    k: 0.040,
    rho: 20,
    Cp: 840
  },
  'eps-foam': {
    name: 'EPS Foam',
    k: 0.037,
    rho: 25,
    Cp: 1450
  },
  'xps-foam': {
    name: 'XPS Foam (Extruded Polystyrene)',
    k: 0.030,
    rho: 35,
    Cp: 1450
  },
  'rock-wool': {
    name: 'Rock Wool',
    k: 0.038,
    rho: 60,
    Cp: 840
  }
};

export const ALL_MATERIALS = {
  ...OPAQUE_MATERIALS,
  ...INSULATION_MATERIALS
};

export const INSULATION_GRADES = {
  'none': {
    name: 'None (0 mm)',
    thicknessM: 0,
    materialId: null
  },
  'low': {
    name: 'Low (25 mm Glass Wool)',
    thicknessM: 0.025,
    materialId: 'glass-wool'
  },
  'medium': {
    name: 'Medium (50 mm Glass Wool)',
    thicknessM: 0.050,
    materialId: 'glass-wool'
  },
  'high': {
    name: 'High (100 mm XPS Foam)',
    thicknessM: 0.100,
    materialId: 'xps-foam'
  }
};

export const THERMAL_MASS_TYPES = {
  'none': {
    name: 'None (Air only)',
    getVolumeM3: (floorAreaM2) => 0,
    materialId: null
  },
  'light': {
    name: 'Light (Timber partition)',
    getVolumeM3: (floorAreaM2) => 0.05 * floorAreaM2 * 0.1,
    materialId: 'timber-softwood'
  },
  'medium': {
    name: 'Medium (Brick internal wall)',
    getVolumeM3: (floorAreaM2) => 0.15 * floorAreaM2 * 0.15,
    materialId: 'fired-clay-brick'
  },
  'heavy': {
    name: 'Heavy (Rammed-earth mass wall)',
    getVolumeM3: (floorAreaM2) => 0.25 * floorAreaM2 * 0.3,
    materialId: 'rammed-earth'
  },
  'trombe-wall': {
    name: 'Trombe Wall (Glazed south mass wall)',
    getVolumeM3: (floorAreaM2, windowAreaM2 = 3.0) => windowAreaM2 * 0.3,
    materialId: 'rammed-earth',
    isTrombe: true
  }
};

export const WINDOW_TYPES = {
  'single-glazed': {
    name: 'Single Glazed',
    U: 5.8,
    SHGC: 0.85
  },
  'double-glazed': {
    name: 'Double Glazed',
    U: 2.8,
    SHGC: 0.65
  },
  'double-glazed-lowe': {
    name: 'Double Glazed, Low-E',
    U: 1.6,
    SHGC: 0.45
  }
};

export const DOOR_TYPES = {
  'uninsulated': {
    name: 'Uninsulated Timber/Metal Door',
    U: 3.0
  },
  'insulated': {
    name: 'Insulated Door',
    U: 1.5
  }
};

export const SURFACE_RESISTANCES = {
  wall: { R_si: 0.13, R_se: 0.04 },
  roof: { R_si: 0.10, R_se: 0.04 },
  floor: { R_si: 0.17, R_se: 0.04 }
};
