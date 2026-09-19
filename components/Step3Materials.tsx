'use client';

import React from 'react';
import { useShelter, LayerItem } from '@/context/ShelterContext';
import {
  ALL_MATERIALS,
  WINDOW_TYPES,
  DOOR_TYPES,
  INSULATION_GRADES,
  THERMAL_MASS_TYPES
} from '@/src/data/materials.js';
import { computeAllUValues, computeThermalCapacitance } from '@/src/engine/thermalProperties.js';

export function Step3Materials() {
  const { shelter, materials, updateMaterials, setStep } = useShelter();

  const uVals = computeAllUValues(shelter, materials);
  const cTotal = computeThermalCapacitance(shelter, materials);

  // Helper to add layer to wall/roof/floor
  const addLayer = (type: 'wallLayers' | 'roofLayers' | 'floorLayers') => {
    const defaultMat = type === 'wallLayers' ? 'eps' : type === 'roofLayers' ? 'glass-wool' : 'dense-concrete';
    const defaultThick = type === 'wallLayers' ? 0.05 : type === 'roofLayers' ? 0.05 : 0.10;
    updateMaterials({
      [type]: [...materials[type], { materialId: defaultMat, thicknessM: defaultThick }]
    });
  };

  // Helper to remove layer
  const removeLayer = (type: 'wallLayers' | 'roofLayers' | 'floorLayers', index: number) => {
    if (materials[type].length <= 1) return; // Keep at least one layer
    const updated = materials[type].filter((_, i) => i !== index);
    updateMaterials({ [type]: updated });
  };

  // Helper to update layer
  const updateLayer = (
    type: 'wallLayers' | 'roofLayers' | 'floorLayers',
    index: number,
    field: keyof LayerItem,
    val: any
  ) => {
    const updated = [...materials[type]];
    updated[index] = { ...updated[index], [field]: val };
    updateMaterials({ [type]: updated });
  };

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'drdo-prefab') {
      updateMaterials({
        wallLayers: [
          { materialId: 'timber-softwood', thicknessM: 0.02 },
          { materialId: 'polyurethane-pur-pir', thicknessM: 0.10 },
          { materialId: 'timber-softwood', thicknessM: 0.02 }
        ],
        roofLayers: [
          { materialId: 'polyurethane-pur-pir', thicknessM: 0.12 },
          { materialId: 'timber-softwood', thicknessM: 0.02 }
        ],
        floorLayers: [
          { materialId: 'dense-concrete', thicknessM: 0.10 },
          { materialId: 'xps', thicknessM: 0.08 }
        ],
        windowType: 'double-glazed-lowe',
        doorType: 'insulated',
        insulationGrade: 'high',
        thermalMassType: 'medium',
        airChangesPerHour: 0.4
      });
    } else if (presetName === 'ladakh-traditional') {
      updateMaterials({
        wallLayers: [{ materialId: 'rammed-earth', thicknessM: 0.35 }],
        roofLayers: [
          { materialId: 'mud-adobe', thicknessM: 0.10 },
          { materialId: 'timber-softwood', thicknessM: 0.08 }
        ],
        floorLayers: [{ materialId: 'rammed-earth', thicknessM: 0.25 }],
        windowType: 'double-glazed',
        doorType: 'uninsulated',
        insulationGrade: 'low',
        thermalMassType: 'heavy',
        airChangesPerHour: 0.8
      });
    } else if (presetName === 'ultra-antarctic') {
      updateMaterials({
        wallLayers: [
          { materialId: 'timber-softwood', thicknessM: 0.02 },
          { materialId: 'polyurethane-pur-pir', thicknessM: 0.18 },
          { materialId: 'timber-softwood', thicknessM: 0.02 }
        ],
        roofLayers: [
          { materialId: 'polyurethane-pur-pir', thicknessM: 0.22 },
          { materialId: 'timber-softwood', thicknessM: 0.02 }
        ],
        floorLayers: [
          { materialId: 'xps', thicknessM: 0.15 },
          { materialId: 'dense-concrete', thicknessM: 0.12 }
        ],
        windowType: 'double-glazed-lowe',
        doorType: 'insulated',
        insulationGrade: 'high',
        thermalMassType: 'trombe-wall',
        airChangesPerHour: 0.3
      });
    }
  };

  const renderLayerStack = (
    title: string,
    type: 'wallLayers' | 'roofLayers' | 'floorLayers',
    uVal: number
  ) => (
    <div className="assembly-section">
      <div className="assembly-header">
        <div>
          <h4>{title}</h4>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
            U = {uVal.toFixed(3)} W/m²·K
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => addLayer(type)}
        >
          + Add Layer
        </button>
      </div>

      <div className="layers-stack">
        {materials[type].map((layer, idx) => (
          <div key={idx} className="layer-row">
            <select
              value={layer.materialId}
              onChange={(e) => updateLayer(type, idx, 'materialId', e.target.value)}
            >
              {Object.entries(ALL_MATERIALS).map(([k, v]: [string, any]) => (
                <option key={k} value={k}>
                  {v.name} (k = {v.k} W/m·K)
                </option>
              ))}
            </select>

            <div className="layer-thickness-wrapper">
              <input
                type="number"
                className="layer-thickness-input"
                step="0.01"
                min="0.005"
                max="1.0"
                value={layer.thicknessM}
                onChange={(e) => updateLayer(type, idx, 'thicknessM', parseFloat(e.target.value) || 0.01)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>m</span>
            </div>

            <button
              type="button"
              className="btn-icon"
              title="Remove layer"
              disabled={materials[type].length <= 1}
              onClick={() => removeLayer(type, idx)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="step-header">
        <div className="step-number-badge">STEP 03</div>
        <h2>Envelope Assembly, Insulation & Thermal Mass</h2>
        <p className="step-subtitle">
          Configure multi-material composite wall, roof, and floor layers, select glazing performance, and specify thermal capacitance.
        </p>
      </div>

      {/* Live Thermal Properties Readout */}
      <div className="kpi-banner-grid">
        <div className="kpi-pill">
          <span className="kpi-pill-label">Wall U-Value</span>
          <span className="kpi-pill-value" id="kpi-u-wall">
            {uVals.uWall.toFixed(3)} W/m²·K
          </span>
          <span className="kpi-pill-sub">
            {uVals.uWall < 0.5 ? '✓ Super-Insulated' : uVals.uWall < 1.0 ? 'Moderate' : '⚠️ High Loss'}
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Roof U-Value</span>
          <span className="kpi-pill-value" id="kpi-u-roof">
            {uVals.uRoof.toFixed(3)} W/m²·K
          </span>
          <span className="kpi-pill-sub">
            {uVals.uRoof < 0.4 ? '✓ Well Insulated' : 'Standard'}
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Floor U-Value</span>
          <span className="kpi-pill-value" id="kpi-u-floor">
            {uVals.uFloor.toFixed(3)} W/m²·K
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Glazing U & SHGC</span>
          <span className="kpi-pill-value" id="kpi-u-win">
            {uVals.uWindow.toFixed(2)} W/m²·K
          </span>
          <span className="kpi-pill-sub">SHGC: {uVals.shgc}</span>
        </div>
        <div className="kpi-pill kpi-highlight">
          <span className="kpi-pill-label">Thermal Mass C_total</span>
          <span className="kpi-pill-value" id="kpi-c-total">
            {(cTotal / 1e6).toFixed(2)} MJ/K
          </span>
          <span className="kpi-pill-sub">Thermal Flywheel</span>
        </div>
      </div>

      {/* Preset Envelope Selection Bar */}
      <div className="card toolbar-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quick Engineering Presets:</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Load tested cold-climate envelope assemblies in one click.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => applyPreset('drdo-prefab')}
            >
              🎖️ DRDO High-Altitude Prefab
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => applyPreset('ladakh-traditional')}
            >
              🏔️ Traditional Rammed Earth
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => applyPreset('ultra-antarctic')}
            >
              ❄️ Ultra-Insulated Antarctic
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Material Pickers */}
      <div className="grid-2-col">
        {/* Passive Systems & Insulation */}
        <div className="card">
          <h3 className="card-title">Passive Systems & Insulation Grade</h3>

          <div className="form-group">
            <label htmlFor="mat-insulation-grade">Insulation Grade (Applied in series)</label>
            <select
              id="mat-insulation-grade"
              value={materials.insulationGrade}
              onChange={(e) => updateMaterials({ insulationGrade: e.target.value })}
            >
              {Object.entries(INSULATION_GRADES).map(([k, v]: [string, any]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
            <span className="field-hint">Key parameter for SIH optimization loop</span>
          </div>

          <div className="form-group">
            <label htmlFor="mat-thermal-mass">Internal Thermal Mass Storage</label>
            <select
              id="mat-thermal-mass"
              value={materials.thermalMassType}
              onChange={(e) => updateMaterials({ thermalMassType: e.target.value })}
            >
              {Object.entries(THERMAL_MASS_TYPES).map(([k, v]: [string, any]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
            <span className="field-hint">Stores daytime solar harvest and releases heat overnight</span>
          </div>

          <div className="form-group">
            <label htmlFor="mat-window-type">Glazing Performance Specification</label>
            <select
              id="mat-window-type"
              value={materials.windowType}
              onChange={(e) => updateMaterials({ windowType: e.target.value })}
            >
              {Object.entries(WINDOW_TYPES).map(([k, v]: [string, any]) => (
                <option key={k} value={k}>
                  {v.name} (U = {v.U} W/m²·K, SHGC = {v.SHGC})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mat-door-type">Exterior Door Type</label>
            <select
              id="mat-door-type"
              value={materials.doorType}
              onChange={(e) => updateMaterials({ doorType: e.target.value })}
            >
              {Object.entries(DOOR_TYPES).map(([k, v]: [string, any]) => (
                <option key={k} value={k}>
                  {v.name} (U = {v.U} W/m²·K)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="mat-ach">Air Infiltration / Ventilation Rate (ACH)</label>
            <div className="range-with-value">
              <input
                type="range"
                id="mat-ach"
                min="0.1"
                max="2.0"
                step="0.05"
                value={materials.airChangesPerHour}
                onChange={(e) => updateMaterials({ airChangesPerHour: parseFloat(e.target.value) || 0.1 })}
              />
              <span className="range-display">{materials.airChangesPerHour.toFixed(2)} ACH</span>
            </div>
            <span className="field-hint">
              Tight shelter with heat recovery: 0.3–0.5 ACH; Standard drafty shelter: 1.0–1.5 ACH
            </span>
          </div>
        </div>

        {/* Multi-Layer Construction Stack */}
        <div className="card">
          <h3 className="card-title">Composite Construction Assemblies</h3>
          {renderLayerStack('Exterior Wall Assembly', 'wallLayers', uVals.uWall)}
          {renderLayerStack('Roof / Ceiling Assembly', 'roofLayers', uVals.uRoof)}
          {renderLayerStack('Ground Floor Assembly', 'floorLayers', uVals.uFloor)}
        </div>
      </div>

      {/* Navigation */}
      <div className="step-nav">
        <button
          type="button"
          className="btn btn-secondary btn-prev"
          onClick={() => {
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ← Back to Shelter Design
        </button>
        <button
          type="button"
          className="btn btn-primary btn-next"
          onClick={() => {
            setStep(4);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Run 24h Simulation Results →
        </button>
      </div>
    </div>
  );
}
