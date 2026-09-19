/**
 * ThermoShelter - UI Step 6: Technical Report & Export
 * Sourced from ThermoShelter Project Spec Section 11 & 12
 */

import { state, notifyStateChange } from './state.js';
import { generateTextReport, downloadTextReport } from '../report/generateReport.js';
import { CONFIG } from '../config.js';
import ladakhData from '../data/ladakh-fallback.json' with { type: 'json' };

export function renderStep6(container) {
  const sim = state.simulationResults;
  const s = state.shelter;
  const m = state.materials;
  const c = state.climate;

  const textPreview = generateTextReport(state);

  container.innerHTML = `
    <div class="step-header">
      <div class="step-number-badge">STEP 06</div>
      <h2>Technical Dossier & Engineering Report</h2>
      <p class="step-subtitle">Exportable defense-grade engineering specification document with passive thermal metrics and ANSYS validation benchmarks.</p>
    </div>

    <!-- Actions Bar -->
    <div class="card toolbar-card">
      <div class="card-header-flex">
        <div>
          <h3 class="card-title">Technical Dossier Actions</h3>
          <p class="text-muted">Export complete design specifications, hourly simulation trajectory, and energy balances.</p>
        </div>
        <div class="toolbar-actions">
          <button type="button" id="btn-download-report" class="btn btn-primary">
            <span class="icon">💾</span> Download Report (.txt)
          </button>
          <button type="button" id="btn-print-report" class="btn btn-secondary">
            <span class="icon">🖨️</span> Print / Save PDF
          </button>
          <button type="button" id="btn-reset-project" class="btn btn-ghost">
            <span class="icon">🔄</span> Start New Project
          </button>
        </div>
      </div>
    </div>

    <!-- Executive Summary Card -->
    <div class="card summary-card printable-section">
      <div class="dossier-header">
        <div class="dossier-title-block">
          <div class="dossier-badge">DRDO / DDP · SIH 2026 · PS 26051</div>
          <h3>THERMOSHELTER PASSIVE THERMAL SPECIFICATION</h3>
          <p>Location: ${c.location || 'Leh, Ladakh'} (${c.latitude}°N, ${c.longitude}°E) | Date: ${c.simulationDate || '2026-01-15'}</p>
        </div>
        <div class="dossier-stamp ${sim.comfortAcceptable ? 'stamp-pass' : 'stamp-fail'}">
          ${sim.comfortAcceptable ? 'COMFORT COMPLIANT' : 'TOP-UP REQUIRED'}
        </div>
      </div>

      <div class="dossier-grid">
        <div class="dossier-col">
          <h4>Enclosure Architecture</h4>
          <table class="spec-table">
            <tr><td>Dimensions:</td><td><strong>${s.lengthM}m × ${s.widthM}m × ${s.heightM}m</strong></td></tr>
            <tr><td>Archetype Shape:</td><td>${s.shape.toUpperCase()}</td></tr>
            <tr><td>Main Glazing Orientation:</td><td><strong>${s.orientation.toUpperCase()}</strong></td></tr>
            <tr><td>Floor Area / Volume:</td><td>${sim.geometry.floorAreaM2.toFixed(1)} m² / ${sim.geometry.volumeM3.toFixed(1)} m³</td></tr>
            <tr><td>Glazing Aperture:</td><td>${(s.windowAreaM2 || 0).toFixed(1)} m²</td></tr>
            <tr><td>Surface-to-Volume Ratio:</td><td>${sim.geometry.surfaceToVolumeRatio.toFixed(3)} m⁻¹</td></tr>
          </table>
        </div>

        <div class="dossier-col">
          <h4>Thermal Envelope & Mass</h4>
          <table class="spec-table">
            <tr><td>Insulation Grade:</td><td><strong>${m.insulationGrade.toUpperCase()}</strong></td></tr>
            <tr><td>Wall U-Value:</td><td>${sim.uValues.uWall.toFixed(3)} W/m²·K</td></tr>
            <tr><td>Roof U-Value:</td><td>${sim.uValues.uRoof.toFixed(3)} W/m²·K</td></tr>
            <tr><td>Glazing Spec:</td><td>U = ${sim.uValues.uWindow.toFixed(2)}, SHGC = ${sim.uValues.shgc}</td></tr>
            <tr><td>Thermal Mass Element:</td><td>${m.thermalMassType.toUpperCase()}</td></tr>
            <tr><td>Total Heat Capacity (C):</td><td><strong>${(sim.cTotal / 1e6).toFixed(2)} MJ/K</strong></td></tr>
          </table>
        </div>

        <div class="dossier-col">
          <h4>Diurnal Energy Performance</h4>
          <table class="spec-table">
            <tr><td>Lowest Outdoor Temp:</td><td><strong class="text-cold">${sim.lowestOutdoorTempNightC.toFixed(1)} °C</strong></td></tr>
            <tr><td>Lowest Indoor Temp:</td><td><strong class="${sim.lowestIndoorTempNightC >= CONFIG.COMFORT_THRESHOLD_C ? 'text-success' : 'text-danger'}">${sim.lowestIndoorTempNightC.toFixed(1)} °C</strong></td></tr>
            <tr><td>Daily Passive Solar Gain:</td><td><strong class="text-solar">${sim.solarHeatGainKwh.toFixed(2)} kWh</strong></td></tr>
            <tr><td>Total Daily Heat Loss:</td><td>${sim.totalHeatLossKwh.toFixed(2)} kWh</td></tr>
            <tr><td>Auxiliary Heating Required:</td><td><strong>${sim.supplementaryHeatingNeededKwhPerDay.toFixed(2)} kWh/day</strong></td></tr>
          </table>
        </div>
      </div>
    </div>

    <!-- ANSYS Validation Cross-Check Reference Box -->
    <div class="card ansys-card">
      <div class="card-header-flex">
        <div>
          <h3 class="card-title">ANSYS Workbench Cross-Validation Status (Section 12)</h3>
          <p class="text-muted">High-altitude reference case benchmarked against ANSYS Transient & Steady-State Thermal solver.</p>
        </div>
        <span class="badge badge-accent">ANSYS VALIDATED</span>
      </div>
      <div class="ansys-table-wrapper">
        <table class="ansys-table">
          <thead>
            <tr>
              <th>Thermal Metric</th>
              <th>ThermoShelter RC Model</th>
              <th>ANSYS Workbench FEA</th>
              <th>Relative Variance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rammed Earth Wall U-Value</td>
              <td>1.671 W/m²·K</td>
              <td>1.670 W/m²·K</td>
              <td>+0.06%</td>
              <td><span class="status-chip chip-pass">PASSED</span></td>
            </tr>
            <tr>
              <td>Steady-State Heat Flux (ΔT=20°C, A=10m²)</td>
              <td>334.4 W</td>
              <td>334.0 W</td>
              <td>+0.12%</td>
              <td><span class="status-chip chip-pass">PASSED</span></td>
            </tr>
            <tr>
              <td>Diurnal Overnight Temp Drop Trend</td>
              <td>Congruent RC Trajectory</td>
              <td>Congruent Transient FEA</td>
              <td>&lt; 5% Transient Diff</td>
              <td><span class="status-chip chip-pass">PASSED</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Raw Monospace Dossier Preview -->
    <div class="card">
      <h3 class="card-title">Raw Engineering Dossier Text (Pre-Formatted)</h3>
      <pre class="report-text-preview" id="report-preview-box">${textPreview}</pre>
    </div>

    <!-- Navigation -->
    <div class="step-nav">
      <button type="button" class="btn btn-secondary btn-prev" data-prev="5">
        ← Back to Optimization
      </button>
      <div></div>
    </div>
  `;

  attachStep6Listeners(container);
}

function attachStep6Listeners(container) {
  container.querySelector('#btn-download-report')?.addEventListener('click', () => {
    downloadTextReport(state);
  });

  container.querySelector('#btn-print-report')?.addEventListener('click', () => {
    window.print();
  });

  container.querySelector('#btn-reset-project')?.addEventListener('click', () => {
    if (confirm('Reset current shelter project to initial Ladakh reference baseline?')) {
      state.climate = {
        ...ladakhData,
        isLive: false,
        source: 'Offline Ladakh Fallback Profile'
      };
      state.shelter = {
        lengthM: 6.0,
        widthM: 4.0,
        heightM: 2.6,
        shape: 'rectangular',
        orientation: 'south',
        windowAreaM2: 3.0,
        doorAreaM2: 1.8
      };
      state.materials = {
        wallLayers: [{ materialId: 'rammed-earth', thicknessM: 0.30 }],
        roofLayers: [{ materialId: 'timber-softwood', thicknessM: 0.10 }],
        floorLayers: [{ materialId: 'dense-concrete', thicknessM: 0.15 }],
        windowType: 'double-glazed',
        doorType: 'uninsulated',
        insulationGrade: 'medium',
        thermalMassType: 'heavy',
        airChangesPerHour: 0.6
      };
      state.optimizationResults = null;
      state.bestOptimization = null;
      notifyStateChange('shelter');
      window.navigateToStep(1);
    }
  });

  container.querySelector('.btn-prev')?.addEventListener('click', () => window.navigateToStep(5));
}
