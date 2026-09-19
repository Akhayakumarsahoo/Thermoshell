'use client';

import React, { useState } from 'react';
import { useShelter, RankedDesign } from '@/context/ShelterContext';

export function Step5Optimize() {
  const {
    optimizationResults,
    bestOptimization,
    isOptimizing,
    triggerOptimization,
    applyDesign,
    setStep
  } = useShelter();

  const [filterComfortPass, setFilterComfortPass] = useState(false);

  const displayedResults = (optimizationResults || [])
    .filter((d) => (filterComfortPass ? d.comfortAcceptable : true))
    .slice(0, 50);

  const handleAdoptAndProceed = (design: RankedDesign) => {
    applyDesign(design);
    setStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="step-header">
        <div className="step-number-badge">STEP 05</div>
        <h2>Automated Design Space Optimization</h2>
        <p className="step-subtitle">
          Discrete grid sweep across 480 permutations (Orientation × Insulation × Window Area × Thermal Mass) ranked by comfort and efficiency.
        </p>
      </div>

      {/* Optimization Trigger Card */}
      <div className="card toolbar-card">
        <div className="optimize-banner-flex">
          <div>
            <h3 className="card-title">Grid Search Parameter Space: 480 Combinations</h3>
            <p className="text-muted">
              Evaluates 8 Compass Orientations × 4 Insulation Grades × 3 Window Apertures × 5 Thermal Mass Types in milliseconds.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={triggerOptimization}
            disabled={isOptimizing}
          >
            {isOptimizing ? <span className="spinner" /> : <span className="icon">⚡</span>}
            <span>{isOptimizing ? 'Simulating 480 Configurations...' : 'Generate & Simulate Combinations'}</span>
          </button>
        </div>
      </div>

      {bestOptimization && (
        <div className="card best-design-card">
          <div className="best-badge-ribbon">⭐ RECOMMENDED BEST DESIGN (RANK #1)</div>
          <div className="best-design-grid">
            <div className="best-param-col">
              <h4>Optimal Architectural Configuration</h4>
              <ul className="best-specs-list">
                <li>
                  <strong>Glazing Orientation:</strong>{' '}
                  <span className="badge badge-accent">{bestOptimization.orientation.toUpperCase()}</span>
                </li>
                <li>
                  <strong>Insulation Grade:</strong>{' '}
                  <span className="badge badge-accent">{bestOptimization.insulationGrade.toUpperCase()}</span>
                </li>
                <li>
                  <strong>Window Aperture:</strong>{' '}
                  <span className="badge badge-accent">{bestOptimization.windowAreaM2} m²</span>
                </li>
                <li>
                  <strong>Thermal Mass Storage:</strong>{' '}
                  <span className="badge badge-accent">{bestOptimization.thermalMassType.toUpperCase()}</span>
                </li>
              </ul>
            </div>
            <div className="best-kpi-col">
              <h4>Predicted Thermal Performance</h4>
              <div className="kpi-mini-grid">
                <div className="mini-kpi">
                  <span className="label">Night Min Temp</span>
                  <span className="val text-success">
                    {bestOptimization.lowestIndoorTempNightC.toFixed(1)} °C
                  </span>
                </div>
                <div className="mini-kpi">
                  <span className="label">Total Heat Loss</span>
                  <span className="val">{bestOptimization.totalHeatLossKwh.toFixed(2)} kWh</span>
                </div>
                <div className="mini-kpi">
                  <span className="label">Solar Capture</span>
                  <span className="val text-solar">{bestOptimization.solarHeatGainKwh.toFixed(2)} kWh</span>
                </div>
                <div className="mini-kpi">
                  <span className="label">Auxiliary Energy</span>
                  <span className="val">{bestOptimization.supplementaryHeatingNeededKwhPerDay.toFixed(2)} kWh</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-success btn-block"
                style={{ marginTop: '1rem' }}
                onClick={() => handleAdoptAndProceed(bestOptimization)}
              >
                ✓ Apply Best Design & View Technical Dossier →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ranked Results Table */}
      {optimizationResults && optimizationResults.length > 0 && (
        <div className="card table-card">
          <div className="card-header-flex">
            <h3 className="card-title">Full Lexicographic Ranking (Top 50 of 480)</h3>
            <div className="table-filter-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterComfortPass}
                  onChange={(e) => setFilterComfortPass(e.target.checked)}
                />
                <span>Comfort PASS Only</span>
              </label>
            </div>
          </div>

          <div className="table-responsive">
            <table className="opt-table">
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
                {displayedResults.map((row, idx) => {
                  const rank = row.rank || idx + 1;
                  const isBest = rank === 1;
                  return (
                    <tr key={idx} className={isBest ? 'row-best' : ''}>
                      <td>
                        <span className={`rank-badge ${rank === 1 ? 'rank-1' : ''}`}>
                          #{rank}
                        </span>
                      </td>
                      <td>{row.orientation.toUpperCase()}</td>
                      <td>{row.insulationGrade.toUpperCase()}</td>
                      <td>{row.windowAreaM2} m²</td>
                      <td>{row.thermalMassType.toUpperCase()}</td>
                      <td style={{ fontWeight: 600 }}>{row.lowestIndoorTempNightC.toFixed(1)} °C</td>
                      <td>{row.totalHeatLossKwh.toFixed(2)}</td>
                      <td>{row.solarHeatGainKwh.toFixed(2)}</td>
                      <td>
                        <span className={`status-chip ${row.comfortAcceptable ? 'chip-pass' : 'chip-fail'}`}>
                          {row.comfortAcceptable ? 'PASS ✓' : 'FAIL'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            applyDesign(row);
                            alert(`Adopted configuration: ${row.orientation} / ${row.insulationGrade} / ${row.thermalMassType}`);
                          }}
                        >
                          Adopt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="step-nav">
        <button
          type="button"
          className="btn btn-secondary btn-prev"
          onClick={() => {
            setStep(4);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          ← Back to Simulation Results
        </button>
        <button
          type="button"
          className="btn btn-primary btn-next"
          onClick={() => {
            setStep(6);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Proceed to Technical Report →
        </button>
      </div>
    </div>
  );
}
