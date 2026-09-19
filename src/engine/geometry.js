/**
 * ThermoShelter - Geometry Engine
 * Implements equations from ThermoShelter Project Spec Section 7.2
 */

/**
 * Computes geometry properties of the shelter
 * @param {Object} shelter
 * @param {number} shelter.lengthM - Length in meters
 * @param {number} shelter.widthM - Width in meters
 * @param {number} shelter.heightM - Height in meters
 * @param {string} [shelter.shape='rectangular'] - rectangular, dome, l-shaped, compact-cube
 * @param {number} [shelter.windowAreaM2=0] - Total window aperture area in m²
 * @param {number} [shelter.doorAreaM2=0] - Total door area in m²
 * @returns {Object} Computed geometry metrics
 */
export function computeGeometry(shelter) {
  const L = shelter.lengthM;
  const W = shelter.widthM;
  const H = shelter.heightM;
  const shape = shelter.shape || 'rectangular';
  const windowAreaM2 = shelter.windowAreaM2 || 0;
  const doorAreaM2 = shelter.doorAreaM2 || 0;

  const floorAreaM2 = L * W;
  const volumeM3 = L * W * H;
  const wallAreaGrossM2 = 2 * (L * H) + 2 * (W * H);
  const wallAreaNetM2 = Math.max(0, wallAreaGrossM2 - windowAreaM2 - doorAreaM2);

  // Roof area calculation:
  // For standard flat/shed roof: L * W
  // For dome: hemisphere surface area = 2 * pi * r^2, where base circle area pi * r^2 ≈ L * W
  let roofAreaM2 = L * W;
  if (shape === 'dome') {
    roofAreaM2 = 2 * floorAreaM2;
  }

  const surfaceAreaTotalM2 = wallAreaGrossM2 + roofAreaM2 + floorAreaM2;
  const surfaceToVolumeRatio = volumeM3 > 0 ? surfaceAreaTotalM2 / volumeM3 : 0;

  return {
    floorAreaM2,
    volumeM3,
    wallAreaGrossM2,
    wallAreaNetM2,
    roofAreaM2,
    surfaceToVolumeRatio
  };
}
