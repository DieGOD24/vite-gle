import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface MapModalProps {
  onClose: () => void;
  commercialLocation: { lat: number; lng: number };
  clientAddress: string;
  visitId?: string;
  onValidate?: (visitId: string) => void;
}

const MapModal: React.FC<MapModalProps> = ({
  onClose,
  commercialLocation,
  clientAddress,
  visitId,
  onValidate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const handleValidate = () => {
    if (onValidate && visitId) {
      onValidate(visitId);
      onClose();
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // 1. Inicializar el mapa
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [commercialLocation.lng, commercialLocation.lat],
      zoom: 15,
      attributionControl: false,
    });

    mapRef.current = map;

    // 2. Crear el elemento HTML personalizado para el marcador
    // Usamos JavaScript puro para crear el ícono de la casa
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="background: white; padding: 8px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #e5e7eb;">
          <i class="fas fa-house" style="color: #c00000; font-size: 24px;"></i>
        </div>
        <div style="width: 2px; height: 10px; background-color: #c00000;"></div>
        <div style="width: 8px; height: 4px; background-color: rgba(0,0,0,0.2); border-radius: 50%;"></div>
      </div>
    `;

    // 3. Agregar el marcador al mapa en las coordenadas exactas
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([commercialLocation.lng, commercialLocation.lat])
      .addTo(map);

    // 4. Redimensionar al cargar
    map.on('load', () => {
      map.resize();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [commercialLocation.lng, commercialLocation.lat]); // Importante: Dependencias para actualizar si cambian las coordenadas

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Ubicación de la Visita</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
        </div>

        {/* Contenedor del Mapa */}
        <div className="relative w-full h-[400px] bg-gray-100">
          {/* Ya no necesitamos el ícono flotante aquí, mapbox lo maneja dentro */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Footer */}
        <div className="p-6 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium">Coordenadas</p>
              <p className="font-mono text-gray-700">{commercialLocation.lat.toFixed(6)}, {commercialLocation.lng.toFixed(6)}</p>
            </div>
            {clientAddress && (
              <div>
                <p className="text-gray-500 font-medium">Dirección</p>
                <p className="text-gray-800">{clientAddress}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;