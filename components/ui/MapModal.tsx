
import React, { useEffect, useRef } from 'react';

// TypeScript declaration for the Leaflet global variable from the CDN
declare const L: any;

interface MapModalProps {
    onClose: () => void;
    commercialLocation: { lat: number, lng: number };
    clientAddress: string;
    visitId?: string;
    onValidate?: (visitId: string) => void;
}

const MapModal: React.FC<MapModalProps> = ({ onClose, commercialLocation, clientAddress, visitId, onValidate }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    const handleValidate = () => {
        if (onValidate && visitId) {
            onValidate(visitId);
            onClose();
        }
    };
    
    useEffect(() => {
        if (mapContainer.current && !mapInstance.current) {
            // Initialize map
            mapInstance.current = L.map(mapContainer.current).setView([commercialLocation.lat, commercialLocation.lng], 15);
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);

            // Simulate client location nearby for demonstration
            // In a real scenario, you would geocode the clientAddress
            const clientLocation = {
                lat: commercialLocation.lat + 0.002,
                lng: commercialLocation.lng + 0.002
            };

            // Custom Icons
            const commercialIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });
            
             const clientIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            // Add markers
            const commercialMarker = L.marker([commercialLocation.lat, commercialLocation.lng], { icon: commercialIcon })
                .addTo(mapInstance.current)
                .bindPopup('<b>Ubicación del Comercial</b><br>Captura GPS del registro.')
                .openPopup();
                
            const clientMarker = L.marker([clientLocation.lat, clientLocation.lng], { icon: clientIcon })
                .addTo(mapInstance.current)
                .bindPopup(`<b>Ubicación del Cliente (Simulada)</b><br>${clientAddress}`);
            
            // Fit map to markers
            const group = L.featureGroup([commercialMarker, clientMarker]);
            mapInstance.current.fitBounds(group.getBounds().pad(0.5));
        }

        // Cleanup function
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [commercialLocation, clientAddress]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gle-gray-dark">Verificación de Ubicación</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">
                        &times;
                    </button>
                </div>
                <div className="h-96 w-full rounded-md" ref={mapContainer} style={{ zIndex: 1 }}></div>
                 <div className="flex justify-around mt-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" alt="Red Marker" className="h-6"/>
                        <span>Ubicación Comercial (GPS)</span>
                    </div>
                     <div className="flex items-center space-x-2">
                        <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" alt="Blue Marker" className="h-6"/>
                        <span>Ubicación Cliente (Simulada)</span>
                    </div>
                </div>
                {onValidate && visitId && (
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={handleValidate}
                            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 flex items-center space-x-2"
                        >
                            <i className="fas fa-check"></i>
                            <span>Validar Ubicación</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapModal;