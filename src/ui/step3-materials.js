/**
 * ThermoShelter - UI Step 3: Materials & Envelope Construction
 * Sourced from ThermoShelter Project Spec Section 6.3, 7.3, 8, 11
 */

import { state, notifyStateChange } from './state.js';
import {
  OPAQUE_MATERIALS,
  INSULATION_MATERIALS,
  ALL_MATERIALS,
  WINDOW_TYPES,
  DOOR_TYPES,
  INSULATION_GRADES,
  THERMAL_MASS_TYPES
} from '../data/materials.js';
import { computeAllUValues, computeThermalCapacitance } from '../engine/thermalProperties.js';

export function renderStep3(container) {
  const m = state.materials;
  const s = state.shelter;
  const uVals = computeAllUValues(s, m);
  const cTotal = computeThermalCapacitance(s, m);

  container.innerHTML = `
    <div class="step-header">
      <div class="step-number-badge">STEP 03</div>
      <h2>Envelope Assembly, Insulation & Thermal Mass</h2>
      <p class="step-subtitle">Configure multi-material composite wall, roof, and floor layers, select glazing performance, and specify thermal capacitance.</p>
    </div>

    <!-- Live Thermal Properties Readout -->
    <div class="kpi-banner-grid">
      <div class="kpi-pill">
        <span class="kpi-pill-label">Wall U-Value</span>
        <span class="kpi-pill-value" id="kpi-u-wall">${uVals.uWall.toFixed(3)} W/m²·K</span>
        <span class="kpi-pill-sub">${uVals.uWall < 0.5 ? '✓ Super-Insulated' : uVals.uWall < 1.0 ? 'Moderate' : '⚠️ High Loss'}</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Roof U-Value</span>
        <span class="kpi-pill-value" id="kpi-u-roof">${uVals.uRoof.toFixed(3)} W/m²·K</span>
        <span class="kpi-pill-sub">${uVals.uRoof < 0.4 ? '✓ Well Insulated' : 'Standard'}</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Floor U-Value</span>
        <span class="kpi-pill-value" id="kpi-u-floor">${uVals.uFloor.toFixed(3)} W/m²·K</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Glazing U & SHGC</span>
        <span class="kpi-pill-value" id="kpi-u-win">${uVals.uWindow.toFixed(2)} W/m²·K</span>
        <span class="kpi-pill-sub">SHGC: ${uVals.shgc}</span>
      </div>
      <div class="kpi-pill kpi-highlight">
        <span class="kpi-pill-label">Thermal Mass C_total</span>
        <span class="kpi-pill-value" id="kpi-c-total">${(cTotal / 1e6).toFixed(2)} MJ/K</span>
        <span class="kpi-pill-sub">Thermal Flywheel</span>
      </div>
    </div>

    <!-- Grid of Material Pickers -->
    <div class="grid-2-col">
      <!-- Passive Systems & Insulation -->
      <div class="card">
        <h3 class="card-title">Passive Systems & Insulation Grade</h3>
        
        <div class="form-group">
          <label for="mat-insulation-grade">Insulation Grade (Applied in series to Walls & Roof)</label>
          <select id="mat-insulation-grade">
            ${Object.entries(INSULATION_GRADES).map(([k, v]) => `
              <option value="${k}" ${m.insulationGrade === k ? 'selected' : ''}>${v.name}</option>
            `).join('')}
          </select>
          <span class="field-hint">Key parameter for SIH optimization loop</span>
        </div>

        <div class="form-group">
          <label for="mat-thermal-mass">Internal Thermal Mass Storage</label>
          <select id="mat-thermal-mass">
            ${Object.entries(THERMAL_MASS_TYPES).map(([k, v]) => `
              <option value="${k}" ${m.thermalMassType === k ? 'selected' : ''}>${v.name}</option>
            `).join('')}
          </select>
          <span class="field-hint">Stores daytime solar harvest and releases heat overnight</span>
        </div>

        <div class="form-group">
          <label for="mat-window-type">Glazing Performance Specification</label>
          <select id="mat-window-type">
            ${Object.entries(WINDOW_TYPES).map(([k, v]) => `
              <option value="${k}" ${m.windowType === k ? 'selected' : ''}>${v.name} (U = ${v.U} W/m²·K, SHGC = ${v.SHGC})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="mat-door-type">Exterior Door Type</label>
          <select id="mat-door-type">
            ${Object.entries(DOOR_TYPES).map(([k, v]) => `
              <option value="${k}" ${m.doorType === k ? 'selected' : ''}>${v.name} (U = ${v.U} W/m²·K)</option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="mat-ach">Air Infiltration & Ventilation Rate (ACH)</label>
          <div class="range-with-value">
            <input type="range" id="mat-ach" min="0.2" max="2.5" step="0.1" value="${m.airChangesPerHour || 0.6}">
            <span id="ach-val-display" class="range-display">${m.airChangesPerHour || 0.6} ACH</span>
          </div>
          <span class="field-hint">0.3 = airtight military shelter, 0.6 = standard sealed, 1.5+ = drafty</span>
        </div>
      </div>

      <!-- Composite Layer Configuration -->
      <div class="card">
        <h3 class="card-title">Multi-Material Composite Assemblies</h3>

        <!-- Wall Layers -->
        <div class="assembly-section">
          <div class="assembly-header">
            <h4>Wall Structural Layers</h4>
            <button type="button" id="btn-add-wall-layer" class="btn btn-sm btn-ghost">+ Add Layer</button>
          </div>
          <div id="wall-layers-container" class="layers-stack"></div>
        </div>

        <!-- Roof Layers -->
        <div class="assembly-section">
          <div class="assembly-header">
            <h4>Roof Structural Layers</h4>
            <button type="button" id="btn-add-roof-layer" class="btn btn-sm btn-ghost">+ Add Layer</button>
          </div>
          <div id="roof-layers-container" class="layers-stack"></div>
        </div>

        <!-- Floor Layers -->
        <div class="assembly-section">
          <div class="assembly-header">
            <h4>Ground Floor Layers</h4>
          </div>
          <div id="floor-layers-container" class="layers-stack"></div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-nav">
      <button type="button" class="btn btn-secondary btn-prev" data-prev="2">
        ← Back to Shelter Design
      </button>
      <button type="button" class="btn btn-primary btn-next" data-next="4">
        Run Simulation & View Results →
      </button>
    </div>
  `;

  attachStep3Listeners(container);
}

function attachStep3Listeners(container) {
  const refreshReadouts = () => {
    const uVals = computeAllUValues(state.shelter, state.materials);
    const cTotal = computeThermalCapacitance(state.shelter, state.materials);

    container.querySelector('#kpi-u-wall').textContent = `${uVals.uWall.toFixed(3)} W/m²·K`;
    container.querySelector('#kpi-u-roof').textContent = `${uVals.uRoof.toFixed(3)} W/m²·K`;
    container.querySelector('#kpi-u-floor').textContent = `${uVals.uFloor.toFixed(3)} W/m²·K`;
    container.querySelector('#kpi-u-win').textContent = `${uVals.uWindow.toFixed(2)} W/m²·K`;
    container.querySelector('#kpi-c-total').textContent = `${(cTotal / 1e6).toFixed(2)} MJ/K`;
  };

  const bindSelect = (id, key) => {
    const el = container.querySelector(id);
    if (!el) return;
    el.addEventListener('change', () => {
      state.materials[key] = el.value;
      refreshReadouts();
      notifyStateChange('materials');
    });
  };

  bindSelect('#mat-insulation-grade', 'insulationGrade');
  bindSelect('#mat-thermal-mass', 'thermalMassType');
  bindSelect('#mat-window-type', 'windowType');
  bindSelect('#mat-door-type', 'doorType');

  // ACH slider
  const achEl = container.querySelector('#mat-ach');
  const achDisplay = container.querySelector('#ach-val-display');
  if (achEl && achDisplay) {
    achEl.addEventListener('input', () => {
      const val = parseFloat(achEl.value);
      achDisplay.textContent = `${val.toFixed(1)} ACH`;
      state.materials.airChangesPerHour = val;
      refreshReadouts();
      notifyStateChange('materials');
    });
  }

  // Layer list rendering & management
  const renderLayerList = (targetId, layersKey) => {
    const cont = container.querySelector(targetId);
    if (!cont) return;
    cont.innerHTML = '';

    const layers = state.materials[layersKey] || [];
    layers.forEach((layer, idx) => {
      const row = document.createElement('div');
      row.className = 'layer-row';
      row.innerHTML = `
        <select class="layer-material-select">
          ${Object.entries(ALL_MATERIALS).map(([k, v]) => `
            <option value="${k}" ${layer.materialId === k ? 'selected' : ''}>${v.name} (k=${v.k})</option>
          `).join('')}
        </select>
        <div class="layer-thickness-wrapper">
          <input type="number" class="layer-thickness-input" step="0.01" min="0.01" max="1.5" value="${layer.thicknessM}">
          <span class="unit">m</span>
        </div>
        ${layers.length > 1 ? `<button type="button" class="btn-icon btn-remove-layer" title="Remove Layer">✕</button>` : ''}
      `;

      row.querySelector('.layer-material-select').addEventListener('change', (e) => {
        state.materials[layersKey][idx].materialId = e.target.value;
        refreshReadouts();
        notifyStateChange('materials');
      });

      row.querySelector('.layer-thickness-input').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          state.materials[layersKey][idx].thicknessM = val;
          refreshReadouts();
          notifyStateChange('materials');
        }
      });

      row.querySelector('.btn-remove-layer')?.addEventListener('click', () => {
        state.materials[layersKey].splice(idx, 1);
        renderLayerList(targetId, layersKey);
        refreshReadouts();
        notifyStateChange('materials');
      });

      cont.appendChild(row);
    });
  };

  renderLayerList('#wall-layers-container', 'wallLayers');
  renderLayerList('#roof-layers-container', 'roofLayers');
  renderLayerList('#floor-layers-container', 'floorLayers');

  container.querySelector('#btn-add-wall-layer')?.addEventListener('click', () => {
    state.materials.wallLayers.push({ materialId: 'rammed-earth', thicknessM: 0.15 });
    renderLayerList('#wall-layers-container', 'wallLayers');
    refreshReadouts();
    notifyStateChange('materials');
  });

  container.querySelector('#btn-add-roof-layer')?.addEventListener('click', () => {
    state.materials.roofLayers.push({ materialId: 'timber-softwood', thicknessM: 0.05 });
    renderLayerList('#roof-layers-container', 'roofLayers');
    refreshReadouts();
    notifyStateChange('materials');
  });

  // Navigation
  container.querySelector('.btn-prev')?.addEventListener('click', () => window.navigateToStep(2));
  container.querySelector('.btn-next')?.addEventListener('click', () => window.navigateToStep(4));
}
