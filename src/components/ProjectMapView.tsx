import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef, useMap, useMapsLibrary, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { Building2, Home, MapPin, Maximize2, Tag, User, Search, X, Sparkles, AlertCircle } from 'lucide-react';

const API_KEY = 
  process.env.GOOGLE_MAPS_PLATFORM_KEY || 
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY || 
  '';

interface Project {
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
  builderName?: string;
  coordinates?: { lat: number; lng: number };
  status: string;
  images?: { name: string; data: string }[];
}

interface ResaleProperty {
  id: string;
  societyName: string;
  location: string;
  price: number;
  coordinates?: { lat: number; lng: number };
  status: string;
}

interface ProjectMapViewProps {
  items: (Project | ResaleProperty)[];
  onSelectItem: (id: string) => void;
  type: 'project' | 'resale';
  selectedItemId?: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return { bg: '#10b981', border: '#059669' };
    case 'Pending': return { bg: '#f59e0b', border: '#d97706' };
    case 'Sold': return { bg: '#ef4444', border: '#dc2626' };
    case 'PENDING_DELETE': return { bg: '#6b7280', border: '#4b5563' };
    default: return { bg: '#3b82f6', border: '#2563eb' };
  }
};

// Helper: Haversine distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const getLat = (loc: any) => {
  if (!loc) return 0;
  return typeof loc.lat === 'function' ? loc.lat() : (loc.lat || 0);
};

const getLng = (loc: any) => {
  if (!loc) return 0;
  return typeof loc.lng === 'function' ? loc.lng() : (loc.lng || 0);
};

const getAmenityColor = (type: string) => {
  if (type.includes('school')) return '#3b82f6'; // Blue
  if (type.includes('hospital')) return '#ef4444'; // Red
  if (type.includes('park')) return '#10b981'; // Green
  return '#8b5cf6'; // Purple fallback
};

const getAmenityEmoji = (type: string) => {
  if (type.includes('school')) return '🏫';
  if (type.includes('hospital')) return '🏥';
  if (type.includes('park')) return '🌳';
  return '📍';
};

const MarkerWithInfoWindow = ({ 
  item, 
  onSelect, 
  selectedItemId,
  onActive
}: { 
  item: any, 
  onSelect: (id: string) => void, 
  selectedItemId?: string | null,
  onActive?: (item: any) => void
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [isOpen, setIsOpen] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (selectedItemId === item.id) {
      setIsOpen(true);
      if (item.coordinates && map) {
        map.panTo(item.coordinates);
        map.setZoom(15);
      }
    }
  }, [selectedItemId, item.id, item.coordinates, map]);

  if (!item.coordinates) return null;

  const isProject = 'title' in item;
  const title = isProject ? item.title : item.societyName;
  const { bg, border } = getStatusColor(item.status);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={item.coordinates}
        onClick={() => {
          setIsOpen(true);
          onActive?.(item);
        }}
      >
        <Pin 
          background={bg} 
          glyphColor="#fff" 
          borderColor={border}
          glyph={isProject ? "P" : "R"}
        />
      </AdvancedMarker>
      {isOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setIsOpen(false)}
        >
          <div className="p-3 min-w-[240px] max-w-[280px] text-zinc-900 font-sans">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm leading-tight text-zinc-900 break-words line-clamp-2">
                  {title}
                </h3>
                {item.builderName && (
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5 flex items-center gap-1">
                    <Building2 size={10} className="text-zinc-400" /> {item.builderName}
                  </p>
                )}
              </div>
              <span className={`shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                item.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                item.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                item.status === 'Sold' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}>
                {item.status}
              </span>
            </div>

            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] text-zinc-600 flex items-start gap-1 leading-normal">
                <MapPin size={10} className="mt-0.5 shrink-0 text-amber-600" /> 
                <span className="line-clamp-2">{item.location}</span>
              </p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                {(item.type || (item as any).propertyType) && (
                  <div className="flex items-center gap-1 text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-700">
                    <Home size={8} /> {item.type || (item as any).propertyType}
                  </div>
                )}
                {((item as any).configuration || (item as any).bhk) && (
                  <div className="flex items-center gap-1 text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-700">
                    <Tag size={8} /> {(item as any).configuration || (item as any).bhk} 
                  </div>
                )}
                {((item as any).area || (item as any).sizeSqft) && (
                  <div className="flex items-center gap-1 text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-700">
                    <Maximize2 size={8} /> {(item as any).area || (item as any).sizeSqft} sq.ft
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">Starting From</span>
                <span className="text-amber-600 font-extrabold text-sm leading-none">
                  ₹{(item.price / 10000000).toFixed(2)} Cr
                </span>
              </div>
              <button
                onClick={() => onSelect(item.id)}
                className="bg-zinc-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1"
                id={`view-details-${item.id}`}
              >
                Details
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapSearchControl = () => {
  const map = useMap();
  const [mapSearch, setMapSearch] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearch.trim() || !map) return;

    const google = (window as any).google;
    if (google?.maps?.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: mapSearch }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          map.panTo(location);
          map.setZoom(14);
          setSearchError('');
        } else {
          setSearchError('Location not found');
          setTimeout(() => setSearchError(''), 3000);
        }
      });
    } else {
      setSearchError('Geocoding service unavailable');
      setTimeout(() => setSearchError(''), 3000);
    }
  };

  return (
    <form 
      onSubmit={handleMapSearch} 
      className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 p-1.5 rounded-xl shadow-2xl z-10 flex items-center gap-2 max-w-[280px] w-full"
    >
      <div className="relative flex-1">
        <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500" />
        <input
          type="text"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder="Search location..."
          className="w-full bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-lg pl-8 pr-2 py-1 text-xs outline-none focus:border-amber-500"
        />
      </div>
      <button
        type="submit"
        className="bg-amber-500 text-zinc-950 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
      >
        <Search size={10} />
        Go
      </button>
      {searchError && (
        <div className="absolute top-full mt-1.5 left-0 bg-red-600 border border-red-500 text-white text-[9px] px-2 py-1 rounded shadow-lg z-50">
          {searchError}
        </div>
      )}
    </form>
  );
};

const AmenityMarkerWithInfoWindow = ({ 
  amenity, 
  color, 
  glyph, 
  activeItem,
  isFocused,
  onFocus
}: { 
  amenity: any; 
  color: string; 
  glyph: string; 
  activeItem: any;
  isFocused: boolean;
  onFocus: () => void;
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setIsOpen(true);
    }
  }, [isFocused]);

  if (!amenity.location) return null;

  // Compute straight-line distance
  let distanceStr = '';
  if (activeItem?.coordinates) {
    const aLat = getLat(amenity.location);
    const aLng = getLng(amenity.location);
    const dist = getDistance(
      activeItem.coordinates.lat,
      activeItem.coordinates.lng,
      aLat,
      aLng
    );
    distanceStr = dist < 1 
      ? `${Math.round(dist * 1000)} m` 
      : `${dist.toFixed(1)} km`;
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={amenity.location}
        onClick={() => {
          setIsOpen(true);
          onFocus();
        }}
      >
        <Pin 
          background={color} 
          glyphColor="#fff" 
          borderColor="#ffffff"
          glyph={glyph}
        />
      </AdvancedMarker>
      {isOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setIsOpen(false)}
        >
          <div className="p-2 min-w-[180px] max-w-[240px] text-zinc-900">
            <div className="flex items-start gap-1.5 mb-1.5 font-sans">
              <span className="text-base leading-none select-none">{glyph}</span>
              <div className="min-w-0">
                <h4 className="font-bold text-xs leading-snug break-words">{amenity.displayName}</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal break-words">{amenity.formattedAddress}</p>
              </div>
            </div>
            {distanceStr && (
              <div className="mt-1.5 pt-1.5 border-t border-zinc-100 flex justify-between items-center text-[10px] font-sans">
                <span className="text-zinc-500">Distance from property</span>
                <span className="font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">{distanceStr}</span>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

interface MapContentProps {
  itemsWithCoords: any[];
  onSelectItem: (id: string) => void;
  selectedItemId?: string | null;
  initialCenter: any;
  initialZoom: number;
  type: string;
}

const AmenityFilterBar = ({ selectedCategories, onToggle, counts, isLoading }: { 
  selectedCategories: { [key: string]: boolean }, 
  onToggle: (type: string) => void,
  counts: { [key: string]: number },
  isLoading: boolean
}) => {
  const categories = [
    { key: 'school', label: 'Schools', emoji: '🏫', color: 'blue' },
    { key: 'hospital', label: 'Hospitals', emoji: '🏥', color: 'red' },
    { key: 'park', label: 'Parks', emoji: '🌳', color: 'emerald' },
  ];

  return (
    <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 p-2 rounded-2xl shadow-2xl flex flex-col gap-1.5 w-40">
        <div className="px-2 py-1 mb-1 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Amenity Layers</span>
          {isLoading && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
        </div>
        {categories.map((cat) => {
          const isActive = selectedCategories[cat.key];
          const count = counts[cat.key] || 0;
          const colorClasses = {
            blue: isActive ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700/50',
            red: isActive ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700/50',
            emerald: isActive ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700/50',
          }[cat.color as 'blue' | 'red' | 'emerald'];

          return (
            <button
              key={cat.key}
              onClick={() => onToggle(cat.key)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer group ${colorClasses}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm select-none group-hover:scale-110 transition-transform">{cat.emoji}</span>
                <span>{cat.label}</span>
              </div>
              {count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-zinc-900/50'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MapContent: React.FC<MapContentProps> = ({
  itemsWithCoords,
  onSelectItem,
  selectedItemId,
  initialCenter,
  initialZoom,
  type
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  const [activeItem, setActiveItem] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState<any>(initialCenter);
  const [selectedCategories, setSelectedCategories] = useState<{ [key: string]: boolean }>({
    school: true,
    hospital: true,
    park: true
  });
  const [amenities, setAmenities] = useState<any[]>([]);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(false);
  const [focusedAmenityId, setFocusedAmenityId] = useState<string | null>(null);
  const [placesApiError, setPlacesApiError] = useState<string | null>(null);

  // Sync activeItem with selectedItemId prop
  useEffect(() => {
    if (selectedItemId) {
      const found = itemsWithCoords.find(item => item.id === selectedItemId);
      if (found) {
        setActiveItem(found);
      }
    }
  }, [selectedItemId, itemsWithCoords]);

  // Handle active item changing to set viewport & trigger searches
  const handleActiveItem = (item: any) => {
    setActiveItem(item);
  };

  // Fetch amenities
  useEffect(() => {
    if (!placesLib) {
      setAmenities([]);
      return;
    }

    const searchLocation = activeItem?.coordinates || mapCenter;
    if (!searchLocation) return;

    const activeTypes = Object.entries(selectedCategories)
      .filter(([_, enabled]) => enabled)
      .map(([catKey]) => catKey);

    if (activeTypes.length === 0) {
      setAmenities([]);
      return;
    }

    setIsLoadingAmenities(true);

    placesLib.Place.searchNearby({
      fields: ['id', 'displayName', 'location', 'formattedAddress', 'types'],
      locationRestriction: {
        center: searchLocation,
        radius: activeItem ? 2500 : 5000, // Larger radius for global layers
      },
      includedTypes: activeTypes,
      maxResultCount: 20,
    })
    .then(({ places }) => {
      setAmenities(places || []);
      setPlacesApiError(null);
    })
    .catch((err) => {
      const msg = err?.message || String(err) || '';
      if (msg.includes('Places API') || msg.includes('blocked') || msg.includes('PERMISSION_DENIED')) {
        console.warn("Places API (New) is not enabled or blocked. Nearby amenities will not be shown.", msg);
        setPlacesApiError('Enable Places API (New) in Google Cloud Console for amenities.');
      } else {
        console.warn("Failed to fetch nearby amenities:", msg);
        setPlacesApiError('Failed to fetch amenities.');
      }
    })
    .finally(() => {
      setIsLoadingAmenities(false);
    });
  }, [placesLib, activeItem, selectedCategories, mapCenter]);

  // Process and sort amenities by distance
  const processedAmenities = amenities.map(amenity => {
    let dist = 99999;
    let distStr = '';
    
    if (activeItem?.coordinates && amenity.location) {
      const aLat = getLat(amenity.location);
      const aLng = getLng(amenity.location);
      dist = getDistance(
        activeItem.coordinates.lat,
        activeItem.coordinates.lng,
        aLat,
        aLng
      );
      distStr = dist < 1 
        ? `${Math.round(dist * 1000)} m` 
        : `${dist.toFixed(1)} km`;
    }
    
    return {
      ...amenity,
      distance: dist,
      distanceStr: distStr
    };
  }).sort((a, b) => a.distance - b.distance);

  const amenityCounts = {
    school: amenities.filter(a => a.types?.some((t: string) => t.includes('school'))).length,
    hospital: amenities.filter(a => a.types?.some((t: string) => t.includes('hospital'))).length,
    park: amenities.filter(a => a.types?.some((t: string) => t.includes('park'))).length,
  };

  return (
    <>
      <Map
        defaultCenter={initialCenter}
        defaultZoom={initialZoom}
        mapId="bf50a91341c2eeed" // Just a demo ID
        style={{ width: '100%', height: '100%' }}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
        colorScheme={'DARK'}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        onCameraChanged={(ev: MapCameraChangedEvent) => {
          const center = ev.detail.center;
          const zoom = ev.detail.zoom;
          setMapCenter(center);
          localStorage.setItem(`map_center_${type}`, JSON.stringify(center));
          localStorage.setItem(`map_zoom_${type}`, zoom.toString());
        }}
      >
        {itemsWithCoords.map(item => (
          <MarkerWithInfoWindow 
            key={item.id} 
            item={item} 
            onSelect={onSelectItem} 
            selectedItemId={selectedItemId}
            onActive={handleActiveItem}
          />
        ))}

        {/* Real-time adjacent Amenities layers */}
        {processedAmenities.map((amenity) => {
          const firstMatchedType = amenity.types?.find((t: string) => ['school', 'hospital', 'park'].includes(t)) || 'other';
          const color = getAmenityColor(firstMatchedType);
          const emoji = getAmenityEmoji(firstMatchedType);
          return (
            <AmenityMarkerWithInfoWindow
              key={amenity.id}
              amenity={amenity}
              color={color}
              glyph={emoji}
              activeItem={activeItem}
              isFocused={focusedAmenityId === amenity.id}
              onFocus={() => setFocusedAmenityId(amenity.id)}
            />
          );
        })}
      </Map>
      <MapSearchControl />
      
      {placesApiError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-red-500/90 text-white rounded-lg shadow-xl font-medium text-xs text-center border border-red-400">
          {placesApiError}
        </div>
      )}

      <AmenityFilterBar 
        selectedCategories={selectedCategories}
        onToggle={(key) => setSelectedCategories(prev => ({ ...prev, [key]: !prev[key] }))}
        counts={amenityCounts}
        isLoading={isLoadingAmenities}
      />

      {/* Floating Panel: Property Details & Nearby Amenities */}
      {activeItem && (
        <div className="absolute bottom-4 right-4 left-4 md:left-auto md:w-[340px] max-h-[500px] flex flex-col bg-zinc-950/98 backdrop-blur-xl border border-zinc-800 rounded-[24px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] z-50 overflow-hidden text-zinc-100 text-xs font-sans ring-1 ring-white/5">
          {/* Header & Property Brief */}
          <div className="p-4.5 border-b border-zinc-800/80 bg-zinc-900/40 relative">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold text-[15px] text-white tracking-tight leading-tight break-words">
                  {activeItem.title || activeItem.societyName}
                </h3>
                {activeItem.builderName && (
                  <p className="text-[10px] text-zinc-400 font-medium mt-1 flex items-center gap-1.5">
                    <Building2 size={11} className="text-zinc-500" /> {activeItem.builderName}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setActiveItem(null)}
                className="p-1.5 bg-white/5 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white absolute right-3 top-3 border border-white/5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-black">Valuation</span>
                <span className="text-amber-500 font-bold text-xs ring-1 ring-amber-500/10 px-1.5 py-0.5 rounded-md bg-amber-500/5 w-fit">₹{(activeItem.price / 10000000).toFixed(2)} Cr</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50 flex flex-col gap-1 overflow-hidden">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-black">Category</span>
                <span className="truncate text-xs font-medium text-zinc-200">{activeItem.type || (activeItem as any).propertyType || 'Asset'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-black">Config</span>
                <span className="text-xs font-medium text-zinc-200">{activeItem.configuration || (activeItem as any).bhk || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-black">Footprint</span>
                <span className="flex items-center gap-1 text-xs font-medium text-zinc-200">
                  <Maximize2 size={11} className="text-zinc-500" />
                  {activeItem.area || (activeItem as any).sizeSqft || 'N/A'} sq.ft
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-zinc-900/30 rounded-lg border border-zinc-800/40">
              <MapPin size={12} className="text-amber-500 shrink-0" />
              <span className="text-[10px] text-zinc-400 line-clamp-1 italic">{activeItem.location}</span>
            </div>
          </div>

          {/* Amenities Header */}
          <div className="px-4 py-2.5 bg-zinc-900/20 flex items-center justify-between border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-amber-500 animate-pulse" />
              <h4 className="font-black text-[9px] uppercase tracking-[0.2em] text-zinc-300">Nearby Connectivity</h4>
            </div>
            {isLoadingAmenities && <div className="w-3 h-3 border border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />}
          </div>

          {/* Amenities Itemized List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
            {isLoadingAmenities ? (
              <div className="h-32 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px]">Searching nearby area...</p>
              </div>
            ) : processedAmenities.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-zinc-500 text-center p-4">
                <span className="text-xl">📍</span>
                <p className="text-[10px] mt-1">No amenities found in search radius.</p>
              </div>
            ) : (
              processedAmenities.map((amenity) => {
                const type = amenity.types?.find((t: string) => ['school', 'hospital', 'park'].includes(t)) || 'other';
                const emoji = getAmenityEmoji(type);
                const isFocused = focusedAmenityId === amenity.id;

                return (
                  <div
                    key={amenity.id}
                    onClick={() => {
                      setFocusedAmenityId(amenity.id);
                      if (map && amenity.location) {
                        map.panTo(amenity.location);
                        map.setZoom(16);
                      }
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2 ${
                      isFocused 
                        ? 'bg-zinc-850/80 border-amber-500/50 shadow-md ring-1 ring-amber-500/10' 
                        : 'bg-zinc-900/30 border-zinc-800/60 hover:border-zinc-700/80 hover:bg-zinc-900/50'
                    }`}
                  >
                    <span className="text-base leading-none select-none mt-0.5">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-100 line-clamp-1 text-[11px] leading-snug">{amenity.displayName}</h4>
                      <p className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5 leading-normal">{amenity.formattedAddress}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[8px] text-zinc-500 font-medium">
                        <span className="text-amber-500 font-semibold">{amenity.distanceStr}</span>
                        <span>•</span>
                        <span className="capitalize">{type === 'school' ? 'Education' : type === 'hospital' ? 'Healthcare' : 'Recreation'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};

const ProjectMapView: React.FC<ProjectMapViewProps> = ({ items, onSelectItem, type, selectedItemId }) => {
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    // Intercept Google Maps billing/auth errors
    (window as any).gm_authFailure = () => {
      setMapError('Google Maps Authentication or Billing failed. Please check your API key and billing status.');
    };
    
    // Catch specific console errors from Maps API
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args[0];
      if (typeof msg === 'string' && msg.includes('BillingNotEnabledMapError')) {
        setMapError('Google Maps Billing is not enabled for this project. Please enable billing in Google Cloud Console.');
        return; // Suppress from console to avoid AI Studio error boundary triggering
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
      delete (window as any).gm_authFailure;
    };
  }, []);

  // Filter items that have coordinates
  const itemsWithCoords = React.useMemo(() => items.filter(item => item.coordinates), [items]);

  if (!hasValidKey) {
    return (
      <div className="w-full h-[600px] bg-surface-2 border border-border-dim rounded-2xl flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-amber-primary/10 rounded-full flex items-center justify-center mx-auto text-amber-primary">
            <MapPin size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Google Maps Key Required</h3>
          <p className="text-text-secondary text-sm">
            To view projects on the map, please add your Google Maps API key in the Settings.
          </p>
          <div className="bg-surface p-4 rounded-xl border border-border-bright text-left space-y-2">
            <p className="text-xs font-bold text-text-dim uppercase tracking-wider">How to set up:</p>
            <ol className="text-xs text-text-secondary list-decimal ml-4 space-y-1">
              <li>Open <strong>Settings</strong> (⚙️)</li>
              <li>Go to <strong>Secrets</strong></li>
              <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-[600px] bg-surface-2 border border-border-dim rounded-2xl flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Google Maps Error</h3>
          <p className="text-text-secondary text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  // Default center (Gurgaon) if no items or first item
  const defaultCenter = itemsWithCoords.length > 0 && itemsWithCoords[0].coordinates 
    ? itemsWithCoords[0].coordinates 
    : { lat: 28.4595, lng: 77.0266 };

  // Load saved zoom and center from localStorage so agents return to their previous area of interest after navigating away
  const savedCenter = localStorage.getItem(`map_center_${type}`);
  const savedZoom = localStorage.getItem(`map_zoom_${type}`);

  let initialCenter = defaultCenter;
  let initialZoom = 12;

  if (savedCenter) {
    try {
      const parsed = JSON.parse(savedCenter);
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        initialCenter = parsed;
      }
    } catch (e) {
      console.warn("Failed to parse saved map center:", e);
    }
  }

  if (savedZoom) {
    const parsedZoom = parseInt(savedZoom, 10);
    if (!isNaN(parsedZoom)) {
      initialZoom = parsedZoom;
    }
  }

  return (
    <div className="w-full h-[600px] bg-surface-2 border border-border-dim rounded-2xl overflow-hidden relative shadow-2xl">
      <APIProvider apiKey={API_KEY} version="weekly" onError={(err) => {
        console.error("Google Maps API Error:", err);
        setMapError('Failed to load Google Maps API. Billing might not be enabled on this project.');
      }}>
        <MapContent
          itemsWithCoords={itemsWithCoords}
          onSelectItem={onSelectItem}
          selectedItemId={selectedItemId}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          type={type}
        />
      </APIProvider>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-surface/80 border border-border-dim p-4 rounded-xl shadow-lg z-10 space-y-4 min-w-[160px] pointer-events-auto">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-text-dim uppercase tracking-widest border-b border-border-dim pb-1">Status</p>
          <div className="flex items-center gap-2 text-xs text-text-primary px-1">
            <div className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-primary px-1">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-primary px-1">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
            <span>Sold</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black text-text-dim uppercase tracking-widest border-b border-border-dim pb-1">Type</p>
          <div className="flex items-center gap-2 text-xs text-text-primary px-1">
            <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">P</div>
            <span>New Project</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-primary px-1">
            <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">R</div>
            <span>Resale Prop</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMapView;
