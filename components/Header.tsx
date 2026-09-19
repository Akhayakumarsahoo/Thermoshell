'use client';

import React from 'react';
import { useShelter } from '@/context/ShelterContext';

export function Header() {
  const { theme, toggleTheme, climate } = useShelter();

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-logo-icon">🏔️</div>
        <div>
          <div className="brand-title">ThermoShelter</div>
        </div>
        <span className="brand-badge">Passive Thermal Engine</span>
      </div>
      <div className="header-badges">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Toggle Light / Dark Mode"
        >
          <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="theme-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
        <span className="drdo-tag">DRDO / DDP · PS 26051</span>
        <span className="drdo-tag" id="header-location-tag">
          {climate.location || `Lat ${climate.latitude}, Lon ${climate.longitude}`}
        </span>
      </div>
    </header>
  );
}
