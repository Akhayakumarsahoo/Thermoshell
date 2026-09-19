'use client';

import React from 'react';
import { useShelter } from '@/context/ShelterContext';

export function ShelterSchematic() {
  const { shelter } = useShelter();
  const { lengthM, widthM, heightM, shape, orientation, windowAreaM2 } = shelter;

  // Compute orientation angle in degrees for compass needle
  const orientationAngles: Record<string, number> = {
    south: 180,
    'south-east': 135,
    'south-west': 225,
    east: 90,
    west: 270,
    'north-east': 45,
    'north-west': 315,
    north: 0
  };
  const angle = orientationAngles[orientation.toLowerCase()] ?? 180;

  // Normalized scaling for diagram
  const maxDim = Math.max(lengthM, widthM, heightM, 5);
  const scale = 110 / maxDim;
  const rectW = Math.min(Math.max(lengthM * scale, 40), 160);
  const rectH = Math.min(Math.max(widthM * scale, 30), 110);
  const isoOffset = Math.min(Math.max(heightM * scale * 0.45, 15), 45);

  return (
    <div className="schematic-box">
      <div style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
        Axonometric Preview ({orientation.toUpperCase()})
      </div>

      <svg className="schematic-svg" viewBox="0 0 320 200">
        <defs>
          <linearGradient id="wallGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="glazingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Compass indicator */}
        <g transform="translate(42, 42)">
          <circle cx="0" cy="0" r="24" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="1.5" />
          <text x="0" y="-13" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-dim)">N</text>
          <text x="0" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--accent-amber)">S</text>
          <text x="18" y="3" textAnchor="middle" fontSize="8" fill="var(--text-dim)">E</text>
          <text x="-18" y="3" textAnchor="middle" fontSize="8" fill="var(--text-dim)">W</text>
          
          {/* Glazing Orientation Arrow */}
          <g transform={`rotate(${angle})`}>
            <line x1="0" y1="0" x2="0" y2="18" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="0,22 -3.5,15 3.5,15" fill="var(--accent-cyan)" />
          </g>
        </g>

        {/* Shelter Isometric Projection */}
        <g transform="translate(155, 105)">
          {shape === 'dome' ? (
            <g>
              <ellipse cx="0" cy="20" rx={rectW * 0.7} ry={rectH * 0.5} fill="url(#wallGradient)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
              <path
                d={`M ${-rectW * 0.7} 20 A ${rectW * 0.7} ${isoOffset * 1.5} 0 0 1 ${rectW * 0.7} 20 Z`}
                fill="url(#roofGradient)"
                stroke="var(--accent-cyan)"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="20" r="14" fill="url(#glazingGrad)" stroke="#b45309" strokeWidth="1" />
            </g>
          ) : (
            <g>
              {/* Floor Base */}
              <polygon
                points={`
                  0,${rectH / 2}
                  ${rectW / 2},0
                  0,${-rectH / 2}
                  ${-rectW / 2},0
                `}
                fill="var(--bg-surface-elevated)"
                stroke="var(--border-color)"
                strokeWidth="1"
              />

              {/* Front Left Wall */}
              <polygon
                points={`
                  ${-rectW / 2},0
                  0,${rectH / 2}
                  0,${rectH / 2 - isoOffset}
                  ${-rectW / 2},${-isoOffset}
                `}
                fill="url(#wallGradient)"
                stroke="var(--accent-cyan)"
                strokeWidth="1.5"
              />

              {/* Front Right Wall (Aperture facade) */}
              <polygon
                points={`
                  0,${rectH / 2}
                  ${rectW / 2},0
                  ${rectW / 2},${-isoOffset}
                  0,${rectH / 2 - isoOffset}
                `}
                fill="url(#wallGradient)"
                stroke="var(--accent-cyan)"
                strokeWidth="1.5"
              />

              {/* Glazing aperture window on front facade */}
              {windowAreaM2 > 0 && (
                <polygon
                  points={`
                    ${rectW * 0.1},${rectH * 0.4}
                    ${rectW * 0.38},${rectH * 0.12}
                    ${rectW * 0.38},${rectH * 0.12 - isoOffset * 0.55}
                    ${rectW * 0.1},${rectH * 0.4 - isoOffset * 0.55}
                  `}
                  fill="url(#glazingGrad)"
                  stroke="#b45309"
                  strokeWidth="1"
                />
              )}

              {/* Roof */}
              <polygon
                points={`
                  0,${rectH / 2 - isoOffset}
                  ${rectW / 2},${-isoOffset}
                  0,${-rectH / 2 - isoOffset}
                  ${-rectW / 2},${-isoOffset}
                `}
                fill="url(#roofGradient)"
                stroke="var(--accent-cyan)"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Dimension annotations */}
          <text x="0" y={rectH / 2 + 18} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)">
            {lengthM}m (L) × {widthM}m (W) × {heightM}m (H)
          </text>
        </g>
      </svg>
    </div>
  );
}
