/**
 * OpenStreetMap Geocoding Utility (FREE)
 * Uses Nominatim API - No API key required
 * Rate limit: 1 request per second
 */

// Cache for storing geocoding results to reduce API calls
let geocodingCache = {};
let lastRequestTime = 0;
const REQUEST_DELAY = 1000; // 1 second between requests as per OSM policy

/**
 * Calculate distance between two coordinates
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

/**
 * Delay function to respect rate limits
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Reverse geocode using OpenStreetMap Nominatim
 */
export const geocodeLatLng = async (latitude, longitude) => {
  // Create cache key
  const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  
  // Check cache first
  if (geocodingCache[cacheKey]) {
    console.log('Using cached geocoding result');
    return geocodingCache[cacheKey];
  }

  // Respect rate limits
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    await delay(REQUEST_DELAY - timeSinceLastRequest);
  }

  try {
    console.log(`Geocoding: ${latitude}, ${longitude}`);
    
    // OpenStreetMap Nominatim API URL
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HRMS-Tracking-App/1.0', // Required by OSM
        'Accept-Language': 'en', // Get results in English
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    lastRequestTime = Date.now();

    if (data.error) {
      console.warn('OpenStreetMap error:', data.error);
      return getDefaultAddress(latitude, longitude);
    }

    // Parse the address components
    const address = data.address || {};
    
    // Build human-readable components
    const result = parseOSMAddress(address, latitude, longitude, data.display_name);
    
    // Cache the result
    geocodingCache[cacheKey] = result;
    
    // Limit cache size to prevent memory issues
    const cacheKeys = Object.keys(geocodingCache);
    if (cacheKeys.length > 100) {
      delete geocodingCache[cacheKeys[0]];
    }
    
    return result;
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return getDefaultAddress(latitude, longitude);
  }
};

/**
 * Parse OpenStreetMap address response
 */
const parseOSMAddress = (address, latitude, longitude, displayName) => {
  // Extract address components
  const houseNumber = address.house_number || '';
  const road = address.road || address.footway || address.path || '';
  const neighbourhood = address.neighbourhood || address.suburb || '';
  const village = address.village || '';
  const town = address.town || '';
  const city = address.city || '';
  const county = address.county || '';
  const state = address.state || '';
  const country = address.country || '';
  const postcode = address.postcode || '';
  
  // Determine the primary locality
  const locality = city || town || village || neighbourhood || county || '';
  
  // Build street address
  let streetAddress = '';
  if (houseNumber && road) {
    streetAddress = `${houseNumber} ${road}`;
  } else if (road) {
    streetAddress = road;
  } else if (neighbourhood) {
    streetAddress = neighbourhood;
  } else {
    streetAddress = 'Unknown Location';
  }
  
  // Build area name
  let area = '';
  if (locality && state) {
    area = `${locality}, ${state}`;
  } else if (locality) {
    area = locality;
  } else if (state) {
    area = state;
  } else {
    area = 'Unknown Area';
  }
  
  // Create display address (user-friendly)
  let displayAddress = '';
  
  if (streetAddress !== 'Unknown Location' && locality) {
    displayAddress = `${streetAddress}, ${locality}`;
  } else if (locality) {
    displayAddress = locality;
  } else if (county) {
    displayAddress = county;
  } else {
    // Use coordinates with a unique identifier
    const uniqueId = Math.abs(latitude + longitude).toString().substring(2, 6);
    displayAddress = `Location #${uniqueId} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  }
  
  // Add country if not India (assuming India is default)
  if (country && country !== 'India' && country !== 'IN') {
    displayAddress += `, ${country}`;
  }
  
  return {
    address: displayAddress,
    road: streetAddress,
    area: area,
    fullAddress: displayName || displayAddress,
    houseNumber,
    roadName: road,
    neighbourhood,
    village,
    town,
    city,
    county,
    state,
    country,
    postcode,
    latitude,
    longitude,
    source: 'OpenStreetMap'
  };
};

/**
 * Default fallback address
 */
const getDefaultAddress = (latitude, longitude) => {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  
  // Create a unique identifier for this location
  const uniqueId = Math.abs(latitude + longitude).toString().substring(2, 8);
  
  return {
    address: `Location #${uniqueId} (${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(longitude).toFixed(4)}°${lngDir})`,
    road: `Near coordinates ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    area: 'GPS Coordinates',
    fullAddress: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
    latitude,
    longitude,
    source: 'GPS'
  };
};

/**
 * Search for nearby locations (forward geocoding)
 */
export const searchLocation = async (query) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HRMS/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    return data.map(item => ({
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
    }));
    
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

/**
 * Get distance-based location description
 */
export const getMovementDescription = (currentLat, currentLng, previousLat, previousLng) => {
  if (!previousLat || !previousLng) {
    return 'Starting point';
  }
  
  const distance = calculateDistance(currentLat, currentLng, previousLat, previousLng);
  
  if (distance < 10) {
    return 'Same location';
  } else if (distance < 50) {
    return 'Moved slightly';
  } else if (distance < 200) {
    return `Moved ${Math.round(distance)}m`;
  } else if (distance < 1000) {
    return `Moved ${(distance/1000).toFixed(1)}km`;
  } else {
    return 'New area';
  }
};

/**
 * Get time-based location context
 */
export const getTimeContext = () => {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
};

/**
 * Format coordinates nicely
 */
export const formatCoordinates = (latitude, longitude, precision = 4) => {
  return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
};

/**
 * Clear geocoding cache
 */
export const clearGeocodingCache = () => {
  geocodingCache = {};
};

/**
 * Get unique location name based on coordinates
 */
export const getUniqueLocationName = (latitude, longitude, index) => {
  // Create a hash from coordinates
  const latStr = latitude.toFixed(6).replace('.', '');
  const lngStr = longitude.toFixed(6).replace('.', '');
  const hash = parseInt(latStr.substring(0, 4) + lngStr.substring(0, 4)) % 10000;
  
  const prefixes = ['Point', 'Location', 'Spot', 'Place', 'Position'];
  const prefix = prefixes[index % prefixes.length];
  
  return `${prefix}-${hash.toString().padStart(4, '0')}`;
};