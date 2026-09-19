/**
 * ThermoShelter - NASA POWER Weather API Integration
 * Secondary/fallback weather data source from ThermoShelter Project Spec Section 9.2
 */

/**
 * Fetches hourly weather from NASA POWER API
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Promise<Object>} Climate object matching Section 6.1 schema
 */
export async function fetchNasaPowerWeather(latitude, longitude, dateStr) {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error(`Invalid coordinates: lat ${latitude}, lon ${longitude}`);
  }

  const dateCompact = (dateStr || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const url = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,ALLSKY_SFC_SW_DWN,WS10M,RH2M&community=RE&longitude=${longitude}&latitude=${latitude}&start=${dateCompact}&end=${dateCompact}&format=JSON`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NASA POWER HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const params = data?.properties?.parameter;
  if (!params || !params.T2M) {
    throw new Error('Malformed response from NASA POWER API');
  }

  const t2mMap = params.T2M || {};
  const swMap = params.ALLSKY_SFC_SW_DWN || {};
  const wsMap = params.WS10M || {};
  const rhMap = params.RH2M || {};

  const hours = Object.keys(t2mMap).sort().slice(0, 24);
  const temps = hours.map(h => t2mMap[h]);
  const solarRad = hours.map(h => swMap[h] ?? 0);
  const windSpeeds = hours.map(h => wsMap[h] ?? 4.5);
  const humidities = hours.map(h => rhMap[h] ?? 25);

  const nightSlice = temps.slice(0, 6);
  const nightTempC = nightSlice.length > 0 ? Math.min(...nightSlice) : Math.min(...temps);

  const daySlice = temps.slice(10, 17);
  const dayTempC = daySlice.length > 0 ? Math.max(...daySlice) : Math.max(...temps);

  const peakSolarRadiationWm2 = Math.max(...solarRad);
  const windSpeedMs = windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length;
  const humidityPct = humidities.reduce((a, b) => a + b, 0) / humidities.length;

  return {
    latitude,
    longitude,
    nightTempC: parseFloat(nightTempC.toFixed(1)),
    dayTempC: parseFloat(dayTempC.toFixed(1)),
    peakSolarRadiationWm2: Math.round(peakSolarRadiationWm2),
    windSpeedMs: parseFloat(windSpeedMs.toFixed(1)),
    humidityPct: Math.round(humidityPct),
    hourlyOutdoorTempC: temps,
    hourlySolarIrradiance: solarRad,
    isLive: true,
    source: 'NASA POWER API',
    fetchTimestamp: new Date().toISOString()
  };
}
