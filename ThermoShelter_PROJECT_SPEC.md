# ThermoShelter — Area-Specific Passive Shelter Thermal Design Software
### Full Build Specification (for AI coding agent)
**SIH 2026 · Problem Statement 26051 · DRDO / Department of Defence Production**

---

## 0. How to use this document

This file is a complete, self-contained specification. It is written so that an AI coding
agent (e.g. Claude Code) can implement the software **without needing to guess or invent
any technical detail**. Rules for the agent while building this:

1. **Every number in this document that looks like a real physical constant (material
   properties, API parameter names, comfort thresholds) has been deliberately sourced or
   flagged as "reference/approximate."** Where a value is marked `[VERIFY]`, treat it as a
   reasonable placeholder, keep it in one central config file (see §6.5), and do **not**
   present it in the UI or report as an authoritative/standard value without that caveat.
2. **Do not invent citations, standards clause numbers, or API endpoints not listed here.**
   If you need a capability not specified in this document, add a `TODO` comment and an
   entry in the Assumptions Log (§19) instead of fabricating a plausible-sounding detail.
3. **Follow the exact variable names, units, and function signatures given below.** This
   keeps the codebase internally consistent and makes it possible to unit-test against the
   worked examples in §15.
4. Build in the order given in §3 (MVP first, then stretch features). Do not skip the
   validation step (§12) — it is a required deliverable for the hackathon, not optional
   polish.
5. If at any point the spec is ambiguous, prefer the **simpler, more transparent**
   implementation over a cleverer one — judges and teammates need to be able to explain
   every number the tool produces.

---

## 1. Project Summary

**Name (working title):** ThermoShelter
**One-line description:** A browser-based software model that predicts a shelter's
hour-by-hour indoor temperature from user-supplied climate, geometry, and material data,
and automatically recommends the design (shape, orientation, materials, insulation,
glazing, thermal mass) that best maintains thermal comfort overnight with minimum
supplementary energy — built and validated for Ladakh's high-altitude cold-desert climate,
but usable for any climate.

**Primary goal (from the PS):** Minimize energy/fossil-fuel use for thermal comfort by
matching shelter shape, materials, and thermal mass to a region's climate.

**What this document covers:** everything needed to build the working software —
architecture, exact physics equations, data schema, material reference data, weather-API
integration, optimization logic, UI spec, validation plan, and file structure.

---

## 2. Problem Statement (verbatim, for grounding — do not paraphrase or alter)

> **Problem Statement ID:** 26051
> **Title:** Software Based Model Development for Design of Area Specific Shelter for
> Thermal Comfort Maintenance.
>
> **Background:** The ambient atmospheric condition affects the temperature inside the
> shelter and makes thermal management necessary for maintenance of temperature in the
> comfortable range. The existing shelters for any region are generally not designed as
> per the requirements of a particular region and hence not energy efficient, thus
> demanding an external thermal comfort maintenance system. Area-specific designed
> shelters look like a smart, one-time solution for thermal management as per the
> atmospheric condition of the region. This project is conceptualised keeping in mind the
> tough climatic conditions of a high-altitude cold region like Ladakh, and can be used for
> studying the design requirements of other climatic-region shelters as well.
>
> **Description:** Ladakh has high solar irradiance (1900–2100 kWh/m²/year), long average
> sunshine duration (7.9 hrs/day), and 300+ average annual cloud-free days. Shelters are
> found suitable during daytime (even in winter) due to trapped solar radiation, but
> temperatures approach ambient after sunset due to high thermal losses through the
> shelter's material and openings. A detailed thermal analysis (size, shape, orientation),
> plus study of suitable materials, thermal-mass storage materials, composite
> multi-materials, and openings, is a potential solution for a self-sufficient passive
> shelter. A general model in ANSYS software to thermally simulate the shelter, study heat
> losses, and capture real-time ambient climatic data is required. The model should be
> user-friendly, work on user-defined values (real-time data, material properties), and
> allow comparative analysis across materials under the same ambient conditions to predict
> the most efficient combination of material/shape/size for temperature maintenance.
>
> **Expected Solution — the model must be able to:**
> 1. Predict shelter inside temperature based on user-defined inputs.
> 2. Predict thermal energy generated from solar radiation.
> 3. Give heat-flow details as per the temperature difference between ambient and shelter
>    temperature, for a defined time period.
>
> **Organization:** DRDO. **Department:** Department of Defence Production / IDEX.

---

## 3. Scope — what to build

### 3.1 MVP (must-have, judged deliverable)
- [ ] 6-step guided web UI: Climate Data → Shelter Design → Materials → Simulation Results
      → Optimization → Technical Report (see §11 for exact fields/behaviour).
- [ ] Climate auto-fetch from a live weather API, with manual override and an offline
      Ladakh fallback dataset (§9).
- [ ] Physics engine implementing the equations in §7 (RC lumped-capacitance thermal
      network), producing:
      - Hour-by-hour indoor temperature for 24 h (PS task 1)
      - Solar heat gain in kWh (PS task 2)
      - Heat-flow breakdown by component and by ΔT (PS task 3)
- [ ] Comfort check against a configurable threshold.
- [ ] Design optimization: grid search + ranking across orientation, insulation grade,
      window area, thermal-mass type (§10).
- [ ] Downloadable technical report (txt/PDF) summarising the recommended design.
- [ ] One ANSYS Transient Thermal validation run cross-checked against the software's own
      output for a single reference case (§12) — required because the PS explicitly names
      ANSYS.
- [ ] Unit tests for the physics engine against hand-calculable worked examples (§15).

### 3.2 Stretch goals (only after MVP is complete and tested)
- [ ] Continuous optimization (e.g. simple gradient-free search) instead of discrete grid
      search.
- [ ] Multi-day / seasonal simulation (not just one representative day).
- [ ] Second climate profile (e.g. hot-arid) to demonstrate portability, as claimed in the
      PS ("can be used for studying other climatic regions").
- [ ] Cost/BOM estimate per recommended design.
- [ ] PDF export with charts (not just .txt).
- [ ] Sensitivity chart (which single change improves comfort the most).

### 3.3 Explicitly out of scope
- Full 3D CFD / finite-volume airflow simulation inside the shelter — the PS calls for a
  *design comparison tool*, not a research-grade CFD product. ANSYS is used once, offline,
  as a **validation reference**, not as the live interactive engine (it is too slow to run
  hundreds of times inside an optimization loop).
- Structural/load-bearing engineering analysis.
- Real-time IoT sensor integration (mention as future work only, do not build).

---

## 4. System Architecture

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
│ (6-step    │   │  (RC lumped-capacitance      │   │  (KPIs + charts)     │
│  wizard)   │   │   model, §7)                 │   └──────────┬───────────┘
└───────────┘   └──────────────┬───────────────┘              │
      ▲                        │ per-design results            │
      │                        ▼                                ▼
      │           ┌──────────────────────────────┐   ┌──────────────────────┐
      └───────────│  Optimization Engine (§10)   │──▶│ Technical Report      │
                   │  grid search + ranking       │   │ generator (.txt/.pdf) │
                   └──────────────────────────────┘   └──────────────────────┘

  (offline, one-time)
┌──────────────────────────────┐
│ ANSYS Transient Thermal model │──▶ Validation report (§12), NOT in the live app
│ (single reference case)       │
└──────────────────────────────┘
```

**Key architectural decision:** the simulation + optimization engine must run **entirely
client-side (in the browser, in JavaScript)** so that:
- it works offline at a demo venue or remote outpost with no connectivity (only the
  climate auto-fetch step needs the internet; everything else works without it),
- the optimization loop (hundreds of simulation runs) stays fast (each 24-hour simulation
  should take low-single-digit milliseconds — see §7.7),
- no backend server/hosting is required for the hackathon demo.

If the team prefers a Python backend (e.g. for the ANSYS-adjacent validation scripts or a
richer material database), that is fine **only for the offline validation step (§12)** —
the interactive tool itself stays client-side per above.

---

## 5. Tech Stack (pinned — do not substitute without updating this file)

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Plain HTML/CSS/JS, OR React (if the team already has the existing prototype in React) | The team has an existing working prototype (`shelter_simulation_ui_prototype.html`) built as a single-file vanilla HTML/JS wizard app. Extend that unless there's a strong reason to rewrite in React. |
| Charts | Chart.js or a small custom SVG line chart (the prototype already draws a temperature curve) | No heavy charting library needed for 24 hourly points. |
| Physics engine | Vanilla JS module, pure functions, no external numerical libraries required | The equations in §7 are simple enough not to need a solver library. |
| Weather data | Open-Meteo API (no key required) — primary; NASA POWER API — secondary/fallback | Exact endpoints in §9. |
| Offline fallback climate data | Hardcoded JSON object for Ladakh (values in §9.3) | Must work with zero network access. |
| Validation | ANSYS Workbench / Transient Thermal (desktop, offline, one run) | Not part of the shipped web app. |
| Report export | Client-side text file generation (`Blob` + `download` attribute); PDF export is a stretch goal (§3.2) | |
| Testing | Any lightweight JS test runner (e.g. plain `assert` functions run in Node, or Jest if available) | See §15 for required test cases. |

---

## 6. Data Model

All numeric fields use **SI units** unless explicitly noted (°C for temperature is used
instead of K for readability, but convert to Kelvin internally wherever an equation below
requires it — see §7 notes).

### 6.1 Climate Input

| Field | Type | Unit | Range (sane) | Default (Ladakh reference case) |
|---|---|---|---|---|
| `nightTempC` | float | °C | -40 to 30 | -15 |
| `dayTempC` | float | °C | -20 to 45 | 8 |
| `peakSolarRadiationWm2` | float | W/m² | 0–1200 | 850 |
| `annualIrradianceKwhM2` | float | kWh/m²/yr | 800–2600 | 2000 |
| `sunshineHoursPerDay` | float | hrs/day | 0–14 | 7.9 |
| `cloudFreeDaysPerYear` | int | days | 0–365 | 300 |
| `windSpeedMs` | float | m/s | 0–30 | 4.5 |
| `humidityPct` | float | % | 0–100 | 25 |
| `altitudeM` | float | m | -100–6000 | 3500 |
| `simulationDate` | date (ISO 8601) | — | any | 2026-01-15 |
| `latitude`, `longitude` | float | degrees | valid geo range | Leh, Ladakh ≈ 34.1526, 77.5771 (used for auto-fetch and solar-position calc) |

> These are the exact field names/units/defaults already used in the team's existing
> prototype UI (`shelter_simulation_ui_prototype.html`), reproduced here so the physics
> engine and UI stay in sync.

### 6.2 Shelter Design Input

| Field | Type | Unit | Range | Default |
|---|---|---|---|---|
| `lengthM` | float | m | 1–50 | 6 |
| `widthM` | float | m | 1–50 | 4 |
| `heightM` | float | m | 1.8–6 | 2.6 |
| `shape` | enum | — | `rectangular`, `dome`, `l-shaped`, `compact-cube` | `rectangular` |
| `orientation` | enum | — | `north`, `south`, `east`, `west`, `north-east`, `north-west`, `south-east`, `south-west` (facing direction of the main glazed wall) | `south` |
| `windowAreaM2` | float | m² | 0–20 | 3 |
| `doorAreaM2` | float | m² | 0–6 | 1.8 |

### 6.3 Material Input (per building element)

For **each** of: wall, roof, floor, window, and an optional thermal-mass element, the user
selects (or the optimizer assigns) one entry from the material reference table (§8), which
supplies `k` (W/m·K), `ρ` (kg/m³), `Cp` (J/kg·K). The user additionally specifies:

| Field | Type | Unit | Notes |
|---|---|---|---|
| `wallLayers[]` | array of `{materialId, thicknessM}` | m | Supports composite/multi-layer walls (as the PS explicitly asks for) |
| `roofLayers[]` | array of `{materialId, thicknessM}` | m | |
| `floorLayers[]` | array of `{materialId, thicknessM}` | m | |
| `windowType` | enum | — | `single-glazed`, `double-glazed`, `double-glazed-lowe` |
| `insulationGrade` | enum | — | `none`, `low`, `medium`, `high` — maps to an added insulation layer thickness in `wallLayers`/`roofLayers` (see §8.4) |
| `thermalMassType` | enum | — | `none`, `light`, `medium`, `heavy`, `trombe-wall` — see §8.5 |
| `airChangesPerHour` (ACH) | float | 1/hr | 0.3 (tight, sealed) to 3 (leaky) — default 0.6 for a well-sealed passive shelter |

### 6.4 Simulation Output

| Field | Type | Unit |
|---|---|---|
| `hourlyIndoorTempC[24]` | float array | °C |
| `hourlyOutdoorTempC[24]` | float array | °C |
| `lowestOutdoorTempNightC` | float | °C |
| `lowestIndoorTempNightC` | float | °C |
| `solarHeatGainKwh` | float | kWh (total over 24 h) |
| `heatLossByComponentKwh` | object `{walls, roof, floor, windows, doors, ventilation}` | kWh each |
| `totalHeatLossKwh` | float | kWh |
| `comfortAcceptable` | boolean | pass/fail vs threshold |
| `hoursBelowComfortThreshold` | int | 0–24 |
| `supplementaryHeatingNeededKwhPerDay` | float | kWh/day (energy needed to keep indoor temp at the comfort threshold whenever the passive design falls short) |

### 6.5 Config / constants file

Create a single `config.js` (or `.json`) holding every tunable constant used across the
app, so nothing is a "magic number" buried in code:

```js
export const CONFIG = {
  COMFORT_THRESHOLD_C: 15,       // [VERIFY] adjustable design target, not a hard ASHRAE figure — see §7.8
  STEFAN_BOLTZMANN: 5.670374e-8, // W/m^2K^4 — physical constant, exact
  AIR_DENSITY_KGM3: 1.2,         // kg/m^3 at ~20C, sea level; adjust for altitude if time allows
  AIR_SPECIFIC_HEAT_JKGK: 1005,  // J/kg.K
  GROUND_TEMP_ASSUMPTION_C: null, // if null, floor loss uses outdoor air temp; set a fixed value if the team wants to model ground coupling separately [VERIFY]
  SIM_TIMESTEP_HOURS: 1,
  OUTDOOR_SURFACE_EMISSIVITY: 0.9, // typical for painted/matte building surfaces [VERIFY per finish]
  SKY_TEMP_DEPRESSION_C: 15,     // typical clear-sky night sky temp is ~10-20C below air temp at altitude [VERIFY, see §7.5.3]
};
```

---

## 7. Physics Engine Specification

### 7.1 Modelling approach and why

Use a **single-zone, lumped-capacitance RC (resistance-capacitance) thermal network** —
the same family of simplified method used in building-energy standards such as ISO 13790's
hourly method (sometimes called "5R1C"). This is deliberately **not** a full CFD/finite-
element simulation, because:

- It runs in milliseconds, which is required to run the optimizer over hundreds of design
  combinations (§10) interactively in a browser.
- It is transparent and explainable — every number can be traced to a specific term in a
  visible equation, which matters for a judged software demo.
- Full CFD/FEA is reserved for the **one-time ANSYS validation run** (§12) that cross-checks
  this simplified model's key numbers (U-values, total heat flux) — satisfying the PS's
  explicit mention of ANSYS without making it the interactive engine.

The shelter interior is treated as **one well-mixed air node** at a single indoor
temperature `T_in`. All wall/roof/floor layers are treated as static resistances (steady
one-dimensional conduction through the layer stack); the only thermal mass explicitly
tracked as a capacitance is the interior thermal-mass element (§8.5) plus, optionally, the
indoor air. This is a standard, well-documented simplification — flag any further
simplification you make (e.g. ignoring thermal bridging at corners) as a code comment.

### 7.2 Geometry calculations

Given `lengthM (L)`, `widthM (W)`, `heightM (H)`:

```
floorAreaM2      = L * W
volumeM3         = L * W * H
wallAreaGrossM2  = 2*(L*H) + 2*(W*H)
wallAreaNetM2    = wallAreaGrossM2 - windowAreaM2 - doorAreaM2
roofAreaM2       = L * W          (flat-roof assumption; for 'dome' shape, use hemisphere
                                    surface area = 2*pi*r^2 with r chosen so base circle
                                    area ≈ L*W)
```

Surface-to-volume ratio `S/V = (wallAreaGrossM2 + roofAreaM2 + floorAreaM2) / volumeM3` —
report this number; lower S/V (more compact form) means less heat-loss surface per unit of
usable volume, which is directly relevant to the PS's "shape" factor.

### 7.3 Thermal resistance / U-value per building element

For a multi-layer element (wall, roof, floor) made of layers `i = 1..n`, each with
thickness `t_i` (m) and conductivity `k_i` (W/m·K):

```
R_layer_i   = t_i / k_i                      [m^2.K/W]
R_total     = R_si + sum(R_layer_i) + R_se   [m^2.K/W]
U           = 1 / R_total                    [W/m^2.K]
```

Where `R_si` and `R_se` are the standard internal/external surface (air-film) resistances.
Use these commonly tabulated values **[VERIFY against IS 3792 / ASHRAE Fundamentals before
final submission]**:

| Surface | R_si (m²K/W) | R_se (m²K/W) |
|---|---|---|
| Wall (vertical) | 0.13 | 0.04 |
| Roof (heat flow up) | 0.10 | 0.04 |
| Floor (heat flow down) | 0.17 | 0.04 |

For windows, do not compute U from layers — use the tabulated whole-window U-value and
Solar Heat Gain Coefficient (SHGC) directly from §8.6 (glass conduction physics is more
involved than opaque layers; whole-window U-values are the standard industry approach).

### 7.4 Solar heat gain

For each hour `h` of the day:

```
I(h)          = hourly solar irradiance on a horizontal surface [W/m^2]   (from weather
                 data or, if unavailable, derived from peakSolarRadiationWm2 using a
                 simple sinusoidal daylight-hours profile — see §7.4.1)
θ(h)          = angle of incidence correction factor for the glazed wall's orientation
                 relative to the sun's position at hour h  [dimensionless, 0-1]
Q_solar(h)    = windowAreaM2 * SHGC * I(h) * θ(h)            [W]
```

**§7.4.1 — if the weather API does not return per-hour irradiance for the exact date**,
approximate the daytime irradiance curve as a half-sine over the sunshine-hour window
centred on solar noon:

```
if hour is within daylight window (use sunrise/sunset from sunshineHoursPerDay,
   centred on 12:00 local solar time):
    I(h) = peakSolarRadiationWm2 * sin(pi * (h - sunrise) / sunshineHoursPerDay)
else:
    I(h) = 0
```

Flag this as an approximation in code comments — it is a reasonable simplification for an
MVP but is exactly the kind of thing that should be replaced with real per-hour API data
(§9) whenever available.

**§7.4.2 — orientation factor θ(h):** for the MVP, use a simplified table rather than full
solar-geometry trigonometry (stretch goal: replace with a proper solar-position + angle-of-
incidence calculation using latitude, declination, and hour angle):

| Orientation of glazed wall | θ multiplier (midday, winter sun, northern hemisphere, low sun angle) |
|---|---|
| South | 1.00 |
| South-east / South-west | 0.85 |
| East / West | 0.55 |
| North-east / North-west | 0.30 |
| North | 0.15 |

**§7.4.3 — opaque wall solar absorption (for thermal-mass / Trombe-wall designs):** if
`thermalMassType == 'trombe-wall'`, treat the sun-facing wall's outer surface as absorbing
solar energy directly (behind a glazed air-gap), using absorptance `α ≈ 0.9` for a
dark-painted mass wall, and route that absorbed heat into the mass-wall capacitance node
rather than into `Q_solar` directly. Keep this as a distinct term:
`Q_trombe_absorbed(h) = A_trombe * α * I(h) * τ_glazing` where `τ_glazing ≈ 0.85` (glazing
transmittance) [VERIFY].

### 7.5 Heat loss terms

**§7.5.1 — Conductive loss through each opaque/glazed element:**
```
Q_cond_element(h) = U_element * A_element * (T_in(h) - T_out(h))     [W]
```
Sum across walls, roof, floor, windows, doors (doors modelled as a single-layer element
with its own U-value — treat like a low-insulation wall unless the team specifies an
insulated door).

**§7.5.2 — Ventilation / infiltration loss:**
```
Q_vent(h) = ACH * volumeM3 * AIR_DENSITY_KGM3 * AIR_SPECIFIC_HEAT_JKGK
            * (T_in(h) - T_out(h)) / 3600            [W]
```
(the `/3600` converts the hourly air-change volume flow, `ACH * volumeM3` in m³/hr, into
m³/s to keep W as the power unit).

**§7.5.3 — Clear-sky radiative loss (important at high altitude — do not skip):**
At altitude, with 300+ clear nights per year, radiative loss to the night sky is a
significant, often-overlooked term. Model the effective sky temperature as depressed below
ambient air temperature on clear nights:
```
T_sky(h) = T_out(h) - SKY_TEMP_DEPRESSION_C     [use CONFIG value, default 15C — VERIFY,
                                                   real depression depends on humidity/cloud
                                                   cover and can be 10-30C]
Q_sky(h) = OUTDOOR_SURFACE_EMISSIVITY * STEFAN_BOLTZMANN * roofAreaM2
           * ((T_in(h)+273.15)^4 - (T_sky(h)+273.15)^4)     [W]
```
Apply this to the roof (the surface most exposed to open sky); optionally extend to walls
with an appropriate sky-view-factor if time allows (stretch goal).

**§7.5.4 — Total heat loss at hour h:**
```
Q_loss_total(h) = sum(Q_cond_element(h)) + Q_vent(h) + Q_sky(h)
```

### 7.6 Thermal mass / capacitance

```
C_total = sum over relevant mass elements of ( ρ_i * Cp_i * Volume_i )     [J/K]
```
Include: the indoor air (`ρ_air * Cp_air * volumeM3`, usually small) **plus** the thermal-
mass element chosen in §6.3/§8.5 (e.g. a rammed-earth or Trombe wall's mass — this is
normally the dominant term and is *the* variable the PS is most interested in).

### 7.7 Time-stepping solver (pseudocode)

```
function simulate24h(inputs) -> hourlyResults:
    T_in = inputs.dayTempC   # initial condition; or better, initialize by running one
                             # extra "warm-up" day and discarding it, to remove startup
                             # transient bias — recommended stretch improvement
    C = computeThermalCapacitance(inputs)         # J/K, §7.6
    U_values = computeUValuesForAllElements(inputs) # §7.3
    results = []

    for h in 0..23:
        T_out = interpolateOutdoorTemp(inputs, h)   # from climate profile, §9 or §7.4.1-style sinusoid between dayTempC and nightTempC
        Q_solar = computeSolarGain(inputs, h)        # §7.4
        Q_loss  = computeHeatLoss(inputs, T_in, T_out, h)  # §7.5

        dT = (Q_solar - Q_loss) * SIM_TIMESTEP_HOURS * 3600 / C   # Euler step, ΔT over 1 hour
        T_in = T_in + dT

        results.append({ hour: h, T_in, T_out, Q_solar, Q_loss_breakdown })

    return results
```

Use simple **explicit Euler integration with a 1-hour timestep** — this is sufficiently
accurate for this application (thermal time constants of a shelter are typically many
hours, much longer than the 1-hour step) and is trivial to implement/debug/unit-test. Do
not implement RK4 or adaptive time-stepping unless testing reveals instability (unlikely at
this timestep for this system).

**Performance requirement:** this function must run in well under 10 ms per call on a
typical laptop, since the optimizer (§10) will call it hundreds of times per "Generate &
simulate combinations" click. If it doesn't, the likely cause is unnecessary object
allocation or recomputation of static values (U-values, capacitance) inside the hourly
loop — hoist those outside the loop.

### 7.8 Comfort criterion

```
comfortAcceptable = (min(hourlyIndoorTempC) >= CONFIG.COMFORT_THRESHOLD_C)
hoursBelowThreshold = count of hours where T_in(h) < CONFIG.COMFORT_THRESHOLD_C
supplementaryHeatingNeededKwhPerDay =
    sum over hours below threshold of:
        C_total_equivalent_power * (CONFIG.COMFORT_THRESHOLD_C - T_in(h)) [converted to kWh]
    (i.e., the energy that a heater would need to supply each such hour to hold the
     threshold — a simple proxy for "supplementary energy required", not a full HVAC load
     calculation)
```

The comfort threshold (default 15 °C, in `CONFIG`) is a **configurable design target**, not
a quoted clause from a specific comfort standard — say so explicitly in the UI/report
(e.g. "vs. a configurable comfort threshold of 15°C"). If the team wants to ground this in
a recognised standard, ASHRAE 55's adaptive comfort model is the right reference to look up
and cite properly — do not state a specific ASHRAE-55 number in code or the report unless
someone has actually checked the standard's current text.

---

## 8. Material Property Reference Database

> **[VERIFY before final submission]** — the values below are commonly-cited
> building-physics reference figures assembled for a working prototype. They are internally
> consistent and good enough for a hackathon-grade comparative tool, but before the team
> presents them as authoritative, cross-check against **IS 3792 (Guide for heat insulation
> of non-industrial buildings)**, the **National Building Code of India**, and/or **ASHRAE
> Fundamentals** — and cite whichever source you actually used. Do not let the AI agent
> silently "correct" these numbers from its own memory without flagging the change.

### 8.1 Opaque construction materials

| Material | k (W/m·K) | ρ (kg/m³) | Cp (J/kg·K) | Notes |
|---|---|---|---|---|
| Rammed earth | 0.7 | 2000 | 900 | Local/traditional, high mass, low embodied energy |
| Mud/adobe brick | 0.6 | 1700 | 900 | Local/traditional |
| Stone (granite/local stone) | 2.3 | 2600 | 800 | High mass, widely available in Ladakh |
| Fired clay brick | 0.7 | 1800 | 840 | |
| Dense concrete | 1.5 | 2300 | 880 | |
| Timber (softwood) | 0.13 | 500 | 1600 | Low mass, used for framing/roof |
| Straw bale (as insulation infill) | 0.07 | 110 | 1500 | Very high insulation value, low mass |

### 8.2 Insulation materials

| Material | k (W/m·K) | ρ (kg/m³) | Cp (J/kg·K) |
|---|---|---|---|
| Glass wool | 0.040 | 20 | 840 |
| EPS foam | 0.037 | 25 | 1450 |
| XPS foam | 0.030 | 35 | 1450 |
| Rock wool | 0.038 | 60 | 840 |

### 8.3 `insulationGrade` → added layer thickness (applied on top of the base
wall/roof construction, in series):

| Grade | Insulation thickness added | Material used |
|---|---|---|
| none | 0 mm | — |
| low | 25 mm | Glass wool |
| medium | 50 mm | Glass wool |
| high | 100 mm | XPS foam |

### 8.4 `thermalMassType` → mass element assumed (used to compute `C_total`, §7.6)

| Type | Assumed element | Volume assumption |
|---|---|---|
| none | none beyond indoor air | — |
| light | timber-framed interior partition | 0.05 × floorAreaM2 × 0.1 m thick |
| medium | brick internal wall | 0.15 × floorAreaM2 × 0.15 m thick |
| heavy | rammed-earth/stone internal mass wall | 0.25 × floorAreaM2 × 0.3 m thick |
| trombe-wall | glazed south-facing mass wall (see §7.4.3) | wall area (from `windowAreaM2` position) × 0.3 m thick, stone or rammed earth |

These volume assumptions are placeholder heuristics for an MVP **[VERIFY]** — replace with
an explicit "mass wall area + thickness" input field if time allows (stretch goal), rather
than an implicit fraction of floor area.

### 8.5 Windows

| Type | U (W/m²·K) | SHGC |
|---|---|---|
| Single-glazed | 5.8 | 0.85 |
| Double-glazed | 2.8 | 0.65 |
| Double-glazed, low-E | 1.6 | 0.45 |

### 8.6 Doors

Treat as an opaque element with:

| Type | U (W/m²·K) |
|---|---|
| Uninsulated timber/metal door | 3.0 |
| Insulated door | 1.5 |

---

## 9. Weather Data Integration

### 9.1 Primary source — Open-Meteo (no API key required)

**Live/forecast conditions:**
```
GET https://api.open-meteo.com/v1/forecast
    ?latitude={lat}&longitude={lon}
    &hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation
    &current=temperature_2m,wind_speed_10m
    &timezone=auto
```

**Historical data for a specific past date** (use this for "what was the weather on
2026-01-15 in Leh"):
```
GET https://archive-api.open-meteo.com/v1/archive
    ?latitude={lat}&longitude={lon}
    &start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
    &hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation
    &timezone=auto
```

Both return plain JSON, no authentication header needed. `shortwave_radiation` is global
horizontal irradiance in W/m² — this is the field to use for `I(h)` in §7.4 directly (skip
the sinusoidal approximation in §7.4.1 whenever this data is available).

Map the response into the app's climate fields as follows:
- `nightTempC` ≈ min of `hourly.temperature_2m` between 00:00–06:00
- `dayTempC` ≈ max of `hourly.temperature_2m` between 10:00–16:00
- `peakSolarRadiationWm2` = max of `hourly.shortwave_radiation`
- `windSpeedMs` = mean of `hourly.wind_speed_10m` (convert km/h → m/s if the API returns
  km/h — check the `hourly_units` object returned in the same response, don't assume)
- `humidityPct` = mean of `hourly.relative_humidity_2m`
- `annualIrradianceKwhM2`, `sunshineHoursPerDay`, `cloudFreeDaysPerYear` are **not**
  available from a single day's API call — keep these as manually-entered / regional
  reference values (defaults in §6.1), or compute `annualIrradianceKwhM2` by summing a
  full year of historical `shortwave_radiation` if the team wants to automate it fully
  (stretch goal — one extra API call with a full year date range).

### 9.2 Secondary/alternative source — NASA POWER

```
GET https://power.larc.nasa.gov/api/temporal/hourly/point
    ?parameters=T2M,ALLSKY_SFC_SW_DWN,WS10M,RH2M
    &community=RE
    &longitude={lon}&latitude={lat}
    &start={YYYYMMDD}&end={YYYYMMDD}
    &format=JSON
```
`ALLSKY_SFC_SW_DWN` is the all-sky surface shortwave downward irradiance (solar), directly
comparable to Open-Meteo's `shortwave_radiation`. Use this as a fallback if Open-Meteo is
unreachable, or for cross-checking irradiance numbers.

### 9.3 Offline fallback dataset (must ship in the app, no network required)

Hardcode this Ladakh reference profile so the demo works with zero connectivity:

```json
{
  "location": "Leh, Ladakh, India",
  "latitude": 34.1526, "longitude": 77.5771,
  "nightTempC": -15, "dayTempC": 8,
  "peakSolarRadiationWm2": 850,
  "annualIrradianceKwhM2": 2000,
  "sunshineHoursPerDay": 7.9,
  "cloudFreeDaysPerYear": 300,
  "windSpeedMs": 4.5, "humidityPct": 25, "altitudeM": 3500
}
```

### 9.4 Error handling

- If the fetch fails (no network, CORS, rate limit, bad response), fall back to §9.3 and
  show a visible (not silent) banner: "Live weather unavailable — using offline Ladakh
  reference data. You can still edit all fields manually."
- Never let a failed fetch leave input fields blank/undefined — always populate with a
  sane fallback so the simulation engine never receives `null`/`NaN`.
- Validate lat/lon are in range (-90..90, -180..180) before calling any API.

---

## 10. Optimization Engine

### 10.1 Search space (discrete grid search for MVP)

| Variable | Discretized options |
|---|---|
| `orientation` | north, south, east, west, north-east, north-west, south-east, south-west (8) |
| `insulationGrade` | none, low, medium, high (4) |
| `windowAreaM2` | 1.5, 3.0, 4.5 (3) |
| `thermalMassType` | none, light, medium, heavy, trombe-wall (5) |

Full grid = 8 × 4 × 3 × 5 = **480 combinations** — comfortably fast at <10 ms per
simulation (§7.7 performance requirement ⇒ well under 5 seconds total). Do not implement a
smarter search algorithm (genetic algorithm, simulated annealing, etc.) for the MVP — plain
enumeration is simpler, fully deterministic, and easy to explain to judges. Mention smarter
continuous optimization only as a named stretch goal (§3.2), don't half-implement it.

### 10.2 Ranking algorithm

For each simulated combination, compute a **sorted ranking using this exact lexicographic
priority** (matches the priority order implied by the PS: comfort first, then efficiency):

1. **Comfort achieved** (`comfortAcceptable == true`) ranks above any design that fails
   comfort, regardless of other metrics.
2. Among designs with the same comfort outcome, rank by **`totalHeatLossKwh` ascending**
   (lower loss = better).
3. Tie-break by **`solarHeatGainKwh` descending** (more useful solar capture = better).
4. Final tie-break by **`supplementaryHeatingNeededKwhPerDay` ascending**.

```
function rankDesigns(results):
    return results.sort(by (a, b) =>
        (b.comfortAcceptable - a.comfortAcceptable)
        || (a.totalHeatLossKwh - b.totalHeatLossKwh)
        || (b.solarHeatGainKwh - a.solarHeatGainKwh)
        || (a.supplementaryHeatingNeededKwhPerDay - b.supplementaryHeatingNeededKwhPerDay)
    )
```

**⚠ Known issue to check when porting/rebuilding from the existing prototype:** an earlier
prototype run produced a "best" ranked design with **low** insulation outranking higher-
insulation options. That is physically counter-intuitive (more insulation should reduce
heat loss, all else equal) and likely indicates either (a) a bug in the reference
implementation's ranking/weighting logic, or (b) a confound where a lower-insulation
option happened to pair with a much better orientation/window-area combination in that
specific run. **Do not silently reproduce this behaviour.** Add a unit test (§15) with a
controlled scenario (same everything, only insulation grade varies) asserting that
`totalHeatLossKwh` strictly decreases as insulation grade improves — if that test fails,
the physics engine has a bug that must be fixed before trusting any optimization output.

### 10.3 Output of the optimizer

A sorted table (rank, all input variables, `lowestIndoorTempNightC`, `totalHeatLossKwh`,
`solarHeatGainKwh`, `comfortAcceptable`) — top row is "Best", with a "Select design →"
action that carries the chosen combination into the Technical Report step.

---

## 11. UI/UX Specification (6-step wizard)

The team already has a working prototype (`shelter_simulation_ui_prototype.html`) with this
exact flow — treat the description below as the authoritative spec for what that UI (or its
React rebuild) should do; fix the UI to match this document wherever the two disagree, and
log the discrepancy in the Assumptions Log (§19).

1. **Climate Data** — form matching §6.1 fields; "Fetch weather" button (calls §9.1),
   "Use my location" button (browser geolocation → lat/lon → auto-fetch); all fields
   remain manually editable after fetch; date picker for `simulationDate`.
2. **Shelter Design** — form matching §6.2 fields; live-updated derived readout of
   floor area, volume, and surface-to-volume ratio (§7.2) as the user types.
3. **Materials** — per-element (wall/roof/floor/window/door) material + thickness pickers
   sourced from §8; `insulationGrade` and `thermalMassType` dropdowns.
4. **Simulation Results** — KPI cards (lowest outdoor/indoor night temp, solar heat gain,
   total heat loss, comfort verdict); a 24-hour indoor-vs-outdoor temperature line chart
   with the comfort threshold marked; a heat-loss breakdown bar/list by component with %
   share; "Run optimization →" button if comfort fails, "Re-run simulation" and "Edit
   inputs" always available.
5. **Optimization** — "Generate & simulate combinations" button runs §10; ranked table
   with "Best" badge on row 1; "Select design →" carries the winner forward.
6. **Technical Report** — plain-language summary of the recommended design and its
   predicted performance; "Download report (.txt)" button; "Start new project" resets
   state.

Persist the in-progress project in memory for the session (no backend/database required for
MVP); a "Project: …" / "Status: …" summary stays visible in the left nav at all times, as
in the existing prototype.

---

## 12. Validation Plan (ANSYS cross-check)

This step exists specifically because the PS names ANSYS — it is a required deliverable,
not optional polish.

1. Pick **one fixed reference case**: the default Ladakh scenario in §9.3 with the default
   shelter geometry in §6.2 and one specific, documented material stack (e.g. rammed-earth
   walls, medium insulation, double-glazed south window, heavy thermal mass).
2. Build that exact case as a **steady-state or transient thermal model in ANSYS** (Steady-
   State Thermal or Transient Thermal in Workbench). Apply the same boundary conditions
   (outdoor temp profile, solar load if using Transient Thermal with a radiation/heat-flux
   boundary) as the software model uses.
3. Compare, for the same case:
   - Per-element U-values (wall/roof/floor) — should match near-exactly, since both are
     computed from the same layer/material inputs (this mainly validates that the ANSYS
     material assignments match §8's k-values, and vice versa).
   - Total conductive heat loss (W) at a fixed ΔT — compare ANSYS's computed heat flux
     integrated over each surface against §7.5.1's output.
   - If time allows, a transient run's indoor temperature trajectory over 24 h, compared
     against the RC model's `hourlyIndoorTempC`.
4. Document the comparison as a small table + short written note in the technical report
   and/or PPT: "ANSYS steady-state heat flux: X W vs. software model: Y W (Z% difference)."
   A few-percent difference is expected and fine (the RC model is a deliberate
   simplification) — large differences (>15–20%) indicate a bug in one of the two models
   and must be investigated before submission.
5. **Do not fabricate ANSYS output numbers.** If the team runs out of time to complete the
   ANSYS model, say so honestly in the report ("validation in progress") rather than
   inventing a plausible-looking comparison table — a fabricated number is worse than an
   honestly incomplete section.

---

## 13. Repository / File Structure

```
thermoshelter/
├── README.md
├── PROJECT_SPEC.md                 <- this file
├── index.html                      <- entry point, wizard shell
├── /src
│   ├── config.js                   <- §6.5 constants
│   ├── data/
│   │   ├── materials.js            <- §8 material tables
│   │   └── ladakh-fallback.json    <- §9.3
│   ├── weather/
│   │   ├── openMeteo.js            <- §9.1
│   │   └── nasaPower.js            <- §9.2
│   ├── engine/
│   │   ├── geometry.js             <- §7.2
│   │   ├── thermalProperties.js    <- §7.3, §7.6
│   │   ├── solarGain.js            <- §7.4
│   │   ├── heatLoss.js             <- §7.5
│   │   ├── simulate.js             <- §7.7 main solver
│   │   └── comfort.js              <- §7.8
│   ├── optimize/
│   │   └── rankDesigns.js          <- §10
│   ├── report/
│   │   └── generateReport.js
│   └── ui/
│       ├── step1-climate.js
│       ├── step2-design.js
│       ├── step3-materials.js
│       ├── step4-results.js
│       ├── step5-optimize.js
│       └── step6-report.js
├── /test
│   └── engine.test.js              <- §15 required tests
└── /validation
    ├── ansys-reference-case.md     <- §12 write-up
    └── ansys-vs-model-comparison.csv
```

---

## 14. Module Interfaces (function signatures — implement exactly these)

```ts
// engine/geometry.js
function computeGeometry(shelter: ShelterInput): {
  floorAreaM2: number, volumeM3: number,
  wallAreaGrossM2: number, wallAreaNetM2: number,
  roofAreaM2: number, surfaceToVolumeRatio: number
}

// engine/thermalProperties.js
function computeUValue(layers: {materialId: string, thicknessM: number}[],
                        surfaceType: 'wall'|'roof'|'floor'): number   // W/m^2.K
function computeThermalCapacitance(shelter, materials): number       // J/K

// engine/solarGain.js
function computeHourlySolarGain(climate, shelter, materials, hour: number): number // W

// engine/heatLoss.js
function computeHourlyHeatLoss(climate, shelter, materials, T_in: number, hour: number): {
  walls: number, roof: number, floor: number, windows: number, doors: number,
  ventilation: number, sky: number, total: number
}   // all in W

// engine/simulate.js
function simulate24h(climate, shelter, materials): {
  hourlyIndoorTempC: number[], hourlyOutdoorTempC: number[],
  solarHeatGainKwh: number, heatLossByComponentKwh: object,
  totalHeatLossKwh: number, comfortAcceptable: boolean,
  hoursBelowComfortThreshold: number, supplementaryHeatingNeededKwhPerDay: number
}

// optimize/rankDesigns.js
function generateCombinations(baseShelter, baseMaterials): DesignCombination[]
function rankDesigns(results: SimulationResult[]): SimulationResult[]  // sorted, §10.2
```

Keep every function **pure** (no hidden global state, no DOM access inside `engine/*` or
`optimize/*`) so they can be unit-tested in isolation per §15.

---

## 15. Required Unit Tests (worked examples — hand-checkable)

Implement at least these tests before considering the engine "done." Expected values below
are simple hand-calculations the agent (or a teammate) can re-derive independently — if the
code doesn't match, the code is wrong, not the test.

1. **U-value of a single-layer wall:** 0.3 m thick rammed earth (`k = 0.7`), with
   `R_si=0.13, R_se=0.04`. Expected: `R_total = 0.13 + 0.3/0.7 + 0.04 = 0.598 m²K/W`,
   `U ≈ 1.672 W/m²K`.
2. **Conductive loss sanity check:** for `U = 1.672`, `A = 10 m²`, `ΔT = 20°C` (e.g.
   T_in=5, T_out=-15): `Q = 1.672 * 10 * 20 = 334.4 W`. Assert the engine returns this
   within floating-point tolerance for a single-element, single-hour calculation.
3. **Insulation monotonicity test (the bug-catcher from §10.2):** holding every other
   variable fixed, `totalHeatLossKwh` for `insulationGrade='high'` must be strictly less
   than for `'medium'`, which must be less than `'low'`, which must be less than `'none'`.
4. **Ventilation loss sign/units check:** with `T_in > T_out`, `Q_vent` must be positive
   (heat leaving the shelter); doubling `ACH` must exactly double `Q_vent` (linear
   relationship — easy to assert).
5. **Zero-solar-at-night check:** for any hour outside the daylight window (§7.4.1),
   `Q_solar(h) == 0`.
6. **Energy-balance smoke test:** run a full 24 h simulation with solar gain and losses
   both set to zero (contrived test inputs) — indoor temperature must stay exactly
   constant across all 24 hours (no phantom energy appearing/disappearing).
7. **Optimizer determinism:** running `generateCombinations` + `rankDesigns` twice on the
   same input must produce an identical ranked list (no reliance on unspecified sort
   stability or random seeds).

---

## 16. Non-Functional Requirements

- **Offline-first:** every screen except the "Fetch weather" button must work with no
  network connection (relevant to the DRDO/remote-outpost use case, and to demoing at a
  venue with unreliable Wi-Fi).
- **Performance:** full optimization sweep (§10.1, ~480 combinations) must complete in
  under 5 seconds on a mid-range laptop.
- **Browser support:** modern evergreen browsers (Chrome/Edge/Firefox); no IE11 support
  needed.
- **No hardcoded secrets:** the weather APIs used (§9) require no API key — keep it that
  way; do not introduce a paid API that would require committing a secret key into a
  public hackathon repo.
- **Accessibility (nice-to-have):** form fields should have visible labels and sufficient
  colour contrast; not a judged MVP requirement but easy to get right from the start.

---

## 17. Deliverables Checklist for SIH Submission

- [ ] Working web app (all 6 steps functional, per §11)
- [ ] Physics engine with passing unit tests (§15)
- [ ] Optimization engine producing a ranked design table (§10)
- [ ] Downloadable technical report
- [ ] ANSYS validation write-up + comparison table (§12) — even if partial, document
      honestly
- [ ] README with setup/run instructions
- [ ] PPT (separate deliverable, already drafted in the team's SIH slide deck) referencing
      this software and showing the flow diagram + a live screenshot

---

## 18. Explicit "Do-Not" List (anti-hallucination guardrails)

- Do **not** invent a more "precise-sounding" material property than what's in §8 (e.g.
  don't suddenly output `k = 0.7132` for rammed earth). If more precision is genuinely
  needed, get it from a cited source and update §8, don't silently sharpen the number.
- Do **not** fabricate an ANSYS API/scripting call that wasn't verified to exist in the
  installed ANSYS version — the validation step (§12) is meant to be done manually in the
  ANSYS Workbench GUI unless a team member specifically knows the scripting API.
  ANSYS-adjacent details are outside the scope of this document; a teammate with ANSYS
  should look up how the software's docs/tutorials do this on the installed version.
- Do **not** claim a specific comfort-standard clause number (ASHRAE 55, ISO 7730, etc.)
  unless someone has actually read that clause — refer to §7.8's configurable-threshold
  language instead.
- Do **not** silently change the ranking priority order in §10.2 to "fix" a result that
  looks odd — instead, write the unit test in §15 item 3, find the actual bug, and fix the
  root cause.
- Do **not** present the offline fallback dataset (§9.3) as "live data" in the UI — always
  show the fallback banner (§9.4) when it's in use.
- If a required input is genuinely unknown (e.g. exact material thickness a team member
  wants to use isn't in §8), add it to §19 (Assumptions Log) with a clearly marked
  `[NEEDS TEAM INPUT]` tag rather than guessing a number and moving on silently.

---

## 19. Assumptions Log (fill in as you build)

| Date | Item | Assumption made | Needs verification by |
|---|---|---|---|
| 2026-09-13 | §7.5.3 Sky Radiation Roof Coupling | Nocturnal clear-sky radiation occurs at exterior roof surface; heat flow from indoor node is coupled through the roof thermal conductance (`U_roof * R_se`). Resolves §10.2 & §15.3 prototype bug where uninsulated sky radiation overpowered insulation. | Team Thermal Physics Lead |
| 2026-09-13 | §7.7 Initial Condition | Standard 24h design-day simulation initializes $T_{in}$ to `dayTempC` (default 8°C in Ladakh) per §7.7 line 445, preventing multi-day unheated freeze that masks daytime solar thermal storage. | Simulation Team |
| 2026-09-13 | §7.2 Dome Roof Area | For `dome` geometry archetype, roof surface area is computed as hemisphere surface $2\pi r^2 = 2 \times \text{floorAreaM2}$. | Architectural Modeling Team |
| 2026-09-13 | §9.1 Weather Wind Units | Open-Meteo API wind speed is inspected for `km/h` in `hourly_units` and converted to SI `m/s` (divided by 3.6). | Data Integration Lead |


---

## 20. Glossary

| Symbol/Term | Meaning | Unit |
|---|---|---|
| `T_in`, `T_out` | Indoor / outdoor air temperature | °C |
| `U` | Overall heat-transfer coefficient of a building element | W/m²·K |
| `R` | Thermal resistance | m²·K/W |
| `k` | Thermal conductivity of a material | W/m·K |
| `C` | Thermal capacitance (heat capacity) of the modelled mass | J/K |
| `ρ` (rho) | Density | kg/m³ |
| `Cp` | Specific heat capacity | J/kg·K |
| `ACH` | Air changes per hour (ventilation/infiltration rate) | 1/hr |
| `SHGC` | Solar Heat Gain Coefficient of a window (fraction of incident solar energy admitted) | dimensionless, 0–1 |
| `I(h)` | Solar irradiance at hour h | W/m² |
| RC model | "Resistance-Capacitance" lumped thermal network — the simplified modelling method used here | — |
| S/V ratio | Surface-area-to-volume ratio of the shelter | m²/m³ |

---

*End of specification. Build MVP items in §3.1 in order, test against §15 continuously,
and keep §19 updated as you go.*
