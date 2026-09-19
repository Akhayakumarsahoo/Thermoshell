/**
 * ThermoShelter - UI Step 1: Climate Data
 * Sourced from ThermoShelter Project Spec Section 6.1, 9, 11
 */

import { state, notifyStateChange } from './state.js';
import { fetchOpenMeteoWeather } from '../weather/openMeteo.js';
import ladakhData from '../data/ladakh-fallback.json' with { type: 'json' };

export function renderStep1(container) {
  const c = state.climate;

  container.innerHTML = `
    <div class="step-header">
      <div class="step-number-badge">STEP 01</div>
      <h2>Climate & Environmental Boundary Conditions</h2>
      <p class="step-subtitle">Auto-fetch high-altitude real-time atmospheric data or customize manual parameters for Ladakh and other extreme zones.</p>
    </div>

    <!-- Weather Status Banner (§9.4) -->
    <div id="weather-banner" class="banner ${c.isLive ? 'banner-live' : 'banner-fallback'}">
      <div class="banner-icon">${c.isLive ? '🟢' : '⚠️'}</div>
      <div class="banner-content">
        <strong>${c.isLive ? 'Live Weather Active' : 'Offline Reference Mode Active'}</strong>
        <span>${c.isLive ? `Live meteorological profile loaded from ${c.source}.` : 'Live weather offline / unqueried — using validated Ladakh (Leh, 3500m) reference profile. All parameters can still be adjusted manually below.'}</span>
      </div>
      <div class="banner-badge">${c.isLive ? 'LIVE' : 'OFFLINE'}</div>
    </div>

    <!-- Quick Location & Auto-Fetch Toolbar -->
    <div class="card toolbar-card">
      <div class="toolbar-grid">
        <div class="form-group">
          <label for="climate-lat">Latitude (°N)</label>
          <input type="number" id="climate-lat" step="0.0001" value="${c.latitude}">
        </div>
        <div class="form-group">
          <label for="climate-lon">Longitude (°E)</label>
          <input type="number" id="climate-lon" step="0.0001" value="${c.longitude}">
        </div>
        <div class="form-group">
          <label for="climate-date">Simulation Date</label>
          <input type="date" id="climate-date" value="${c.simulationDate || '2026-01-15'}">
        </div>
        <div class="toolbar-actions">
          <button type="button" id="btn-fetch-weather" class="btn btn-primary">
            <span class="icon">📡</span> Fetch Live Weather
          </button>
          <button type="button" id="btn-use-location" class="btn btn-secondary">
            <span class="icon">📍</span> Use My Location
          </button>
          <button type="button" id="btn-load-ladakh" class="btn btn-ghost">
            <span class="icon">🏔️</span> Reset to Ladakh
          </button>
        </div>
      </div>
      <div id="fetch-status" class="fetch-status"></div>
    </div>

    <!-- Detailed Climate Parameters Form (§6.1) -->
    <div class="card">
      <h3 class="card-title">Atmospheric & Radiation Metrics</h3>
      <div class="form-grid-3">
        <div class="form-group">
          <label for="climate-night-temp">Night Minimum Temp (°C)</label>
          <input type="number" id="climate-night-temp" step="0.5" value="${c.nightTempC}">
          <span class="field-hint">Coldest predawn air temp (typically -15°C in Leh winter)</span>
        </div>
        <div class="form-group">
          <label for="climate-day-temp">Day Maximum Temp (°C)</label>
          <input type="number" id="climate-day-temp" step="0.5" value="${c.dayTempC}">
          <span class="field-hint">Midday peak ambient temp (typically +8°C)</span>
        </div>
        <div class="form-group">
          <label for="climate-peak-solar">Peak Solar Irradiance (W/m²)</label>
          <input type="number" id="climate-peak-solar" step="10" min="0" max="1400" value="${c.peakSolarRadiationWm2}">
          <span class="field-hint">Ladakh high-altitude clear sky peak (800–1100 W/m²)</span>
        </div>
        <div class="form-group">
          <label for="climate-sunshine-hours">Sunshine Hours per Day (hrs)</label>
          <input type="number" id="climate-sunshine-hours" step="0.1" min="0" max="16" value="${c.sunshineHoursPerDay}">
          <span class="field-hint">Average daylight window (7.9 hrs in Ladakh winter)</span>
        </div>
        <div class="form-group">
          <label for="climate-wind-speed">Average Wind Speed (m/s)</label>
          <input type="number" id="climate-wind-speed" step="0.1" min="0" value="${c.windSpeedMs}">
          <span class="field-hint">Affects surface convection & infiltration (4.5 m/s)</span>
        </div>
        <div class="form-group">
          <label for="climate-humidity">Relative Humidity (%)</label>
          <input type="number" id="climate-humidity" step="1" min="0" max="100" value="${c.humidityPct}">
          <span class="field-hint">Cold-desert dry air (15–35%)</span>
        </div>
        <div class="form-group">
          <label for="climate-altitude">Site Altitude (m above MSL)</label>
          <input type="number" id="climate-altitude" step="50" min="0" max="6500" value="${c.altitudeM || 3500}">
          <span class="field-hint">Key for clear-sky nocturnal radiation depression</span>
        </div>
        <div class="form-group">
          <label for="climate-annual-irradiance">Annual Irradiance (kWh/m²/yr)</label>
          <input type="number" id="climate-annual-irradiance" step="50" value="${c.annualIrradianceKwhM2 || 2000}">
          <span class="field-hint">Ladakh regional resource (1900–2100 kWh/m²)</span>
        </div>
        <div class="form-group">
          <label for="climate-cloud-free">Cloud-Free Days / Year</label>
          <input type="number" id="climate-cloud-free" step="1" min="0" max="365" value="${c.cloudFreeDaysPerYear || 300}">
          <span class="field-hint">Ladakh receives 300+ sunny days/yr</span>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="step-nav">
      <div></div>
      <button type="button" class="btn btn-primary btn-next" data-next="2">
        Proceed to Shelter Design →
      </button>
    </div>
  `;

  // Attach event listeners
  attachStep1Listeners(container);
}

function attachStep1Listeners(container) {
  const updateField = (id, key, parser = parseFloat) => {
    const el = container.querySelector(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const val = parser(el.value);
      if (!isNaN(val)) {
        state.climate[key] = val;
        notifyStateChange('climate');
      }
    });
  };

  updateField('#climate-lat', 'latitude');
  updateField('#climate-lon', 'longitude');
  updateField('#climate-night-temp', 'nightTempC');
  updateField('#climate-day-temp', 'dayTempC');
  updateField('#climate-peak-solar', 'peakSolarRadiationWm2');
  updateField('#climate-sunshine-hours', 'sunshineHoursPerDay');
  updateField('#climate-wind-speed', 'windSpeedMs');
  updateField('#climate-humidity', 'humidityPct', parseInt);
  updateField('#climate-altitude', 'altitudeM', parseInt);
  updateField('#climate-annual-irradiance', 'annualIrradianceKwhM2', parseInt);
  updateField('#climate-cloud-free', 'cloudFreeDaysPerYear', parseInt);

  const dateEl = container.querySelector('#climate-date');
  if (dateEl) {
    dateEl.addEventListener('change', () => {
      state.climate.simulationDate = dateEl.value;
      notifyStateChange('climate');
    });
  }

  // Fetch Weather Button
  const btnFetch = container.querySelector('#btn-fetch-weather');
  const statusEl = container.querySelector('#fetch-status');

  if (btnFetch) {
    btnFetch.addEventListener('click', async () => {
      const lat = parseFloat(container.querySelector('#climate-lat').value);
      const lon = parseFloat(container.querySelector('#climate-lon').value);
      const dateVal = container.querySelector('#climate-date').value;

      btnFetch.disabled = true;
      btnFetch.innerHTML = `<span class="spinner"></span> Querying Open-Meteo...`;
      statusEl.className = 'fetch-status loading';
      statusEl.textContent = 'Connecting to Open-Meteo global meteorological service...';

      try {
        const liveData = await fetchOpenMeteoWeather(lat, lon, dateVal);
        state.climate = {
          ...state.climate,
          ...liveData
        };
        statusEl.className = 'fetch-status success';
        statusEl.textContent = `✓ Successfully fetched live conditions for lat ${lat}, lon ${lon}.`;
        renderStep1(container);
        notifyStateChange('climate');
      } catch (err) {
        console.warn('Weather fetch failed, falling back to offline Ladakh reference:', err);
        statusEl.className = 'fetch-status error';
        statusEl.textContent = `⚠️ Weather API fetch failed (${err.message}). Defaulted safely to offline Ladakh dataset.`;
        btnFetch.disabled = false;
        btnFetch.innerHTML = `<span class="icon">📡</span> Fetch Live Weather`;
      }
    });
  }

  // Use My Location
  const btnLoc = container.querySelector('#btn-use-location');
  if (btnLoc) {
    btnLoc.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      btnLoc.disabled = true;
      btnLoc.textContent = 'Detecting position...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lon = parseFloat(pos.coords.longitude.toFixed(4));
          container.querySelector('#climate-lat').value = lat;
          container.querySelector('#climate-lon').value = lon;
          state.climate.latitude = lat;
          state.climate.longitude = lon;
          btnLoc.disabled = false;
          btnLoc.innerHTML = `<span class="icon">📍</span> Use My Location`;
          notifyStateChange('climate');
          // Auto-trigger fetch
          btnFetch.click();
        },
        (err) => {
          alert(`Geolocation detection error: ${err.message}`);
          btnLoc.disabled = false;
          btnLoc.innerHTML = `<span class="icon">📍</span> Use My Location`;
        },
        { timeout: 8000 }
      );
    });
  }

  // Reset to Ladakh
  const btnLadakh = container.querySelector('#btn-load-ladakh');
  if (btnLadakh) {
    btnLadakh.addEventListener('click', () => {
      state.climate = {
        ...ladakhData,
        isLive: false,
        source: 'Offline Ladakh Fallback Profile'
      };
      renderStep1(container);
      notifyStateChange('climate');
    });
  }

  // Navigation Next
  const nextBtn = container.querySelector('.btn-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.navigateToStep(2);
    });
  }
}
