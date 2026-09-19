'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import ladakhData from '@/src/data/ladakh-fallback.json';
import { simulate24h } from '@/src/engine/simulate.js';
import { runOptimization } from '@/src/optimize/rankDesigns.js';

export interface ClimateState {
  location: string;
  latitude: number;
  longitude: number;
  nightTempC: number;
  dayTempC: number;
  peakSolarRadiationWm2: number;
  annualIrradianceKwhM2: number;
  sunshineHoursPerDay: number;
  cloudFreeDaysPerYear: number;
  windSpeedMs: number;
  humidityPct: number;
  altitudeM: number;
  simulationDate: string;
  targetComfortTempC: number;
  isLive?: boolean;
  source?: string;
}

export interface ShelterState {
  lengthM: number;
  widthM: number;
  heightM: number;
  shape: string;
  orientation: string;
  windowAreaM2: number;
  doorAreaM2: number;
}

export interface LayerItem {
  materialId: string;
  thicknessM: number;
}

export interface MaterialsState {
  wallLayers: LayerItem[];
  roofLayers: LayerItem[];
  floorLayers: LayerItem[];
  windowType: string;
  doorType: string;
  insulationGrade: string;
  thermalMassType: string;
  airChangesPerHour: number;
}

export interface SimulationResults {
  hourlyIndoorTempC: number[];
  hourlyOutdoorTempC: number[];
  hourlySolarGainW: number[];
  hourlyHeatLossW: number[];
  lowestIndoorTempNightC: number;
  lowestOutdoorTempNightC: number;
  peakIndoorTempDayC: number;
  solarHeatGainKwh: number;
  totalHeatLossKwh: number;
  heatLossByComponentKwh: {
    walls: number;
    roof: number;
    floor: number;
    windows: number;
    doors: number;
    ventilation: number;
    sky: number;
  };
  comfortAcceptable: boolean;
  hoursBelowComfortThreshold: number;
  supplementaryHeatingNeededKwhPerDay: number;
  geometry: any;
  uValues: any;
  cTotal: number;
}

export interface RankedDesign {
  rank?: number;
  orientation: string;
  insulationGrade: string;
  windowAreaM2: number;
  thermalMassType: string;
  lowestIndoorTempNightC: number;
  comfortAcceptable: boolean;
  solarHeatGainKwh: number;
  totalHeatLossKwh: number;
  supplementaryHeatingNeededKwhPerDay: number;
}

interface ShelterContextType {
  currentStep: number;
  setStep: (step: number) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  climate: ClimateState;
  shelter: ShelterState;
  materials: MaterialsState;
  simulationResults: SimulationResults | null;
  optimizationResults: RankedDesign[] | null;
  bestOptimization: RankedDesign | null;
  isOptimizing: boolean;
  updateClimate: (updates: Partial<ClimateState>) => void;
  updateShelter: (updates: Partial<ShelterState>) => void;
  updateMaterials: (updates: Partial<MaterialsState>) => void;
  triggerOptimization: () => void;
  applyDesign: (design: Partial<RankedDesign>) => void;
  resetProject: () => void;
}

const ShelterContext = createContext<ShelterContextType | undefined>(undefined);

const initialClimate: ClimateState = {
  ...ladakhData,
  isLive: false,
  source: 'Offline Ladakh Fallback Profile'
};

const initialShelter: ShelterState = {
  lengthM: 6.0,
  widthM: 4.0,
  heightM: 2.6,
  shape: 'rectangular',
  orientation: 'south',
  windowAreaM2: 3.0,
  doorAreaM2: 1.8
};

const initialMaterials: MaterialsState = {
  wallLayers: [{ materialId: 'rammed-earth', thicknessM: 0.30 }],
  roofLayers: [{ materialId: 'timber-softwood', thicknessM: 0.10 }],
  floorLayers: [{ materialId: 'dense-concrete', thicknessM: 0.15 }],
  windowType: 'double-glazed',
  doorType: 'uninsulated',
  insulationGrade: 'medium',
  thermalMassType: 'heavy',
  airChangesPerHour: 0.6
};

export function ShelterProvider({ children }: { children: ReactNode }) {
  const [currentStep, setStep] = useState<number>(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [climate, setClimate] = useState<ClimateState>(initialClimate);
  const [shelter, setShelter] = useState<ShelterState>(initialShelter);
  const [materials, setMaterials] = useState<MaterialsState>(initialMaterials);

  const [optimizationResults, setOptimizationResults] = useState<RankedDesign[] | null>(null);
  const [bestOptimization, setBestOptimization] = useState<RankedDesign | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Load saved theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('thermoshelter_theme') as 'light' | 'dark') || 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('thermoshelter_theme', next);
        document.documentElement.setAttribute('data-theme', next);
      }
      return next;
    });
  };

  // Run 24h simulation automatically whenever inputs change
  const simulationResults = useMemo(() => {
    try {
      return simulate24h(climate, shelter, materials) as SimulationResults;
    } catch (err) {
      console.error('Simulation error:', err);
      return null;
    }
  }, [climate, shelter, materials]);

  const updateClimate = (updates: Partial<ClimateState>) => {
    setClimate(prev => ({ ...prev, ...updates }));
  };

  const updateShelter = (updates: Partial<ShelterState>) => {
    setShelter(prev => ({ ...prev, ...updates }));
  };

  const updateMaterials = (updates: Partial<MaterialsState>) => {
    setMaterials(prev => ({ ...prev, ...updates }));
  };

  const triggerOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      try {
        const res = runOptimization(climate, shelter, materials);
        const ranked = (res.rankedDesigns || res.ranked) as RankedDesign[];
        const best = (res.bestDesign || res.best) as RankedDesign;
        setOptimizationResults(ranked);
        setBestOptimization(best);
      } catch (e) {
        console.error('Optimization error:', e);
      } finally {
        setIsOptimizing(false);
      }
    }, 50);
  };

  const applyDesign = (design: Partial<RankedDesign>) => {
    if (design.orientation) {
      setShelter(prev => ({ ...prev, orientation: design.orientation! }));
    }
    if (design.windowAreaM2 !== undefined) {
      setShelter(prev => ({ ...prev, windowAreaM2: design.windowAreaM2! }));
    }
    setMaterials(prev => ({
      ...prev,
      insulationGrade: design.insulationGrade || prev.insulationGrade,
      thermalMassType: design.thermalMassType || prev.thermalMassType
    }));
  };

  const resetProject = () => {
    setClimate(initialClimate);
    setShelter(initialShelter);
    setMaterials(initialMaterials);
    setOptimizationResults(null);
    setBestOptimization(null);
    setStep(1);
  };

  return (
    <ShelterContext.Provider
      value={{
        currentStep,
        setStep,
        theme,
        toggleTheme,
        climate,
        shelter,
        materials,
        simulationResults,
        optimizationResults,
        bestOptimization,
        isOptimizing,
        updateClimate,
        updateShelter,
        updateMaterials,
        triggerOptimization,
        applyDesign,
        resetProject
      }}
    >
      {children}
    </ShelterContext.Provider>
  );
}

export function useShelter() {
  const context = useContext(ShelterContext);
  if (!context) {
    throw new Error('useShelter must be used within a ShelterProvider');
  }
  return context;
}
