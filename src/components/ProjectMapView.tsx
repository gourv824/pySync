import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Building2, Home, MapPin, Maximize2, Tag, User } from 'lucide-react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

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

const MarkerWithInfoWindow = ({ item, onSelect }: { item: any, onSelect: (id: string) => void }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [isOpen, setIsOpen] = useState(false);

  if (!item.coordinates) return null;

  const isProject = 'title' in item;
  const title = isProject ? item.title : item.societyName;
  const { bg, border } = getStatusColor(item.status);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={item.coordinates}
        onClick={() => setIsOpen(true)}
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
          <div className="p-2 min-w-[200px] text-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">{title}</h3>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                item.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                item.status === 'Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                item.status === 'Sold' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-zinc-600 mb-2 flex items-center gap-1">
              <MapPin size={10} /> {item.location}
            </p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
              <span className="text-amber-600 font-bold text-sm">
                ₹{(item.price / 10000000).toFixed(2)} Cr
              </span>
              <button
                onClick={() => onSelect(item.id)}
                className="bg-zinc-900 text-white text-[10px] px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                id={`view-details-${item.id}`}
              >
                View Details
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const ProjectMapView: React.FC<ProjectMapViewProps> = ({ items, onSelectItem, type }) => {
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

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

  // Filter items that have coordinates
  const itemsWithCoords = items.filter(item => item.coordinates);
  
  // Default center (Gurgaon) if no items or first item
  const defaultCenter = itemsWithCoords.length > 0 && itemsWithCoords[0].coordinates 
    ? itemsWithCoords[0].coordinates 
    : { lat: 28.4595, lng: 77.0266 };

  return (
    <div className="w-full h-[600px] bg-surface-2 border border-border-dim rounded-2xl overflow-hidden relative shadow-2xl">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          mapId="bf50a91341c2eeed" // Just a demo ID
          style={{ width: '100%', height: '100%' }}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          colorScheme={'DARK'}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {itemsWithCoords.map(item => (
            <MarkerWithInfoWindow 
              key={item.id} 
              item={item} 
              onSelect={onSelectItem} 
            />
          ))}
        </Map>
      </APIProvider>
      
      {/* Legend */}
      <div className="absolute top-4 left-4 bg-surface/80 border border-border-dim p-4 rounded-xl shadow-lg z-10 space-y-4 min-w-[160px]">
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
