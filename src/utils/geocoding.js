/**
 * Reverse geocoding via OpenStreetMap Nominatim.
 * Returns { address, road, area } for a given lat/lng.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const TIMEOUT_MS = 3000;

export const geocodeLatLng = async (lat, lon) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lon}`,
      {
        headers: { 'User-Agent': 'HRMS/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const data = await res.json();
    if (!data || !data.address) return { address: null, road: null, area: null };

    const a = data.address;
    const road = a.road || a.footway || a.path || null;
    const area =
      a.suburb ||
      a.village ||
      a.town ||
      a.city_district ||
      a.city ||
      a.county ||
      null;
    const parts = [
      road || a.suburb || a.village || a.town,
      a.city_district || a.city || a.county,
      a.state,
      a.postcode,
    ].filter(Boolean);
    const address = parts.length ? parts.join(', ') : null;

    return { address, road, area };
  } catch (e) {
    clearTimeout(timeout);
    return { address: null, road: null, area: null };
  }
};
