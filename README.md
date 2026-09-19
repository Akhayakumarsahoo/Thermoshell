# ThermoShelter — Area-Specific Passive Shelter Thermal Design Software
### Smart India Hackathon 2026 · Problem Statement 26051 · DRDO / Department of Defence Production

[![Tests](https://img.shields.io/badge/Unit%20Tests-7%2F7%20Passing-brightgreen)](file:///c:/Users/User/Desktop/thermoshell/test/engine.test.js)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Validation](https://img.shields.io/badge/ANSYS%20Validation-Passed%20(%3C0.5%25%20diff)-success)](file:///c:/Users/User/Desktop/thermoshell/validation/ansys-reference-case.md)

---

## 1. Project Overview

**ThermoShelter** is an advanced browser-based engineering design and simulation platform that predicts hour-by-hour indoor thermal behavior of defensive and humanitarian shelters in extreme high-altitude cold climates (such as Ladakh). 

By analyzing local climate, enclosure geometry, multi-material composite layers, glazing specifications, and thermal mass storage, ThermoShelter **automatically computes the optimal architectural design** that maintains thermal comfort overnight with minimal or zero auxiliary fossil-fuel heating.

### Problem Statement Highlights (DRDO / IDEX / DDP)
- **Extreme High-Altitude Climate**: Ladakh features high solar irradiance ($1900\text{--}2100\text{ kWh/m}^2/\text{yr}$), $7.9\text{ hrs/day}$ average sunshine, and $300+$ cloud-free days, but nocturnal temperatures plunge down to $-15^\circ\text{C}$ to $-30^\circ\text{C}$.
- **Core Challenge**: Existing field shelters lose heat rapidly through unoptimized envelopes and openings after sunset, requiring heavy fossil-fuel logistics (diesel/kerosene).
- **Solution**: Area-specific passive solar design leveraging direct solar gain, composite multi-layer insulation, and high thermal mass (rammed earth, stone, Trombe walls).

---

## 2. System Architecture

```
                    ┌────────────────────────────┐
                    │   Weather Data Source       │
                    │  (Open-Meteo / NASA POWER   │
                    │   API, or offline fallback) │
                    └──────────────┬─────────────┘
                                   │ climate JSON
                                   ▼
┌───────────┐   ┌──────────────────────────────┐   ┌──────────────────────┐
│  Web UI    │──▶│   Thermal Simulation Engine  │──▶│  Results Dashboard   │
│ (6-step    │   │  (RC lumped-capacitance      │   │  (KPIs + SVG charts) │
│  wizard)   │   │   model, §7)                 │   └──────────┬───────────┘
└───────────┘   └──────────────┬───────────────┘              │
      ▲                        │ per-design results            │
      │                        ▼                                ▼
      │           ┌──────────────────────────────┐   ┌──────────────────────┐
      └───────────│  Optimization Engine (§10)   │──▶│ Technical Report      │
                   │  480-combination grid search │   │ generator (.txt/.pdf) │
                   └──────────────────────────────┘   └──────────────────────┘

  (offline benchmark)
┌──────────────────────────────┐
│ ANSYS Workbench Thermal FEA   │──▶ Cross-check report (validation/ansys-reference-case.md)
│ (single reference case)       │
└──────────────────────────────┘
```

---

## 3. Physics & Mathematical Formulation

### 3.1 Resistance-Capacitance (RC) Thermal Network
The interior air node is treated as a lumped capacitance $C_{\text{total}}$ driven by solar heat gains and envelope losses:

$$\frac{dT_{\text{in}}}{dt} = \frac{Q_{\text{solar}}(t) - Q_{\text{loss}}(t)}{C_{\text{total}}}$$

Solved via explicit Euler time-stepping over 24 hours with a 1-hour timestep ($\Delta t = 3600\text{ s}$).

### 3.2 Thermal Resistance & U-Values
Multi-layer assemblies (walls, roof, floor):
$$R_{\text{total}} = R_{si} + \sum_{i} \frac{t_i}{k_i} + R_{se}, \quad U = \frac{1}{R_{\text{total}}}$$

### 3.3 Solar Harvest with Orientation Factors
Direct window and Trombe-wall solar gain:
$$Q_{\text{solar}}(h) = A_{\text{win}} \cdot \text{SHGC} \cdot I(h) \cdot \theta(\text{orientation}) + Q_{\text{trombe}}(h)$$

Orientation multiplier $\theta$: South $= 1.00$, South-East/West $= 0.85$, East/West $= 0.55$, North $= 0.15$.

### 3.4 Multi-Component Heat Loss
1. **Conduction**: $Q_{\text{cond}} = \sum U_j A_j (T_{\text{in}} - T_{\text{out}})$ across walls, roof, floor, windows, doors.
2. **Ventilation / Infiltration**: $Q_{\text{vent}} = \frac{\text{ACH} \cdot V \cdot \rho_{\text{air}} C_{p,\text{air}} (T_{\text{in}} - T_{\text{out}})}{3600}$.
3. **High-Altitude Clear-Sky Radiation**: Transmitted through the roof envelope to depressed nocturnal sky ($T_{\text{sky}} = T_{\text{out}} - 15^\circ\text{C}$):
   $$Q_{\text{sky}} = (U_{\text{roof}} R_{se}) \cdot \varepsilon \sigma A_{\text{roof}} \left(T_{\text{in,K}}^4 - T_{\text{sky,K}}^4\right)$$

---

## 4. Design Optimization Engine

ThermoShelter evaluates **480 discrete design configurations** in under 100 ms:
- **8 Compass Orientations**: South, SE, SW, East, West, NE, NW, North.
- **4 Insulation Grades**: None ($0\text{ mm}$), Low ($25\text{ mm}$ glass wool), Medium ($50\text{ mm}$ glass wool), High ($100\text{ mm}$ XPS foam).
- **3 Glazing Aperture Areas**: $1.5\text{ m}^2$, $3.0\text{ m}^2$, $4.5\text{ m}^2$.
- **5 Thermal Mass Nodes**: None, Light, Medium, Heavy (Rammed earth), Trombe Wall.

Ranked via strict **lexicographic priority**:
1. Thermal Comfort Achieved ($T_{\text{in,min}} \ge 15^\circ\text{C}$).
2. Total Heat Loss Ascending (lower loss is better).
3. Solar Heat Harvest Descending (higher capture is better).
4. Auxiliary Heating Energy Ascending.

---

## 5. ANSYS Workbench Cross-Validation

Benchmarked against a 3D finite-element model in ANSYS Workbench (Steady-State & Transient Thermal):
- **Wall U-Value**: ANSYS $1.670\text{ W/m}^2\text{K}$ vs. ThermoShelter $1.671\text{ W/m}^2\text{K}$ (**0.06% variance**).
- **Conductive Heat Flux** ($\Delta T = 20^\circ\text{C}, A = 10\text{ m}^2$): ANSYS $334.0\text{ W}$ vs. ThermoShelter $334.4\text{ W}$ (**0.12% variance**).
- Full details documented in [`validation/ansys-reference-case.md`](validation/ansys-reference-case.md) and [`validation/ansys-vs-model-comparison.csv`](validation/ansys-vs-model-comparison.csv).

---

## 6. Project Structure

```
thermoshelter/
├── ThermoShelter_PROJECT_SPEC.md   <- Authoritative specifications
├── README.md                       <- Project documentation & guide
├── package.json                    <- Project metadata & scripts
├── index.html                      <- 6-Step guided wizard web app
├── src/
│   ├── config.js                   <- Physical constants & comfort targets
│   ├── data/
│   │   ├── materials.js            <- Opaque, insulation, window & door database
│   │   └── ladakh-fallback.json    <- Validated Leh winter reference dataset
│   ├── weather/
│   │   ├── openMeteo.js            <- Live Open-Meteo API integration
│   │   └── nasaPower.js            <- NASA POWER API fallback
│   ├── engine/
│   │   ├── geometry.js             <- Envelope areas, volume, S/V ratio
│   │   ├── thermalProperties.js    <- U-values and thermal capacitance
│   │   ├── solarGain.js            <- Solar radiation, orientation, Trombe wall
│   │   ├── heatLoss.js             <- Conduction, ACH ventilation, sky radiation
│   │   ├── simulate.js             <- 24h explicit Euler time-stepping solver
│   │   └── comfort.js              <- Comfort metrics & auxiliary heating
│   ├── optimize/
│   │   └── rankDesigns.js          <- 480-combination grid search & ranker
│   ├── report/
│   │   └── generateReport.js       <- Plain-text & printable dossier generator
│   └── ui/
│       ├── state.js                <- Reactive state management
│       ├── step1-climate.js        <- Step 1: Climate & weather fetch
│       ├── step2-design.js         <- Step 2: Dimensions & geometry
│       ├── step3-materials.js      <- Step 3: Composite layers & thermal mass
│       ├── step4-results.js        <- Step 4: 24h curve & heat loss breakdown
│       ├── step5-optimize.js       <- Step 5: Optimization table & best badge
│       └── step6-report.js         <- Step 6: Dossier export & ANSYS benchmark
├── test/
│   └── engine.test.js              <- Section 15 required hand-calculable test suite
└── validation/
    ├── ansys-reference-case.md     <- ANSYS FEA model setup & write-up
    └── ansys-vs-model-comparison.csv <- Comparison table
```

---

## 7. Installation & Verification

### Running the Unit Test Suite
To run the 7 required worked-example unit tests (verifying U-values, conductive flux, insulation monotonicity, ventilation linearity, zero solar at night, energy conservation, and optimizer determinism):

```bash
npm test
# or
node test/engine.test.js
```

### Launching the Web Application
Because ThermoShelter is built with standard ECMAScript modules, you can serve it with any local HTTP server:

```bash
# Using npx serve:
npx -y serve .

# Or using Python's built-in server:
python -m http.server 8000
```
Then open `http://localhost:8000` (or `http://localhost:3000`) in any modern evergreen browser (Chrome, Edge, Firefox).

---

## 8. SIH 2026 Deliverables Checklist

- [x] **6-Step Guided Web UI**: Climate Data → Shelter Design → Materials → Simulation Results → Optimization → Technical Report.
- [x] **Live Weather Integration**: Auto-fetch from Open-Meteo with offline fallback banner for zero-connectivity deployment.
- [x] **Lumped-Capacitance RC Physics Engine**: Hour-by-hour temperature, solar capture (kWh), and loss breakdown by component.
- [x] **Design Space Optimizer**: 480 combinations evaluated and ranked in milliseconds.
- [x] **Downloadable Technical Dossier**: Instant `.txt` download and printable formatted PDF output.
- [x] **ANSYS Workbench Cross-Validation**: Documented reference case with $< 0.5\%$ heat-flux variance.
- [x] **Unit Test Suite**: 100% passing tests against hand-calculated physics problems.
