'use client';

import React, { useState } from 'react';
import { useShelter } from '@/context/ShelterContext';
import { CONFIG } from '@/src/config.js';

export function Step4Results() {
  const { simulationResults, setStep } = useShelter();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  if (!simulationResults) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>No simulation results available. Please verify model inputs.</p>
      </div>
    );
  }

  const sim = simulationResults;
  const comfortPass = sim.comfortAcceptable;
  const totLoss = sim.totalHeatLossKwh > 0 ? sim.totalHeatLossKwh : 1;
  const comp = sim.heatLossByComponentKwh;

  // Temperature SVG dimensions
  const width = 800;
  const height = 260;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allTemps = [...sim.hourlyIndoorTempC, ...sim.hourlyOutdoorTempC, CONFIG.COMFORT_THRESHOLD_C];
  const minTemp = Math.floor(Math.min(...allTemps) - 2);
  const maxTemp = Math.ceil(Math.max(...allTemps) + 2);
  const tempRange = maxTemp - minTemp || 1;

  const getX = (hour: number) => padLeft + (hour / 23) * plotW;
  const getY = (temp: number) => padTop + plotH - ((temp - minTemp) / tempRange) * plotH;

  const outdoorPoints = sim.hourlyOutdoorTempC.map((t, h) => `${getX(h)},${getY(t)}`).join(' ');
  const indoorPoints = sim.hourlyIndoorTempC.map((t, h) => `${getX(h)},${getY(t)}`).join(' ');
  const thresholdY = getY(CONFIG.COMFORT_THRESHOLD_C);

  // Y-axis grid ticks
  const yTicks = [];
  const stepSize = Math.max(5, Math.round(tempRange / 5));
  for (let t = Math.ceil(minTemp / stepSize) * stepSize; t <= maxTemp; t += stepSize) {
    yTicks.push(t);
  }

  const renderLossComponent = (label: string, kwh: number, color: string) => {
    const pct = Math.min(100, Math.max(0, (kwh / totLoss) * 100));
    return (
      <div key={label} className="loss-bar-item">
        <div className="loss-bar-header">
          <span className="loss-bar-name">{label}</span>
          <span className="loss-bar-value">
            {kwh.toFixed(2)} kWh <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({pct.toFixed(1)}%)</span>
          </span>
        </div>
        <div className="loss-bar-track">
          <div className="loss-bar-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-number-badge">STEP 04</div>
        <h2>24-Hour Simulation Results & Thermal Balance</h2>
        <p className="step-subtitle">
          Lumped-capacitance RC thermal model prediction over 24 hours under extreme diurnal conditions.
        </p>
      </div>

      {/* Executive KPI Cards */}
      <div className="kpi-banner-grid kpi-dashboard">
        <div className="kpi-pill">
          <span className="kpi-pill-label">Lowest Outdoor Night</span>
          <span className="kpi-pill-value text-cold">{sim.lowestOutdoorTempNightC.toFixed(1)} °C</span>
          <span className="kpi-pill-sub">Severe Ambient Chill</span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Lowest Indoor Night</span>
          <span
            className={`kpi-pill-value ${
              sim.lowestIndoorTempNightC >= CONFIG.COMFORT_THRESHOLD_C ? 'text-success' : 'text-danger'
            }`}
          >
            {sim.lowestIndoorTempNightC.toFixed(1)} °C
          </span>
          <span className="kpi-pill-sub">
            ΔT buffer: +{(sim.lowestIndoorTempNightC - sim.lowestOutdoorTempNightC).toFixed(1)} °C
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Solar Heat Gain</span>
          <span className="kpi-pill-value text-solar">{sim.solarHeatGainKwh.toFixed(2)} kWh</span>
          <span className="kpi-pill-sub">Daily Passive Solar Harvest</span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Total Daily Heat Loss</span>
          <span className="kpi-pill-value text-loss">{sim.totalHeatLossKwh.toFixed(2)} kWh</span>
          <span className="kpi-pill-sub">Conduction + Vent + Sky</span>
        </div>
        <div className={`kpi-pill ${comfortPass ? 'kpi-success' : 'kpi-warning'}`}>
          <span className="kpi-pill-label">Comfort Target ({CONFIG.COMFORT_THRESHOLD_C}°C)</span>
          <span className="kpi-pill-value">{comfortPass ? 'PASS ✓' : 'FAIL ⚠️'}</span>
          <span className="kpi-pill-sub">
            {comfortPass ? 'Comfort Maintained' : `${sim.hoursBelowComfortThreshold} hrs below threshold`}
          </span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-pill-label">Supplementary Energy</span>
          <span className="kpi-pill-value">{sim.supplementaryHeatingNeededKwhPerDay.toFixed(2)} kWh</span>
          <span className="kpi-pill-sub">Daily Top-Up Needed</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2-col">
        {/* 24-Hour Temperature Trajectory Chart */}
        <div className="card chart-card">
          <div className="card-header-flex">
            <h3 className="card-title">24-Hour Diurnal Temperature Profile</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot dot-indoor"></span> Indoor Temp
              </span>
              <span className="legend-item">
                <span className="legend-dot dot-outdoor"></span> Outdoor Temp
              </span>
              <span className="legend-item">
                <span className="legend-line line-threshold"></span> Target ({CONFIG.COMFORT_THRESHOLD_C}°C)
              </span>
            </div>
          </div>

          <div className="svg-chart-container">
            <svg
              className="temp-svg-chart"
              viewBox={`0 0 ${width} ${height}`}
              onMouseLeave={() => setHoveredHour(null)}
            >
              {/* Y Grid & Labels */}
              {yTicks.map((t) => {
                const y = getY(t);
                return (
                  <g key={t}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="var(--chart-grid)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="var(--chart-axis-text)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {t}°C
                    </text>
                  </g>
                );
              })}

              {/* Comfort threshold line */}
              <line
                x1={padLeft}
                y1={thresholdY}
                x2={width - padRight}
                y2={thresholdY}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />

              {/* Outdoor temperature trajectory */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={outdoorPoints}
              />

              {/* Indoor temperature trajectory */}
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={indoorPoints}
              />

              {/* X-axis hours & interactive hover hitboxes */}
              {Array.from({ length: 24 }).map((_, h) => {
                const x = getX(h);
                const isHovered = hoveredHour === h;
                const inT = sim.hourlyIndoorTempC[h];
                const outT = sim.hourlyOutdoorTempC[h];
                const solW = sim.hourlySolarGainW ? sim.hourlySolarGainW[h] : 0;

                return (
                  <g key={h}>
                    {h % 3 === 0 && (
                      <text
                        x={x}
                        y={height - 8}
                        textAnchor="middle"
                        fill="var(--chart-axis-text)"
                        fontSize="10"
                        fontFamily="var(--font-mono)"
                      >
                        {String(h).padStart(2, '0')}:00
                      </text>
                    )}

                    {/* Interactive hover column */}
                    <rect
                      x={x - plotW / 46}
                      y={padTop}
                      width={plotW / 23}
                      height={plotH}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredHour(h)}
                    />

                    {isHovered && (
                      <g>
                        <line
                          x1={x}
                          y1={padTop}
                          x2={x}
                          y2={padTop + plotH}
                          stroke="var(--accent-cyan)"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <circle cx={x} cy={getY(inT)} r="5" fill="#0284c7" stroke="#fff" strokeWidth="2" />
                        <circle cx={x} cy={getY(outT)} r="4" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />

                        {/* Tooltip Box */}
                        <g transform={`translate(${Math.min(Math.max(x - 60, padLeft), width - padRight - 130)}, ${padTop + 10})`}>
                          <rect
                            width="130"
                            height="65"
                            rx="6"
                            fill="var(--bg-surface)"
                            stroke="var(--border-color)"
                            filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"
                          />
                          <text x="10" y="16" fontSize="10" fontWeight="bold" fill="var(--text-main)" fontFamily="var(--font-mono)">
                            Hour {String(h).padStart(2, '0')}:00
                          </text>
                          <text x="10" y="32" fontSize="10" fill="#0284c7" fontFamily="var(--font-mono)">
                            Indoor: {inT.toFixed(1)} °C
                          </text>
                          <text x="10" y="46" fontSize="10" fill="#6366f1" fontFamily="var(--font-mono)">
                            Outdoor: {outT.toFixed(1)} °C
                          </text>
                          <text x="10" y="59" fontSize="9" fill="#d97706" fontFamily="var(--font-mono)">
                            Solar: {solW.toFixed(0)} W
                          </text>
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="chart-caption">
            Diurnal curve showing thermal lag and overnight retention assisted by internal thermal mass flywheel. Hover points for hourly readouts.
          </div>
        </div>

        {/* Heat Loss Breakdown by Component */}
        <div className="card chart-card">
          <h3 className="card-title">Heat Loss by Building Subsystem</h3>
          <div className="loss-breakdown-list">
            {renderLossComponent('Walls Conduction', comp.walls, '#38bdf8')}
            {renderLossComponent('Roof Conduction', comp.roof, '#818cf8')}
            {renderLossComponent('Floor Conduction', comp.floor, '#a78bfa')}
            {renderLossComponent('Windows Conduction', comp.windows, '#fb923c')}
            {renderLossComponent('Doors Conduction', comp.doors, '#f472b6')}
            {renderLossComponent('Air Ventilation (ACH)', comp.ventilation, '#34d399')}
            {renderLossComponent('Clear-Sky Radiation', comp.sky, '#60a5fa')}
          </div>
        </div>
      </div>

      {/* Navigation & Next Steps */}
      <div className="step-nav">
        <button
          type="button"
          className="btn btn-secondary btn-prev"
          onClick={() => {
            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ← Edit Materials
        </button>
        <button
          type="button"
          className="btn btn-primary btn-next"
          onClick={() => {
            setStep(5);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Proceed to Automated Optimization →
        </button>
      </div>
    </div>
  );
}
