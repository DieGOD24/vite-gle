import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

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

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [commercialLocation.lng, commercialLocation.lat],
      zoom: 15,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Ajusta el mapa al tamaño real del contenedor dentro del modal
      setTimeout(() => {
        map.resize();
      }, 100);
    });

    const handleWindowResize = () => {
      map.resize();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [commercialLocation.lat, commercialLocation.lng]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Capa de fondo oscura en toda la pantalla */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Contenido del modal */}
      <div
        className="
          relative
          bg-white rounded-lg shadow-xl 
          w-full max-w-3xl 
          max-h-[90vh] 
          flex flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-6 pt-6">
          <h2 className="text-2xl font-bold text-gle-gray-dark">
            Detalle de Ubicación de la Visita
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Mapa + marcador fijo */}
        <div className="px-6 flex-1">
          <div className="relative w-full h-[260px] md:h-[340px] rounded-md overflow-hidden">
            {/* Contenedor del mapa */}
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Marcador de casa fijo en el centro del mapa */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="pointer-events-auto flex flex-col items-center -mt-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200">
                  <i className="fas fa-house text-gle-red text-xl" />
                </div>
                <div className="w-px h-4 bg-red-500/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Info debajo del mapa + botón validar */}
        <div className="px-6 pb-6 pt-4 space-y-3">
          <p className="text-xs text-gray-600">
            El ícono de la{' '}
            <i className="fas fa-house text-gle-red mx-1" />
            indica la ubicación reportada por el comercial en el mapa.
          </p>

          <p className="text-sm text-gray-700">
            <span className="font-semibold">Coordenadas:</span>{' '}
            lat {commercialLocation.lat.toFixed(6)}, lng{' '}
            {commercialLocation.lng.toFixed(6)}
          </p>

          {clientAddress && (
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Dirección reportada:</span>{' '}
              {clientAddress}
            </p>
          )}

          {onValidate && visitId && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleValidate}
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center space-x-2"
              >
                <i className="fas fa-check" />
                <span>Validar Ubicación</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapModal;
