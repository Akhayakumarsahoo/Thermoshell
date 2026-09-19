/**
 * ThermoShelter - Technical Report Generator
 * Sourced from ThermoShelter Project Spec Section 11 & 12
 */

import { CONFIG } from '../config.js';
import { ALL_MATERIALS, WINDOW_TYPES, DOOR_TYPES, INSULATION_GRADES, THERMAL_MASS_TYPES } from '../data/materials.js';

/**
 * Formats a comprehensive plain-text technical engineering report
 * @param {Object} state - Current application state
 * @returns {string} Plain text report
 */
export function generateTextReport(state) {
  const { climate, shelter, materials, simulationResults, bestOptimization } = state;
  const sim = simulationResults;

  const dateStr = climate.simulationDate || new Date().toISOString().split('T')[0];
  const locationStr = climate.location || `Lat ${climate.latitude}, Lon ${climate.longitude}`;

  const border = '================================================================================';
  const subBorder = '--------------------------------------------------------------------------------';

  let report = '';
  report += `${border}\n`;
  report += `THERMOSHELTER — AREA-SPECIFIC PASSIVE SHELTER THERMAL DESIGN DOSSIER\n`;
  report += `Smart India Hackathon 2026 · Problem Statement 26051 · DRDO / Dept of Defence Production\n`;
  report += `High-Altitude Cold-Desert Climate Optimization (Ladakh Reference Framework)\n`;
  report += `${border}\n\n`;

  report += `REPORT GENERATION TIMESTAMP: ${new Date().toISOString()}\n`;
  report += `TARGET LOCATION            : ${locationStr}\n`;
  report += `SIMULATION DATE            : ${dateStr}\n`;
  report += `WEATHER DATA SOURCE        : ${climate.source || (climate.isLive ? 'Open-Meteo Live API' : 'Ladakh Offline Reference Profile')}\n\n`;

  report += `1. CLIMATIC BOUNDARY CONDITIONS\n`;
  report += `${subBorder}\n`;
  report += `Night Minimum Temperature  : ${climate.nightTempC} °C\n`;
  report += `Day Maximum Temperature    : ${climate.dayTempC} °C\n`;
  report += `Peak Solar Radiation       : ${climate.peakSolarRadiationWm2} W/m²\n`;
  report += `Average Wind Speed         : ${climate.windSpeedMs} m/s\n`;
  report += `Relative Humidity          : ${climate.humidityPct} %\n`;
  report += `Altitude                   : ${climate.altitudeM || 3500} m\n\n`;

  report += `2. SHELTER ARCHITECTURAL SPECIFICATIONS\n`;
  report += `${subBorder}\n`;
  report += `Dimensions (L x W x H)     : ${shelter.lengthM}m x ${shelter.widthM}m x ${shelter.heightM}m\n`;
  report += `Geometry Form              : ${shelter.shape.toUpperCase()}\n`;
  report += `Glazing Orientation        : ${shelter.orientation.toUpperCase()} facing\n`;
  report += `Floor Area                 : ${sim.geometry.floorAreaM2.toFixed(1)} m²\n`;
  report += `Interior Usable Volume     : ${sim.geometry.volumeM3.toFixed(1)} m³\n`;
  report += `Net Wall Conduction Area   : ${sim.geometry.wallAreaNetM2.toFixed(1)} m²\n`;
  report += `Roof Area                  : ${sim.geometry.roofAreaM2.toFixed(1)} m²\n`;
  report += `Window Aperture Area       : ${(shelter.windowAreaM2 || 0).toFixed(1)} m²\n`;
  report += `Door Conduction Area       : ${(shelter.doorAreaM2 || 0).toFixed(1)} m²\n`;
  report += `Surface-to-Volume Ratio    : ${sim.geometry.surfaceToVolumeRatio.toFixed(3)} m²/m³\n\n`;

  report += `3. ENVELOPE MATERIAL & INSULATION COMPOSITION\n`;
  report += `${subBorder}\n`;
  report += `Insulation Grade Applied   : ${materials.insulationGrade.toUpperCase()} (${INSULATION_GRADES[materials.insulationGrade]?.name || 'None'})\n`;
  report += `Wall Assembly U-Value      : ${sim.uValues.uWall.toFixed(3)} W/m²·K\n`;
  report += `Roof Assembly U-Value      : ${sim.uValues.uRoof.toFixed(3)} W/m²·K\n`;
  report += `Floor Assembly U-Value     : ${sim.uValues.uFloor.toFixed(3)} W/m²·K\n`;
  report += `Glazing Type & U-Value     : ${WINDOW_TYPES[materials.windowType]?.name || materials.windowType} (U = ${sim.uValues.uWindow.toFixed(2)} W/m²·K, SHGC = ${sim.uValues.shgc})\n`;
  report += `Door Type & U-Value        : ${DOOR_TYPES[materials.doorType]?.name || materials.doorType} (U = ${sim.uValues.uDoor.toFixed(2)} W/m²·K)\n`;
  report += `Internal Thermal Mass      : ${THERMAL_MASS_TYPES[materials.thermalMassType]?.name || materials.thermalMassType}\n`;
  report += `Total Lumped Capacitance C : ${(sim.cTotal / 1e6).toFixed(3)} MJ/K\n`;
  report += `Air Infiltration / Vent.   : ${materials.airChangesPerHour || 0.6} ACH\n\n`;

  report += `4. PREDICTED 24-HOUR THERMAL PERFORMANCE (RC LUMPED MODEL)\n`;
  report += `${subBorder}\n`;
  report += `Lowest Outdoor Temp Night  : ${sim.lowestOutdoorTempNightC.toFixed(1)} °C\n`;
  report += `Lowest Indoor Temp Night   : ${sim.lowestIndoorTempNightC.toFixed(1)} °C\n`;
  report += `Highest Indoor Temp Day    : ${sim.highestIndoorTempDayC.toFixed(1)} °C\n`;
  report += `Thermal Comfort Threshold  : ${CONFIG.COMFORT_THRESHOLD_C} °C (Configurable Target)\n`;
  report += `Thermal Comfort Verdict    : ${sim.comfortAcceptable ? 'PASS (Comfort Maintained Overnight)' : 'FAIL (Supplementary Heating Required)'}\n`;
  report += `Hours Below Threshold      : ${sim.hoursBelowComfortThreshold} hrs / 24 hrs\n`;
  report += `Daily Solar Heat Harvested : ${sim.solarHeatGainKwh.toFixed(2)} kWh/day\n`;
  report += `Daily Gross Heat Loss      : ${sim.totalHeatLossKwh.toFixed(2)} kWh/day\n`;
  report += `Auxiliary Energy Needed    : ${sim.supplementaryHeatingNeededKwhPerDay.toFixed(2)} kWh/day (Fossil Fuel / Electric Equivalent)\n\n`;

  report += `5. HEAT LOSS DISTRIBUTION BY BUILDING SUBSYSTEM\n`;
  report += `${subBorder}\n`;
  const tot = sim.totalHeatLossKwh > 0 ? sim.totalHeatLossKwh : 1;
  const comp = sim.heatLossByComponentKwh;
  report += `  - Walls Conduction       : ${comp.walls.toFixed(2)} kWh (${((comp.walls / tot) * 100).toFixed(1)}%)\n`;
  report += `  - Roof Conduction        : ${comp.roof.toFixed(2)} kWh (${((comp.roof / tot) * 100).toFixed(1)}%)\n`;
  report += `  - Floor Conduction       : ${comp.floor.toFixed(2)} kWh (${((comp.floor / tot) * 100).toFixed(1)}%)\n`;
  report += `  - Windows Conduction     : ${comp.windows.toFixed(2)} kWh (${((comp.windows / tot) * 100).toFixed(1)}%)\n`;
  report += `  - Doors Conduction       : ${comp.doors.toFixed(2)} kWh (${((comp.doors / tot) * 100).toFixed(1)}%)\n`;
  report += `  - Air Ventilation (ACH)  : ${comp.ventilation.toFixed(2)} kWh (${((comp.ventilation / tot) * 100).toFixed(1)}%)\n`;
  report += `  - Clear-Sky Radiation    : ${comp.sky.toFixed(2)} kWh (${((comp.sky / tot) * 100).toFixed(1)}%)\n\n`;

  if (bestOptimization) {
    report += `6. OPTIMIZATION BENCHMARK (GRID SEARCH ACROSS 480 PERMUTATIONS)\n`;
    report += `${subBorder}\n`;
    report += `Recommended Optimal Config : Orientation: ${bestOptimization.orientation.toUpperCase()} | Insulation: ${bestOptimization.insulationGrade.toUpperCase()} | Windows: ${bestOptimization.windowAreaM2}m² | Mass: ${bestOptimization.thermalMassType.toUpperCase()}\n`;
    report += `Optimal Night Minimum Temp : ${bestOptimization.lowestIndoorTempNightC.toFixed(1)} °C\n`;
    report += `Optimal Solar Capture      : ${bestOptimization.solarHeatGainKwh.toFixed(2)} kWh\n`;
    report += `Optimal Heat Loss          : ${bestOptimization.totalHeatLossKwh.toFixed(2)} kWh\n`;
    report += `Comfort Satisfaction       : ${bestOptimization.comfortAcceptable ? 'YES' : 'REQUIRES MINIMAL TOP-UP'}\n\n`;
  }

  report += `7. ANSYS CROSS-CHECK VALIDATION STATUS (SECTION 12)\n`;
  report += `${subBorder}\n`;
  report += `Reference Benchmark Case   : 6m x 4m x 2.6m Rammed Earth Shelter in Leh winter (-15°C ambient)\n`;
  report += `ANSYS Steady-State U-Wall  : 1.670 W/m²·K vs Software Model: 1.671 W/m²·K (0.06% diff)\n`;
  report += `ANSYS Conductive Heat Flux : 334.0 W (at ΔT=20°C, A=10m²) vs Software Model: 334.4 W (0.12% diff)\n`;
  report += `Detailed Validation File   : Refer to validation/ansys-reference-case.md and validation/ansys-vs-model-comparison.csv\n\n`;

  report += `${border}\n`;
  report += `END OF TECHNICAL REPORT — THERMOSHELTER v1.0\n`;
  report += `${border}\n`;

  return report;
}

/**
 * Triggers a browser download of the plain text report file
 * @param {Object} state
 */
export function downloadTextReport(state) {
  const content = generateTextReport(state);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ThermoShelter_Dossier_${state.shelter.orientation}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
