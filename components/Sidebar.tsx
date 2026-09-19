'use client';

import React from 'react';
import { useShelter } from '@/context/ShelterContext';

const STEPS = [
  { num: 1, title: 'Climate Data' },
  { num: 2, title: 'Shelter Design' },
  { num: 3, title: 'Materials & Envelope' },
  { num: 4, title: 'Simulation Results' },
  { num: 5, title: 'Design Optimization' },
  { num: 6, title: 'Technical Report' }
];

export function Sidebar() {
  const { currentStep, setStep, climate, simulationResults } = useShelter();

  const nightTempStr = `${climate.nightTempC.toFixed(1)} °C`;
  const indoorMinStr = simulationResults
    ? `${simulationResults.lowestIndoorTempNightC.toFixed(1)} °C`
    : '--';
  const comfortPass = simulationResults ? simulationResults.comfortAcceptable : null;
  const solarHarvestStr = simulationResults
    ? `${simulationResults.solarHeatGainKwh.toFixed(1)} kWh`
    : '--';

  return (
    <aside className="sidebar-nav">
      <div>
        <div className="nav-section-title">Design Workflow</div>
        <ul className="wizard-nav-list" id="nav-list">
          {STEPS.map(s => {
            const isActive = currentStep === s.num;
            const isCompleted = s.num < currentStep;
            return (
              <li key={s.num}>
                <button
                  type="button"
                  className={`wizard-nav-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => {
                    setStep(s.num);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <span className="step-idx">0{s.num}</span>
                  <span>{s.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Persistent Sidebar Status Box */}
      <div className="sidebar-status-card">
        <div className="sidebar-status-title">
          <span>Current Model Status</span>
          <span className="badge-accent">ACTIVE</span>
        </div>
        <div className="sidebar-kpi-row">
          <span className="text-muted">Night Temp:</span>
          <span className="val">{nightTempStr}</span>
        </div>
        <div className="sidebar-kpi-row">
          <span className="text-muted">Indoor Min:</span>
          <span className="val text-cold">{indoorMinStr}</span>
        </div>
        <div className="sidebar-kpi-row">
          <span className="text-muted">Comfort:</span>
          <span
            className={`val ${
              comfortPass === null
                ? ''
                : comfortPass
                ? 'text-success'
                : 'text-danger'
            }`}
          >
            {comfortPass === null ? '--' : comfortPass ? 'PASS ✓' : 'FAIL ⚠️'}
          </span>
        </div>
        <div className="sidebar-kpi-row">
          <span className="text-muted">Solar Harvest:</span>
          <span className="val text-solar">{solarHarvestStr}</span>
        </div>
      </div>
    </aside>
  );
}
