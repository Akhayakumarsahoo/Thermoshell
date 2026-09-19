'use client';

import React, { useState } from 'react';
import { useShelter } from '@/context/ShelterContext';
import { fetchOpenMeteoWeather } from '@/src/weather/openMeteo.js';
import ladakhData from '@/src/data/ladakh-fallback.json';

const LOCATION_PRESETS = [
  {
    name: 'Leh, Ladakh (3500m)',
    lat: 34.1526,
    lon: 77.5771,
    alt: 3500,
    night: -15,
    day: 8,
    peakSolar: 920,
    annualIrradiance: 2050,
    cloudFreeDays: 310,
    sunshineHours: 7.9,
    humidity: 25,
    wind: 4.5
  },
  {
    name: 'Kargil (2676m)',
    lat: 34.5539,
    lon: 76.1349,
    alt: 2676,
    night: -12,
    day: 6,
    peakSolar: 880,
    annualIrradiance: 1880,
    cloudFreeDays: 265,
    sunshineHours: 7.2,
    humidity: 32,
    wind: 3.8
  },
  {
    name: 'Dras (-30°C Extreme Cold, 3280m)',
    lat: 34.4293,
    lon: 75.7601,
    alt: 3280,
    night: -28,
    day: -4,
    peakSolar: 850,
    annualIrradiance: 1780,
    cloudFreeDays: 240,
    sunshineHours: 6.8,
    humidity: 38,
    wind: 5.2
  },
  {
    name: 'Siachen Base Camp (3650m)',
    lat: 35.2000,
    lon: 77.2000,
    alt: 3650,
    night: -22,
    day: 1,
    peakSolar: 900,
    annualIrradiance: 1850,
    cloudFreeDays: 250,
    sunshineHours: 7.0,
    humidity: 35,
    wind: 6.0
  },
  {
    name: 'Nyoma (4180m)',
    lat: 33.2000,
    lon: 78.6500,
    alt: 4180,
    night: -20,
    day: 3,
    peakSolar: 980,
    annualIrradiance: 2180,
    cloudFreeDays: 320,
    sunshineHours: 8.2,
    humidity: 18,
    wind: 5.0
  },
  {
    name: 'Pangong Tso (4225m)',
    lat: 33.7595,
    lon: 78.6674,
    alt: 4225,
    night: -18,
    day: 4,
    peakSolar: 960,
    annualIrradiance: 2120,
    cloudFreeDays: 315,
    sunshineHours: 8.0,
    humidity: 20,
    wind: 6.5
  },
  {
    name: 'Srinagar, Valley (1585m)',
    lat: 34.0837,
    lon: 74.7973,
    alt: 1585,
    night: -4,
    day: 9,
    peakSolar: 780,
    annualIrradiance: 1580,
    cloudFreeDays: 210,
    sunshineHours: 6.1,
    humidity: 55,
    wind: 2.5
  },
  {
    name: 'Tawang, Arunachal (3048m)',
    lat: 27.5861,
    lon: 91.8594,
    alt: 3048,
    night: -6,
    day: 7,
    peakSolar: 800,
    annualIrradiance: 1480,
    cloudFreeDays: 195,
    sunshineHours: 5.4,
    humidity: 65,
    wind: 3.5
  }
];

export function Step1Climate() {
  const { climate, updateClimate, setStep } = useShelter();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);

  const handleFetchWeather = async () => {
    setIsFetching(true);
    setFetchStatus('Connecting to Open-Meteo atmospheric API...');
    try {
      const weatherData = await fetchOpenMeteoWeather(
        climate.latitude,
        climate.longitude,
        climate.simulationDate
      );
      updateClimate({
        ...weatherData,
        isLive: true,
        source: 'Open-Meteo High-Resolution API'
      });
      setFetchStatus(
        `✓ Live profile loaded: Alt ${weatherData.altitudeM}m | ${weatherData.annualIrradianceKwhM2} kWh/m²/yr | ${weatherData.cloudFreeDaysPerYear} cloud-free days`
      );
    } catch (err: any) {
      console.warn('Weather fetch fallback triggered:', err.message);
      setFetchStatus(`⚠️ API unqueried/offline (${err.message}). Using reference values.`);
      updateClimate({ isLive: false, source: 'Offline Reference Mode' });
    } finally {
      setIsFetching(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setFetchStatus('⚠️ Geolocation not supported in this browser.');
      return;
    }
    setFetchStatus('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        updateClimate({
          latitude: lat,
          longitude: lon,
          location: `GPS: ${lat}°N, ${lon}°E`
        });
        setFetchStatus(`✓ Coordinates updated: ${lat}°N, ${lon}°E. Click "Fetch Live Weather" to load.`);
      },
      (err) => {
        setFetchStatus(`⚠️ Geolocation error: ${err.message}`);
      }
    );
  };

  const handlePresetSelect = (p: typeof LOCATION_PRESETS[0]) => {
    updateClimate({
      location: p.name,
      latitude: p.lat,
      longitude: p.lon,
      altitudeM: p.alt,
      nightTempC: p.night,
      dayTempC: p.day,
      peakSolarRadiationWm2: p.peakSolar,
      annualIrradianceKwhM2: p.annualIrradiance,
      cloudFreeDaysPerYear: p.cloudFreeDays,
      sunshineHoursPerDay: p.sunshineHours,
      humidityPct: p.humidity,
      windSpeedMs: p.wind,
      isLive: false,
      source: `Preset: ${p.name}`
    });
    setFetchStatus(`✓ Loaded ${p.name}: Alt ${p.alt}m, ${p.annualIrradiance} kWh/m²/yr, ${p.cloudFreeDays} cloud-free days`);
  };

  const handleResetLadakh = () => {
    updateClimate({
      ...ladakhData,
      isLive: false,
      source: 'Offline Ladakh Fallback Profile'
    });
    setFetchStatus('✓ Reset to baseline Ladakh reference profile.');
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-number-badge">STEP 01</div>
        <h2>Climate & Environmental Boundary Conditions</h2>
        <p className="step-subtitle">
          Auto-fetch high-altitude real-time atmospheric data or customize manual parameters for Ladakh and other extreme cold/arid zones.
        </p>
      </div>

      {/* Weather Status Banner */}
      <div className={`banner ${climate.isLive ? 'banner-live' : 'banner-fallback'}`}>
        <div style={{ fontSize: '1.4rem' }}>{climate.isLive ? '🟢' : '⚠️'}</div>
        <div className="banner-content">
          <strong>{climate.isLive ? 'Live Weather Active' : 'Offline Reference Mode Active'}</strong>
          <span>
            {climate.isLive
              ? `Live meteorological profile loaded from ${climate.source}.`
              : 'Live weather offline / unqueried — using validated Ladakh (Leh, 3500m) reference profile. All parameters can still be adjusted manually below.'}
          </span>
        </div>
        <div className="banner-badge">{climate.isLive ? 'LIVE' : 'OFFLINE'}</div>
      </div>

      {/* 24-Hour Diurnal Weather Profile Preview (Visible when live Open-Meteo data is loaded) */}
      {climate.isLive && climate.hourlyOutdoorTempC && climate.hourlyOutdoorTempC.length === 24 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '0.95rem' }}>
              📊 24-Hour Diurnal Atmospheric Profile (Open-Meteo Sliced Data)
            </h3>
            <span className="badge-accent">24 HOURLY DATA POINTS ACTIVE</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Real-time hourly ambient air temperatures and solar irradiance values feeding directly into the 24-hour transient thermal simulation:
          </p>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(105px, 1fr))', gap: '0.5rem', minWidth: '720px' }}>
              {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => {
                const temp = climate.hourlyOutdoorTempC![hour];
                const solar = climate.hourlySolarIrradiance ? climate.hourlySolarIrradiance[hour] : 0;
                return (
                  <div
                    key={hour}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {String(hour).padStart(2, '0')}:00
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0', color: temp <= 0 ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                      {temp.toFixed(1)}°C
                    </div>
                    <div style={{ fontSize: '0.75rem', color: solar > 0 ? 'var(--accent-amber)' : 'var(--text-dim)' }}>
                      ☀️ {Math.round(solar)} W/m²
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Coordinate Presets */}
      <div className="card toolbar-card">
        <div className="toolbar-grid">
          <div className="form-group">
            <label htmlFor="climate-lat">Latitude (°N)</label>
            <input
              type="number"
              id="climate-lat"
              step="0.0001"
              value={climate.latitude}
              onChange={(e) => updateClimate({ latitude: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="climate-lon">Longitude (°E)</label>
            <input
              type="number"
              id="climate-lon"
              step="0.0001"
              value={climate.longitude}
              onChange={(e) => updateClimate({ longitude: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="climate-date">Simulation Date</label>
            <input
              type="date"
              id="climate-date"
              value={climate.simulationDate || '2026-01-15'}
              onChange={(e) => updateClimate({ simulationDate: e.target.value })}
            />
          </div>
          <div className="toolbar-actions">
            <button
              type="button"
              id="btn-fetch-weather"
              className="btn btn-primary"
              onClick={handleFetchWeather}
              disabled={isFetching}
            >
              {isFetching ? <span className="spinner" /> : <span className="icon">📡</span>}
              <span>{isFetching ? 'Fetching...' : 'Fetch Live Weather'}</span>
            </button>
            <button
              type="button"
              id="btn-use-location"
              className="btn btn-secondary"
              onClick={handleUseLocation}
            >
              <span className="icon">📍</span> Use My Location
            </button>
            <button
              type="button"
              id="btn-load-ladakh"
              className="btn btn-ghost"
              onClick={handleResetLadakh}
            >
              <span className="icon">🏔️</span> Reset to Ladakh
            </button>
          </div>
        </div>

        {/* Location Presets */}
        <div style={{ marginTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            High-Altitude Cold Zone Presets:
          </span>
          <div className="location-presets">
            {LOCATION_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="preset-chip"
                onClick={() => handlePresetSelect(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {fetchStatus && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            {fetchStatus}
          </div>
        )}
      </div>

      {/* Atmospheric & Radiation Metrics Form */}
      <div className="card">
        <h3 className="card-title">Atmospheric & Radiation Metrics</h3>
        <div className="form-grid-3">
          <div className="form-group">
            <label htmlFor="climate-night-temp">Night Minimum Temp (°C)</label>
            <input
              type="number"
              id="climate-night-temp"
              step="0.5"
              value={climate.nightTempC}
              onChange={(e) => updateClimate({ nightTempC: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Coldest predawn air temp (typically -15°C in Leh winter)</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-day-temp">Day Maximum Temp (°C)</label>
            <input
              type="number"
              id="climate-day-temp"
              step="0.5"
              value={climate.dayTempC}
              onChange={(e) => updateClimate({ dayTempC: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Midday peak ambient temp (typically +8°C)</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-peak-solar">Peak Solar Irradiance (W/m²)</label>
            <input
              type="number"
              id="climate-peak-solar"
              step="10"
              min="0"
              max="1400"
              value={climate.peakSolarRadiationWm2}
              onChange={(e) => updateClimate({ peakSolarRadiationWm2: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Ladakh high-altitude clear sky peak (800–1100 W/m²)</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-sunshine-hours">Sunshine Hours per Day (hrs)</label>
            <input
              type="number"
              id="climate-sunshine-hours"
              step="0.1"
              min="0"
              max="16"
              value={climate.sunshineHoursPerDay}
              onChange={(e) => updateClimate({ sunshineHoursPerDay: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Average daylight window (7.9 hrs in Ladakh winter)</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-wind-speed">Average Wind Speed (m/s)</label>
            <input
              type="number"
              id="climate-wind-speed"
              step="0.1"
              min="0"
              value={climate.windSpeedMs}
              onChange={(e) => updateClimate({ windSpeedMs: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Affects surface convection & infiltration (4.5 m/s)</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-humidity">Relative Humidity (%)</label>
            <input
              type="number"
              id="climate-humidity"
              step="1"
              min="0"
              max="100"
              value={climate.humidityPct}
              onChange={(e) => updateClimate({ humidityPct: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Cold-desert dry air (15–35%)</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-altitude">Site Altitude (m above MSL)</label>
            <input
              type="number"
              id="climate-altitude"
              step="50"
              min="0"
              max="6500"
              value={climate.altitudeM || 3500}
              onChange={(e) => updateClimate({ altitudeM: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Key for clear-sky nocturnal radiation depression</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-annual-irradiance">Annual Irradiance (kWh/m²/yr)</label>
            <input
              type="number"
              id="climate-annual-irradiance"
              step="50"
              value={climate.annualIrradianceKwhM2}
              onChange={(e) => updateClimate({ annualIrradianceKwhM2: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Problem Statement reference: 1900–2100 kWh/m²/yr</span>
          </div>
          <div className="form-group">
            <label htmlFor="climate-cloud-free">Cloud-Free Days (days/yr)</label>
            <input
              type="number"
              id="climate-cloud-free"
              step="5"
              min="0"
              max="365"
              value={climate.cloudFreeDaysPerYear}
              onChange={(e) => updateClimate({ cloudFreeDaysPerYear: parseFloat(e.target.value) || 0 })}
            />
            <span className="field-hint">Ladakh high plateau baseline: 300+ days</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="step-nav">
        <div></div>
        <button
          type="button"
          className="btn btn-primary btn-next"
          onClick={() => {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Proceed to Shelter Design →
        </button>
      </div>
    </div>
  );
}
