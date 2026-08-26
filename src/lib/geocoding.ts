const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export const geocodeAddress = async (address: string) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key is missing. Geocoding will fail.");
    return [];
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK") {
      return data.results.map((r: any) => ({
        display_name: r.formatted_address,
        lat: r.geometry.location.lat.toString(),
        lon: r.geometry.location.lng.toString(),
      }));
    } else {
      console.error("Geocoding failed:", data.status, data.error_message);
      return [];
    }
  } catch (error) {
    console.error("Error calling Google Maps Geocoding API:", error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lng: number) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key is missing. Reverse geocoding will fail.");
    return null;
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === "OK" && data.results.length > 0) {
      return {
        display_name: data.results[0].formatted_address,
        lat: data.results[0].geometry.location.lat.toString(),
        lon: data.results[0].geometry.location.lng.toString(),
      };
    } else {
      console.error("Reverse geocoding failed:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Error calling Google Maps Reverse Geocoding API:", error);
    return null;
  }
};
