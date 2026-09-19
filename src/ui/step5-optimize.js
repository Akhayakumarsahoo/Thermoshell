/**
 * ThermoShelter - UI Step 5: Optimization Engine Dashboard
 * Sourced from ThermoShelter Project Spec Section 10 & 11
 */

import { state, notifyStateChange } from './state.js';
import { runOptimization } from '../optimize/rankDesigns.js';
import { simulate24h } from '../engine/simulate.js';

export function renderStep5(container) {
  const hasResults = state.optimizationResults && state.optimizationResults.length > 0;
  const best = state.bestOptimization;

  container.innerHTML = `
    <div class="step-header">
      <div class="step-number-badge">STEP 05</div>
      <h2>Automated Design Space Optimization</h2>
      <p class="step-subtitle">Discrete grid sweep across 480 permutations (Orientation × Insulation × Window Area × Thermal Mass) ranked by comfort and efficiency.</p>
    </div>

    <!-- Optimization Trigger Card -->
    <div class="card toolbar-card">
      <div class="optimize-banner-flex">
        <div>
          <h3 class="card-title">Grid Search Parameter Space: 480 Combinations</h3>
          <p class="text-muted">Evaluates 8 Compass Orientations × 4 Insulation Grades × 3 Window Apertures × 5 Thermal Mass Types in milliseconds.</p>
        </div>
        <button type="button" id="btn-run-optimization" class="btn btn-primary btn-lg">
          <span class="icon">⚡</span> Generate & Simulate Combinations
        </button>
      </div>
      <div id="opt-progress" class="opt-progress"></div>
    </div>

    ${hasResults ? `
      <!-- Best Recommendation Highlight Card -->
      <div class="card best-design-card">
        <div class="best-badge-ribbon">⭐ RECOMMENDED BEST DESIGN (RANK #1)</div>
        <div class="best-design-grid">
          <div class="best-param-col">
            <h4>Optimal Architectural Configuration</h4>
            <ul class="best-specs-list">
              <li><strong>Glazing Orientation:</strong> <span class="badge badge-accent">${best.orientation.toUpperCase()}</span></li>
              <li><strong>Insulation Grade:</strong> <span class="badge badge-accent">${best.insulationGrade.toUpperCase()}</span></li>
              <li><strong>Window Aperture:</strong> <span class="badge badge-accent">${best.windowAreaM2} m²</span></li>
              <li><strong>Thermal Mass Storage:</strong> <span class="badge badge-accent">${best.thermalMassType.toUpperCase()}</span></li>
            </ul>
          </div>
          <div class="best-kpi-col">
            <h4>Predicted Thermal Performance</h4>
            <div class="kpi-mini-grid">
              <div class="mini-kpi">
                <span class="label">Night Min Temp</span>
                <span class="val text-success">${best.lowestIndoorTempNightC.toFixed(1)} °C</span>
              </div>
              <div class="mini-kpi">
                <span class="label">Total Heat Loss</span>
                <span class="val">${best.totalHeatLossKwh.toFixed(2)} kWh</span>
              </div>
              <div class="mini-kpi">
                <span class="label">Solar Capture</span>
                <span class="val text-solar">${best.solarHeatGainKwh.toFixed(2)} kWh</span>
              </div>
              <div class="mini-kpi">
                <span class="label">Auxiliary Energy</span>
                <span class="val">${best.supplementaryHeatingNeededKwhPerDay.toFixed(2)} kWh</span>
              </div>
            </div>
            <button type="button" class="btn btn-success btn-block btn-adopt-best" style="margin-top: 1rem;">
              ✓ Apply Best Design & View Technical Dossier →
            </button>
          </div>
        </div>
      </div>

      <!-- Ranked Results Table -->
      <div class="card table-card">
        <div class="card-header-flex">
          <h3 class="card-title">Full Lexicographic Ranking (Top 50 of 480)</h3>
          <div class="table-filter-group">
            <label><input type="checkbox" id="filter-comfort-only"> Comfort PASS Only</label>
          </div>
        </div>

        <div class="table-responsive">
          <table class="opt-table" id="opt-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Orientation</th>
                <th>Insulation</th>
                <th>Window</th>
                <th>Thermal Mass</th>
                <th>Night Min (°C)</th>
                <th>Heat Loss (kWh)</th>
                <th>Solar (kWh)</th>
                <th>Comfort</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${renderTableRows(state.optimizationResults.slice(0, 50))}
            </tbody>
          </table>
        </div>
      </div>
    ` : `
      <div class="card empty-state-card">
        <div class="empty-icon">📊</div>
        <h3>No Optimization Sweep Run Yet</h3>
        <p>Click "Generate & Simulate Combinations" above to simulate all 480 candidate designs and find the optimum passive configuration.</p>
      </div>
    `}

    <!-- Navigation -->
    <div class="step-nav">
      <button type="button" class="btn btn-secondary btn-prev" data-prev="4">
        ← Back to Results
      </button>
      ${hasResults ? `
        <button type="button" class="btn btn-primary btn-next" data-next="6">
          Proceed to Technical Report →
        </button>
      ` : `<div></div>`}
    </div>
  `;

  attachStep5Listeners(container);
}

function renderTableRows(designs) {
  return designs.map((d) => `
    <tr class="${d.rank === 1 ? 'row-best' : ''}">
      <td><span class="rank-badge ${d.rank === 1 ? 'rank-1' : ''}">#${d.rank}</span></td>
      <td><strong>${d.orientation}</strong></td>
      <td><span class="badge badge-subtle">${d.insulationGrade}</span></td>
      <td>${d.windowAreaM2} m²</td>
      <td>${d.thermalMassType}</td>
      <td class="${d.lowestIndoorTempNightC >= 15 ? 'text-success font-bold' : ''}">${d.lowestIndoorTempNightC.toFixed(1)}°</td>
      <td>${d.totalHeatLossKwh.toFixed(2)}</td>
      <td class="text-solar">${d.solarHeatGainKwh.toFixed(2)}</td>
      <td>
        <span class="status-chip ${d.comfortAcceptable ? 'chip-pass' : 'chip-fail'}">
          ${d.comfortAcceptable ? 'PASS' : 'FAIL'}
        </span>
      </td>
      <td>
        <button type="button" class="btn btn-sm btn-ghost btn-select-row" data-rank="${d.rank}">
          Select →
        </button>
      </td>
    </tr>
  `).join('');
}

function attachStep5Listeners(container) {
  const btnRun = container.querySelector('#btn-run-optimization');
  const prog = container.querySelector('#opt-progress');

  if (btnRun) {
    btnRun.addEventListener('click', () => {
      btnRun.disabled = true;
      btnRun.innerHTML = `<span class="spinner"></span> Simulating 480 Permutations...`;
      if (prog) prog.textContent = 'Simulating orientations, insulation grades, glazing sizes and thermal mass nodes...';

      // Slight timeout to allow browser paint
      setTimeout(() => {
        const startTime = performance.now();
        const res = runOptimization(state.climate, state.shelter, state.materials);
        const elapsed = (performance.now() - startTime).toFixed(1);

        state.optimizationResults = res.rankedDesigns;
        state.bestOptimization = res.bestDesign;

        console.log(`Simulated ${res.totalEvaluated} designs in ${elapsed} ms`);
        renderStep5(container);
        notifyStateChange('optimizationResults');
      }, 30);
    });
  }

  // Adopt Best Design button
  container.querySelector('.btn-adopt-best')?.addEventListener('click', () => {
    adoptDesign(state.bestOptimization);
  });

  // Individual Row Select Buttons
  container.querySelectorAll('.btn-select-row').forEach(btn => {
    btn.addEventListener('click', () => {
      const rank = parseInt(btn.getAttribute('data-rank'), 10);
      const chosen = state.optimizationResults.find(d => d.rank === rank);
      if (chosen) {
        adoptDesign(chosen);
      }
    });
  });

  function adoptDesign(d) {
    state.shelter.orientation = d.orientation;
    state.shelter.windowAreaM2 = d.windowAreaM2;
    state.materials.insulationGrade = d.insulationGrade;
    state.materials.thermalMassType = d.thermalMassType;

    // Refresh simulation with adopted parameters
    state.simulationResults = simulate24h(state.climate, state.shelter, state.materials);
    notifyStateChange('shelter');
    window.navigateToStep(6);
  }

  // Navigation
  container.querySelector('.btn-prev')?.addEventListener('click', () => window.navigateToStep(4));
  container.querySelector('.btn-next')?.addEventListener('click', () => window.navigateToStep(6));
}
