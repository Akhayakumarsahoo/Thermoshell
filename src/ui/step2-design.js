/**
 * ThermoShelter - UI Step 2: Shelter Design
 * Sourced from ThermoShelter Project Spec Section 6.2, 7.2, 11
 */

import { state, notifyStateChange } from './state.js';
import { computeGeometry } from '../engine/geometry.js';

export function renderStep2(container) {
  const s = state.shelter;
  const geom = computeGeometry(s);

  container.innerHTML = `
    <div class="step-header">
      <div class="step-number-badge">STEP 02</div>
      <h2>Shelter Form, Geometry & Solar Orientation</h2>
      <p class="step-subtitle">Configure the physical envelope dimensions, geometric form factor, and glazed aperture orientation for passive solar gain.</p>
    </div>

    <!-- Live Geometry KPIs Panel -->
    <div class="kpi-banner-grid">
      <div class="kpi-pill">
        <span class="kpi-pill-label">Floor Area</span>
        <span class="kpi-pill-value" id="kpi-floor-area">${geom.floorAreaM2.toFixed(1)} m²</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Interior Volume</span>
        <span class="kpi-pill-value" id="kpi-volume">${geom.volumeM3.toFixed(1)} m³</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Net Wall Area</span>
        <span class="kpi-pill-value" id="kpi-net-wall">${geom.wallAreaNetM2.toFixed(1)} m²</span>
      </div>
      <div class="kpi-pill">
        <span class="kpi-pill-label">Roof Area</span>
        <span class="kpi-pill-value" id="kpi-roof">${geom.roofAreaM2.toFixed(1)} m²</span>
      </div>
      <div class="kpi-pill kpi-highlight">
        <span class="kpi-pill-label">Surface / Volume (S/V)</span>
        <span class="kpi-pill-value" id="kpi-sv-ratio">${geom.surfaceToVolumeRatio.toFixed(3)} m⁻¹</span>
        <span class="kpi-pill-sub" id="kpi-sv-tag">${geom.surfaceToVolumeRatio < 1.3 ? '✓ Compact (High Heat Retention)' : '⚠️ High Exposure Area'}</span>
      </div>
    </div>

    <div class="grid-2-col">
      <!-- Dimensions Form -->
      <div class="card">
        <h3 class="card-title">Enclosure Dimensions</h3>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="shelter-length">Length L (m)</label>
            <input type="number" id="shelter-length" step="0.5" min="1" max="50" value="${s.lengthM}">
            <span class="field-hint">Default 6.0 m</span>
          </div>
          <div class="form-group">
            <label for="shelter-width">Width W (m)</label>
            <input type="number" id="shelter-width" step="0.5" min="1" max="50" value="${s.widthM}">
            <span class="field-hint">Default 4.0 m</span>
          </div>
          <div class="form-group">
            <label for="shelter-height">Clear Height H (m)</label>
            <input type="number" id="shelter-height" step="0.1" min="1.8" max="6" value="${s.heightM}">
            <span class="field-hint">Default 2.6 m</span>
          </div>
          <div class="form-group">
            <label for="shelter-shape">Geometric Archetype</label>
            <select id="shelter-shape">
              <option value="rectangular" ${s.shape === 'rectangular' ? 'selected' : ''}>Rectangular (Standard Military/Civil Shelter)</option>
              <option value="compact-cube" ${s.shape === 'compact-cube' ? 'selected' : ''}>Compact Cube (Optimized Low S/V)</option>
              <option value="dome" ${s.shape === 'dome' ? 'selected' : ''}>Geodesic / Hemispherical Dome (Wind Resilient)</option>
              <option value="l-shaped" ${s.shape === 'l-shaped' ? 'selected' : ''}>L-Shaped Courtyard Shelter</option>
            </select>
            <span class="field-hint">Affects convective wind-wash & roof surface area</span>
          </div>
        </div>
      </div>

      <!-- Orientation & Apertures -->
      <div class="card">
        <h3 class="card-title">Apertures & Solar Orientation</h3>
        <div class="form-group">
          <label for="shelter-orientation">Glazed Facade Orientation</label>
          <select id="shelter-orientation">
            <option value="south" ${s.orientation === 'south' ? 'selected' : ''}>South (Optimal for Northern Hemisphere Winter Sun)</option>
            <option value="south-east" ${s.orientation === 'south-east' ? 'selected' : ''}>South-East (Early Morning Warming)</option>
            <option value="south-west" ${s.orientation === 'south-west' ? 'selected' : ''}>South-West (Late Afternoon Solar Peak)</option>
            <option value="east" ${s.orientation === 'east' ? 'selected' : ''}>East (Morning Sun Only)</option>
            <option value="west" ${s.orientation === 'west' ? 'selected' : ''}>West (Intense Evening Sun)</option>
            <option value="north-east" ${s.orientation === 'north-east' ? 'selected' : ''}>North-East (Low Solar Access)</option>
            <option value="north-west" ${s.orientation === 'north-west' ? 'selected' : ''}>North-West (Low Solar Access)</option>
            <option value="north" ${s.orientation === 'north' ? 'selected' : ''}>North (Negligible Direct Solar Radiation)</option>
          </select>
          <span class="field-hint">Multiplier factor: South = 1.00, East/West = 0.55, North = 0.15</span>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label for="shelter-window-area">Glazing Aperture Area (m²)</label>
            <input type="number" id="shelter-window-area" step="0.5" min="0" max="25" value="${s.windowAreaM2}">
            <span class="field-hint">Default 3.0 m² (Direct solar heat gain aperture)</span>
          </div>
          <div class="form-group">
            <label for="shelter-door-area">External Door Area (m²)</label>
            <input type="number" id="shelter-door-area" step="0.1" min="0" max="8" value="${s.doorAreaM2}">
            <span class="field-hint">Default 1.8 m² (Personnel ingress aperture)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-nav">
      <button type="button" class="btn btn-secondary btn-prev" data-prev="1">
        ← Back to Climate
      </button>
      <button type="button" class="btn btn-primary btn-next" data-next="3">
        Proceed to Materials & Envelope →
      </button>
    </div>
  `;

  attachStep2Listeners(container);
}

function attachStep2Listeners(container) {
  const updateGeometryDisplay = () => {
    const geom = computeGeometry(state.shelter);
    const floorEl = container.querySelector('#kpi-floor-area');
    const volEl = container.querySelector('#kpi-volume');
    const wallEl = container.querySelector('#kpi-net-wall');
    const roofEl = container.querySelector('#kpi-roof');
    const svEl = container.querySelector('#kpi-sv-ratio');
    const tagEl = container.querySelector('#kpi-sv-tag');

    if (floorEl) floorEl.textContent = `${geom.floorAreaM2.toFixed(1)} m²`;
    if (volEl) volEl.textContent = `${geom.volumeM3.toFixed(1)} m³`;
    if (wallEl) wallEl.textContent = `${geom.wallAreaNetM2.toFixed(1)} m²`;
    if (roofEl) roofEl.textContent = `${geom.roofAreaM2.toFixed(1)} m²`;
    if (svEl) svEl.textContent = `${geom.surfaceToVolumeRatio.toFixed(3)} m⁻¹`;
    if (tagEl) {
      tagEl.textContent = geom.surfaceToVolumeRatio < 1.3 ? '✓ Compact (High Heat Retention)' : '⚠️ High Exposure Area';
    }
  };

  const bindInput = (id, key, isFloat = true) => {
    const el = container.querySelector(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const val = isFloat ? parseFloat(el.value) : el.value;
      if (val !== undefined && (typeof val === 'string' || !isNaN(val))) {
        state.shelter[key] = val;
        updateGeometryDisplay();
        notifyStateChange('shelter');
      }
    });
  };

  bindInput('#shelter-length', 'lengthM');
  bindInput('#shelter-width', 'widthM');
  bindInput('#shelter-height', 'heightM');
  bindInput('#shelter-window-area', 'windowAreaM2');
  bindInput('#shelter-door-area', 'doorAreaM2');

  const shapeEl = container.querySelector('#shelter-shape');
  if (shapeEl) {
    shapeEl.addEventListener('change', () => {
      state.shelter.shape = shapeEl.value;
      updateGeometryDisplay();
      notifyStateChange('shelter');
    });
  }

  const orientEl = container.querySelector('#shelter-orientation');
  if (orientEl) {
    orientEl.addEventListener('change', () => {
      state.shelter.orientation = orientEl.value;
      notifyStateChange('shelter');
    });
  }

  // Navigation
  container.querySelector('.btn-prev')?.addEventListener('click', () => window.navigateToStep(1));
  container.querySelector('.btn-next')?.addEventListener('click', () => window.navigateToStep(3));
}
