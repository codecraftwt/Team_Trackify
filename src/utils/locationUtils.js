export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371e3;
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

export const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return (θ * 180 / Math.PI + 360) % 360;
};

export const interpolatePoints = (start, end, maxDistance = 30) => {
  if (!start || !end) return [end];
  
  const distance = calculateDistance(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude
  );
  
  if (distance <= maxDistance) {
    return [end];
  }
  
  const numPoints = Math.ceil(distance / maxDistance);
  const points = [];
  
  for (let i = 1; i <= numPoints; i++) {
    const fraction = i / numPoints;
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * fraction,
      longitude: start.longitude + (end.longitude - start.longitude) * fraction,
      timestamp: start.timestamp ? 
        start.timestamp + (end.timestamp - start.timestamp) * fraction : 
        Date.now()
    });
  }
  
  return points;
};

export const smoothPath = (points, windowSize = 3) => {
  if (!points || points.length <= windowSize) return points || [];
  
  const smoothed = [];
  
  for (let i = 0; i < points.length; i++) {
    if (i < windowSize - 1) {
      smoothed.push(points[i]);
    } else {
      let sumLat = 0;
      let sumLng = 0;
      let count = 0;
      
      for (let j = 0; j < windowSize; j++) {
        const idx = i - j;
        if (idx >= 0) {
          sumLat += points[idx].latitude;
          sumLng += points[idx].longitude;
          count++;
        }
      }
      
      smoothed.push({
        latitude: sumLat / count,
        longitude: sumLng / count,
        timestamp: points[i].timestamp || Date.now()
      });
    }
  }
  
  return smoothed;
};

export const isValidLocation = (lat, lng) => {
  return (
    lat != null &&
    lng != null &&
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
};

export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

export const calculateSpeed = (lat1, lng1, time1, lat2, lng2, time2) => {
  if (!time1 || !time2 || time1 === time2) return 0;
  
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  const timeDiff = Math.abs(time2 - time1) / 1000; // Convert to seconds
  
  if (timeDiff === 0) return 0;
  
  return distance / timeDiff; // meters per second
};