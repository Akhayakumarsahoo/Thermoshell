/**
 * ThermoShelter - Open-Meteo Weather API Integration
 * Sourced from ThermoShelter Project Spec Section 9.1
 * No API key required
 */

/**
 * Fetches weather data from Open-Meteo (live forecast or historical archive)
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} [dateStr] - YYYY-MM-DD
 * @returns {Promise<Object>} Climate object matching Section 6.1 schema
 */
export async function fetchOpenMeteoWeather(latitude, longitude, dateStr = null) {
  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error(`Invalid geographic coordinates: lat ${latitude}, lon ${longitude}`);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const isHistorical = dateStr && dateStr < todayStr;

  let url;
  if (isHistorical) {
    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${dateStr}&end_date=${dateStr}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,cloud_cover&daily=sunshine_duration,shortwave_radiation_sum&timezone=auto`;
  } else {
    url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation,cloud_cover&daily=sunshine_duration,shortwave_radiation_sum&current=temperature_2m,wind_speed_10m&timezone=auto`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || !data.hourly) {
    throw new Error('Malformed weather response from Open-Meteo API');
  }

  const hourly = data.hourly;
  const units = data.hourly_units || {};

  // Extract High-Resolution DEM elevation
  const altitudeM = typeof data.elevation === 'number' ? Math.round(data.elevation) : 3500;

  // Slice first 24 hours
  const temps = (hourly.temperature_2m || []).slice(0, 24);
  const humidities = (hourly.relative_humidity_2m || []).slice(0, 24);
  const rawWind = (hourly.wind_speed_10m || []).slice(0, 24);
  const solarRad = (hourly.shortwave_radiation || []).slice(0, 24);
  const cloudCovers = (hourly.cloud_cover || []).slice(0, 24);

  // Convert wind speed to m/s if returned in km/h
  const isKmH = units.wind_speed_10m === 'km/h';
  const windSpeeds = rawWind.map(w => isKmH ? w / 3.6 : w);

  // Night temp: min between 00:00 and 06:00
  const nightSlice = temps.slice(0, 6);
  const nightTempC = nightSlice.length > 0 ? Math.min(...nightSlice) : Math.min(...temps);

  // Day temp: max between 10:00 and 16:00
  const daySlice = temps.slice(10, 17);
  const dayTempC = daySlice.length > 0 ? Math.max(...daySlice) : Math.max(...temps);

  // Peak solar radiation
  const peakSolarRadiationWm2 = solarRad.length > 0 ? Math.max(...solarRad) : 850;

  // Mean wind speed & humidity
  const windSpeedMs = windSpeeds.length > 0
    ? windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length
    : 4.5;
  const humidityPct = humidities.length > 0
    ? humidities.reduce((a, b) => a + b, 0) / humidities.length
    : 25;

  // Sunshine hours: from daily forecast or daylight hours with GHI > 120 W/m²
  let sunshineHoursPerDay = 7.9;
  const dailySunshineSec = (data.daily?.sunshine_duration || [])[0];
  if (typeof dailySunshineSec === 'number' && dailySunshineSec > 0) {
    sunshineHoursPerDay = parseFloat((dailySunshineSec / 3600).toFixed(1));
  } else {
    const sunHoursCount = solarRad.filter(r => r > 120).length;
    if (sunHoursCount > 0) sunshineHoursPerDay = sunHoursCount;
  }

  // Mean 24h cloud cover
  const meanCloudPct = cloudCovers.length > 0
    ? cloudCovers.reduce((a, b) => a + b, 0) / cloudCovers.length
    : 20;

  // Derive annual solar irradiance (kWh/m²/yr) based on altitude air mass and cloudiness factor
  // Base sea-level clear-sky irradiance ~1680 kWh/m²/yr; increases ~6.5% per 1000m altitude
  const altTransmissionBonus = 1 + (Math.max(0, altitudeM) / 1000) * 0.065;
  const cloudTransmissionFactor = Math.max(0.65, 1 - (meanCloudPct / 100) * 0.38);
  const annualIrradianceKwhM2 = Math.round(1680 * altTransmissionBonus * cloudTransmissionFactor);

  // Derive cloud-free days per year based on mean cloudiness, aridity, and altitude
  const aridityBonus = humidityPct < 30 ? 25 : humidityPct < 50 ? 10 : 0;
  const altitudeBonus = altitudeM > 2500 ? 20 : 0;
  const cloudFreeDaysPerYear = Math.max(
    140,
    Math.min(335, Math.round(365 * (1 - (meanCloudPct / 100) * 0.75) + aridityBonus + altitudeBonus))
  );

  const result = {
    latitude,
    longitude,
    altitudeM,
    nightTempC: parseFloat(nightTempC.toFixed(1)),
    dayTempC: parseFloat(dayTempC.toFixed(1)),
    peakSolarRadiationWm2: Math.round(peakSolarRadiationWm2),
    annualIrradianceKwhM2,
    cloudFreeDaysPerYear,
    sunshineHoursPerDay,
    windSpeedMs: parseFloat(windSpeedMs.toFixed(1)),
    humidityPct: Math.round(humidityPct),
    hourlyOutdoorTempC: temps,
    hourlySolarIrradiance: solarRad,
    isLive: true,
    source: 'Open-Meteo High-Resolution API',
    fetchTimestamp: new Date().toISOString()
  };

  console.log('✓ Open-Meteo Meteorological Profile Loaded:', {
    elevationM: result.altitudeM,
    nightMinTempC: result.nightTempC,
    dayMaxTempC: result.dayTempC,
    peakSolarWm2: result.peakSolarRadiationWm2,
    annualSolarKwhM2: result.annualIrradianceKwhM2,
    cloudFreeDays: result.cloudFreeDaysPerYear,
    hourlyTempsPoints: temps.length,
    hourlySolarPoints: solarRad.length
  });

  return result;
}
