import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css'; // Asegúrate de importar los estilos

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map() {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null); // Para guardar la instancia del mapa
    
    // Opcional: Estado para guardar las coordenadas centrales
    const [centerCoords, setCenterCoords] = useState({ lng: -75.674, lat: 4.821 });

    useEffect(() => {
        if (mapInstanceRef.current) return; // Evitar reinicialización

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v11', // Asegúrate de tener un estilo válido
            center: [-75.674, 4.821],
            zoom: 15,
        });

        mapInstanceRef.current = map;

        // (Opcional) Escuchar cuando el mapa se mueve para actualizar coordenadas
        map.on('move', () => {
            const center = map.getCenter();
            setCenterCoords({
                lng: Number(center.lng.toFixed(5)),
                lat: Number(center.lat.toFixed(5))
            });
        });

        return () => map.remove();
    }, []);

    return (
        // 1. Contenedor padre con posición relativa
        <div style={{ position: 'relative', width: '100%', height: '400px' }}>
            
            {/* 2. El Mapa de Mapbox */}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* 3. El Ícono Fijo (Superpuesto) */}
            <div 
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)', // Esto centra el punto exacto
                    zIndex: 10, // Para que quede encima del mapa
                    pointerEvents: 'none', // IMPORTANTE: Permite hacer click y arrastrar el mapa a través del ícono
                    paddingBottom: '25px' // Ajuste visual: para que la "punta" del pin quede en el centro, no el medio del ícono
                }}
            >
                {/* Aquí pones tu ícono de casa. Puede ser una imagen o FontAwesome */}
                <i className="fas fa-home" style={{ fontSize: '30px', color: '#c00000', dropShadow: '0 2px 4px rgba(0,0,0,0.3)' }}></i>
            </div>

            {/* (Opcional) Mostrar coordenadas actuales */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '5px 10px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 10
            }}>
                Lat: {centerCoords.lat}, Lng: {centerCoords.lng}
            </div>
        </div>
    );
}