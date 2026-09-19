'use client';

import React from 'react';
import { useShelter } from '@/context/ShelterContext';
import { computeGeometry } from '@/src/engine/geometry.js';
import { ShelterSchematic } from './ShelterSchematic';

export function Step2Design() {
  const { shelter, updateShelter, setStep } = useShelter();
  const geom = computeGeometry(shelter);

  return (
    <div>
      <div className="step-header">
        <div className="step-number-badge">STEP 02</div>
        <h2>Shelter Form, Geometry & Solar Orientation</h2>
        <p className="step-subtitle">
          Configure physical envelope dimensions, geometric form factor, and glazed aperture orientation for passive solar gain.
        </p>
      </div>

      {/* Live Geometry KPIs Panel */}
      <div className="kpi-banner-grid">
        <div className="kpi-pill">
          <span className="kpi-pill-label">Floor Area</span>
          <span className="kpi-pill-value" id="kpi-floor-area">
            {geom.floorAreaM2.toFixed(1)} m²
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Interior Volume</span>
          <span className="kpi-pill-value" id="kpi-volume">
            {geom.volumeM3.toFixed(1)} m³
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Net Wall Area</span>
          <span className="kpi-pill-value" id="kpi-net-wall">
            {geom.wallAreaNetM2.toFixed(1)} m²
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Roof Area</span>
          <span className="kpi-pill-value" id="kpi-roof">
            {geom.roofAreaM2.toFixed(1)} m²
          </span>
        </div>
        <div className="kpi-pill kpi-highlight">
          <span className="kpi-pill-label">Surface / Volume (S/V)</span>
          <span className="kpi-pill-value" id="kpi-sv-ratio">
            {geom.surfaceToVolumeRatio.toFixed(3)} m⁻¹
          </span>
          <span className="kpi-pill-sub" id="kpi-sv-tag">
            {geom.surfaceToVolumeRatio < 1.3
              ? '✓ Compact (High Heat Retention)'
              : '⚠️ High Exposure Area'}
          </span>
        </div>
      </div>

      <div className="grid-2-col">
        {/* Dimensions Form */}
        <div className="card">
          <h3 className="card-title">Enclosure Dimensions</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="shelter-length">Length L (m)</label>
              <input
                type="number"
                id="shelter-length"
                step="0.5"
                min="1"
                max="50"
                value={shelter.lengthM}
                onChange={(e) => updateShelter({ lengthM: parseFloat(e.target.value) || 1 })}
              />
              <span className="field-hint">Default 6.0 m</span>
            </div>
            <div className="form-group">
              <label htmlFor="shelter-width">Width W (m)</label>
              <input
                type="number"
                id="shelter-width"
                step="0.5"
                min="1"
                max="50"
                value={shelter.widthM}
                onChange={(e) => updateShelter({ widthM: parseFloat(e.target.value) || 1 })}
              />
              <span className="field-hint">Default 4.0 m</span>
            </div>
            <div className="form-group">
              <label htmlFor="shelter-height">Clear Height H (m)</label>
              <input
                type="number"
                id="shelter-height"
                step="0.1"
                min="1.8"
                max="6"
                value={shelter.heightM}
                onChange={(e) => updateShelter({ heightM: parseFloat(e.target.value) || 1.8 })}
              />
              <span className="field-hint">Default 2.6 m</span>
            </div>
            <div className="form-group">
              <label htmlFor="shelter-shape">Geometric Archetype</label>
              <select
                id="shelter-shape"
                value={shelter.shape}
                onChange={(e) => updateShelter({ shape: e.target.value })}
              >
                <option value="rectangular">Rectangular (Standard Military/Civil Shelter)</option>
                <option value="compact-cube">Compact Cube (Optimized Low S/V)</option>
                <option value="dome">Geodesic / Hemispherical Dome (Wind Resilient)</option>
                <option value="l-shaped">L-Shaped Courtyard Shelter</option>
              </select>
              <span className="field-hint">Affects convective wind-wash & roof surface area</span>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.88rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              Geometric Form Visualizer
            </h4>
            <ShelterSchematic />
          </div>
        </div>

        {/* Orientation & Apertures */}
        <div className="card">
          <h3 className="card-title">Apertures & Solar Orientation</h3>
          <div className="form-group">
            <label htmlFor="shelter-orientation">Glazed Facade Orientation</label>
            <select
              id="shelter-orientation"
              value={shelter.orientation}
              onChange={(e) => updateShelter({ orientation: e.target.value })}
            >
              <option value="south">South (Optimal for Northern Hemisphere Winter Sun)</option>
              <option value="south-east">South-East (Early Morning Warming)</option>
              <option value="south-west">South-West (Late Afternoon Solar Peak)</option>
              <option value="east">East (Morning Sun Only)</option>
              <option value="west">West (Intense Evening Sun)</option>
              <option value="north-east">North-East (Low Solar Access)</option>
              <option value="north-west">North-West (Low Solar Access)</option>
              <option value="north">North (Negligible Direct Solar Radiation)</option>
            </select>
            <span className="field-hint">
              Solar flux multiplier: South = 1.00, East/West = 0.55, North = 0.15
            </span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="shelter-window-area">Glazing Aperture Area (m²)</label>
              <input
                type="number"
                id="shelter-window-area"
                step="0.5"
                min="0"
                max="25"
                value={shelter.windowAreaM2}
                onChange={(e) => updateShelter({ windowAreaM2: parseFloat(e.target.value) || 0 })}
              />
              <span className="field-hint">Direct solar heat gain aperture (3.0 m² default)</span>
            </div>
            <div className="form-group">
              <label htmlFor="shelter-door-area">External Door Area (m²)</label>
              <input
                type="number"
                id="shelter-door-area"
                step="0.1"
                min="0"
                max="8"
                value={shelter.doorAreaM2}
                onChange={(e) => updateShelter({ doorAreaM2: parseFloat(e.target.value) || 0 })}
              />
              <span className="field-hint">Personnel ingress aperture (1.8 m² default)</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
              Glazing-to-Wall Ratio (WWR)
            </h4>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
              {geom.wallAreaGrossM2 > 0 ? ((shelter.windowAreaM2 / geom.wallAreaGrossM2) * 100).toFixed(1) : '0'} %
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Target for extreme cold: 10–20% concentrated on South facade to avoid excessive nighttime conductance losses.
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="step-nav">
        <button
          type="button"
          className="btn btn-secondary btn-prev"
          onClick={() => {
            setStep(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ← Back to Climate
        </button>
        <button
          type="button"
          className="btn btn-primary btn-next"
          onClick={() => {
            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Proceed to Materials & Envelope →
        </button>
      </div>
    </div>
  );
}
