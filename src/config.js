/**
 * ThermoShelter - Configuration & Physical Constants
 * Based on ThermoShelter Project Spec Section 6.5
 */

export const CONFIG = {
  COMFORT_THRESHOLD_C: 15,          // Configurable design target for cold-region comfort (°C)
  STEFAN_BOLTZMANN: 5.670374e-8,    // W/(m²·K⁴) physical constant
  AIR_DENSITY_KGM3: 1.2,            // kg/m³ at ~20°C, sea level
  AIR_SPECIFIC_HEAT_JKGK: 1005,     // J/(kg·K)
  GROUND_TEMP_ASSUMPTION_C: null,   // null = uses outdoor ambient air temp; or fixed ground temp
  SIM_TIMESTEP_HOURS: 1,            // Hourly time step for simulation
  OUTDOOR_SURFACE_EMISSIVITY: 0.9,  // Typical for painted/matte building surfaces
  SKY_TEMP_DEPRESSION_C: 15,        // Effective clear-sky night temperature depression below ambient (°C)
};
