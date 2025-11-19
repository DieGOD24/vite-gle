import {useEffect, useRef} from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map(){
    const mapRef = useRef(null);

    useEffect(() => {
        const map = new mapboxgl.Map({
            container: mapRef.current,
            center: [-75.674,4.821],
            zoom: 15,
        });
        return () => map.remove();
    }, []);
    return <div ref={mapRef} style={{width: '100%', height: '400px'}} />;
}