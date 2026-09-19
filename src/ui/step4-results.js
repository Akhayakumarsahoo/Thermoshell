/**
 * ThermoShelter - UI Step 4: Simulation Results Dashboard
 * Sourced from ThermoShelter Project Spec Section 6.4, 7.7, 7.8, 11
 */

import { state, notifyStateChange } from './state.js';
import { simulate24h } from '../engine/simulate.js';
import { CONFIG } from '../config.js';

export function renderStep4(container) {
  // Always ensure fresh simulation
  state.simulationResults = simulate24h(state.climate, state.shelter, state.materials);
  const sim = state.simulationResults;

  const comfortPass = sim.comfortAcceptable;
  const totLoss = sim.totalHeatLossKwh > 0 ? sim.totalHeatLossKwh : 1;
  const comp = sim.heatLossByComponentKwh;

  container.innerHTML = `
    <div class="step-header">
      <div class="step-number-badge">STEP 04</div>
      <h2>24-Hour Simulation Results & Thermal Balance</h2>
      <p class="step-subtitle">Lumped-capacitance RC thermal model prediction over 24 hours under extreme diurnal conditions.</p>
    </div>

    <!-- Executive KPI Cards -->
    <div class="kpi-banner-grid kpi-dashboard">
      <div class="kpi-pill">
        <span class="kpi-pill-label">Lowest Outdoor Night</span>
        <span class="kpi-pill-value text-cold">${sim.lowestOutdoorTempNightC.toFixed(1)} °C</span>
        <span class="kpi-pill-sub">Severe Ambient Chill</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Lowest Indoor Night</span>
        <span class="kpi-pill-value ${sim.lowestIndoorTempNightC >= CONFIG.COMFORT_THRESHOLD_C ? 'text-success' : 'text-danger'}">
          ${sim.lowestIndoorTempNightC.toFixed(1)} °C
        </span>
        <span class="kpi-pill-sub">ΔT buffer: +${(sim.lowestIndoorTempNightC - sim.lowestOutdoorTempNightC).toFixed(1)} °C</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Solar Heat Gain</span>
        <span class="kpi-pill-value text-solar">${sim.solarHeatGainKwh.toFixed(2)} kWh</span>
        <span class="kpi-pill-sub">Daily Passive Solar Harvest</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Total Daily Heat Loss</span>
        <span class="kpi-pill-value text-loss">${sim.totalHeatLossKwh.toFixed(2)} kWh</span>
        <span class="kpi-pill-sub">Conduction + Vent + Sky</span>
      </div>
      <div class="kpi-pill ${comfortPass ? 'kpi-success' : 'kpi-warning'}">
        <span class="kpi-pill-label">Comfort Target (${CONFIG.COMFORT_THRESHOLD_C}°C)</span>
        <span class="kpi-pill-value">${comfortPass ? 'PASS ✓' : 'FAIL ⚠️'}</span>
        <span class="kpi-pill-sub">${comfortPass ? 'Comfort Maintained' : `${sim.hoursBelowComfortThreshold} hrs below threshold`}</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Supplementary Energy</span>
        <span class="kpi-pill-value">${sim.supplementaryHeatingNeededKwhPerDay.toFixed(2)} kWh</span>
        <span class="kpi-pill-sub">Daily Top-Up Needed</span>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid-2-col">
      <!-- 24-Hour Temperature Trajectory Chart -->
      <div class="card chart-card">
        <div class="card-header-flex">
          <h3 class="card-title">24-Hour Diurnal Temperature Profile</h3>
          <div class="chart-legend">
            <span class="legend-item"><span class="legend-dot dot-indoor"></span> Indoor Temp (°C)</span>
            <span class="legend-item"><span class="legend-dot dot-outdoor"></span> Outdoor Temp (°C)</span>
            <span class="legend-item"><span class="legend-line line-threshold"></span> Comfort (15°C)</span>
          </div>
        </div>
        <div class="svg-chart-container" id="temp-chart-wrapper">
          ${renderTemperatureSvg(sim.hourlyIndoorTempC, sim.hourlyOutdoorTempC, CONFIG.COMFORT_THRESHOLD_C)}
        </div>
        <div class="chart-caption">
          Diurnal temperature curve showing thermal lag and overnight retention assisted by passive thermal mass.
        </div>
      </div>

      <!-- Heat Loss Breakdown by Component -->
      <div class="card chart-card">
        <h3 class="card-title">Heat Loss by Building Subsystem</h3>
        <div class="loss-breakdown-list">
          ${renderLossComponentBar('Walls Conduction', comp.walls, totLoss, '#38bdf8')}
          ${renderLossComponentBar('Roof Conduction', comp.roof, totLoss, '#818cf8')}
          ${renderLossComponentBar('Floor Conduction', comp.floor, totLoss, '#a78bfa')}
          ${renderLossComponentBar('Windows Conduction', comp.windows, totLoss, '#fb923c')}
          ${renderLossComponentBar('Doors Conduction', comp.doors, totLoss, '#f472b6')}
          ${renderLossComponentBar('Air Ventilation (ACH)', comp.ventilation, totLoss, '#34d399')}
          ${renderLossComponentBar('Clear-Sky Radiation', comp.sky, totLoss, '#60a5fa')}
        </div>
      </div>
    </div>

    <!-- Navigation & Next Steps -->
    <div class="step-nav">
      <button type="button" class="btn btn-secondary btn-prev" data-prev="3">
        ← Edit Materials
      </button>
      <div class="action-group">
        <button type="button" id="btn-recalc" class="btn btn-ghost">
          ↻ Re-calculate
        </button>
        <button type="button" class="btn btn-primary btn-next" data-next="5">
          ${comfortPass ? 'Proceed to Optimization Analysis →' : '⚡ Run Optimization to Fix Comfort Deficit →'}
        </button>
      </div>
    </div>
  `;

  attachStep4Listeners(container);
}

function renderLossComponentBar(name, valKwh, totalKwh, color) {
  const pct = totalKwh > 0 ? Math.max(0, (valKwh / totalKwh) * 100) : 0;
  return `
    <div class="loss-bar-item">
      <div class="loss-bar-header">
        <span class="loss-bar-name">${name}</span>
        <span class="loss-bar-value">${valKwh.toFixed(2)} kWh <small>(${pct.toFixed(1)}%)</small></span>
      </div>
      <div class="loss-bar-track">
        <div class="loss-bar-fill" style="width: ${Math.min(100, pct)}%; background-color: ${color};"></div>
      </div>
    </div>
  `;
}

/**
 * Generates an SVG 24-hour temperature chart
 */
function renderTemperatureSvg(hourlyIn, hourlyOut, threshold) {
  const width = 560;
  const height = 260;
  const pad = { top: 25, right: 30, bottom: 40, left: 45 };

  const allVals = [...hourlyIn, ...hourlyOut, threshold];
  const minVal = Math.floor(Math.min(...allVals) - 2);
  const maxVal = Math.ceil(Math.max(...allVals) + 2);
  const range = maxVal - minVal || 1;

  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const getX = (h) => pad.left + (h / 23) * chartW;
  const getY = (v) => pad.top + chartH - ((v - minVal) / range) * chartH;

  const makePath = (arr) => {
    return arr.map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(val).toFixed(1)}`).join(' ');
  };

  const pathIn = makePath(hourlyIn);
  const pathOut = makePath(hourlyOut);
  const yThresh = getY(threshold);

  // Grid lines
  const gridSteps = 5;
  const gridLines = [];
  for (let i = 0; i <= gridSteps; i++) {
    const tVal = minVal + (i / gridSteps) * range;
    const yPos = getY(tVal);
    gridLines.push(`
      <line x1="${pad.left}" y1="${yPos}" x2="${width - pad.right}" y2="${yPos}" stroke="var(--chart-grid, #e2e8f0)" stroke-width="1" />
      <text x="${pad.left - 8}" y="${yPos + 4}" text-anchor="end" fill="var(--chart-axis-text, #64748b)" font-size="10">${Math.round(tVal)}°</text>
    `);
  }

  // Hour labels
  const hourLabels = [0, 4, 8, 12, 16, 20, 23].map(h => `
    <text x="${getX(h)}" y="${height - pad.bottom + 18}" text-anchor="middle" fill="var(--chart-axis-text, #64748b)" font-size="10">${h.toString().padStart(2, '0')}:00</text>
  `).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="temp-svg-chart" preserveAspectRatio="none">
      <!-- Grid -->
      ${gridLines.join('')}
      ${hourLabels}

      <!-- Comfort Threshold Line -->
      <line x1="${pad.left}" y1="${yThresh}" x2="${width - pad.right}" y2="${yThresh}"
            stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4,4" />
      <text x="${width - pad.right - 4}" y="${yThresh - 6}" text-anchor="end" fill="#f59e0b" font-size="10" font-weight="600">
        Comfort ${threshold}°C
      </text>

      <!-- Outdoor Curve -->
      <path d="${pathOut}" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linejoin="round" />

      <!-- Indoor Curve -->
      <path d="${pathIn}" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linejoin="round" />

      <!-- Data Dots for Indoor -->
      ${hourlyIn.map((val, idx) => `
        <circle cx="${getX(idx)}" cy="${getY(val)}" r="3" fill="#06b6d4" class="chart-dot" />
      `).join('')}
    </svg>
  `;
}

function attachStep4Listeners(container) {
  container.querySelector('#btn-recalc')?.addEventListener('click', () => {
    state.simulationResults = simulate24h(state.climate, state.shelter, state.materials);
    renderStep4(container);
    notifyStateChange('simulationResults');
  });

  container.querySelector('.btn-prev')?.addEventListener('click', () => window.navigateToStep(3));
  container.querySelector('.btn-next')?.addEventListener('click', () => window.navigateToStep(5));
}
