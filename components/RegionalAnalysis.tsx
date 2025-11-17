import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// 1. CORRECCIÓN: Importamos 'User' (y 'Role')
import { User, Role, Visit, Prospect, Closure } from '../types'; 
// 2. CORRECCIÓN: Eliminamos la importación de 'mockData'
// import { users } from '../services/mockData';
import KpiCard from './ui/KpiCard';

interface RegionalAnalysisProps {
  visits: Visit[];
  prospects: Prospect[];
  closures: Closure[];
  users: User[]; // 3. CORRECCIÓN: Recibimos 'users' como prop
}

const today = new Date();
const lastMonth = new Date(today);
lastMonth.setMonth(today.getMonth() - 1);

const REGIONS = ['Bogotá', 'Medellín', 'Barranquilla', 'Cali'];

// 4. CORRECCIÓN: Aceptamos 'users' en las props
const RegionalAnalysis: React.FC<RegionalAnalysisProps> = ({ visits, prospects, closures, users }) => {
  const [dateRange, setDateRange] = useState({
      start: lastMonth.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
  });
    
  const regionalData = useMemo(() => {
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    if (end) end.setHours(23, 59, 59, 999);

    // 5. CORRECCIÓN: Convertimos las fechas (string) a objetos Date para comparar
    const filterByDate = (item: { fecha_hora?: string, fecha_registro?: string, fecha_cierre?: string }) => {
        if (!start || !end) return true;
        
        // La API envía strings (ej: "2025-11-17" o "2025-11-17T15:00:00Z")
        const itemDateStr = item.fecha_hora || item.fecha_registro || item.fecha_cierre;
        if (!itemDateStr) return false;
        
        const itemDate = new Date(itemDateStr); // Convertimos el string a Date
        return itemDate >= start && itemDate <= end;
    };
      
    // Limpiamos nulos/undefined antes de filtrar
    const filteredVisits = visits.filter(Boolean).filter(filterByDate);
    const filteredProspects = prospects.filter(Boolean).filter(filterByDate);
    const filteredClosures = closures.filter(Boolean).filter(filterByDate);

    // 6. CORRECCIÓN: Tipamos el acumulador del 'reduce'
    const commercialUsersByRegion = users.reduce((acc: Record<string, Set<string>>, user) => {
        // Usamos el Enum 'Role' para una comparación segura
        if (user.cargo === Role.COMERCIAL || user.cargo === 'Comercial') { 
            if (!acc[user.regional]) {
                acc[user.regional] = new Set();
            }
            acc[user.regional].add(user.cedula);
        }
        return acc;
    }, {} as Record<string, Set<string>>); // <-- Y el valor inicial

    return REGIONS.map(region => {
      const regionCommercials = commercialUsersByRegion[region] || new Set();
      
      const regionalVisits = filteredVisits.filter(v => regionCommercials.has(v.cedula_ejecutivo));
      const regionalProspects = filteredProspects.filter(p => regionCommercials.has(p.comercial_cedula));
      const regionalClosures = filteredClosures.filter(c => regionCommercials.has(c.comercial_cedula));

      const conversionRate = regionalProspects.length > 0
        ? ((regionalClosures.length / regionalProspects.length) * 100)
        : 0;

      return {
        name: region,
        Visitas: regionalVisits.length,
        Prospectos: regionalProspects.length,
        Cierres: regionalClosures.length,
        conversionRate,
      };
    });
  }, [visits, prospects, closures, dateRange, users]); // 7. CORRECCIÓN: Añadimos 'users' a las dependencias

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Análisis Comparativo por Región</h2>
      
      {/* ... (El resto de tu JSX es perfecto y no necesita cambios) ... */}
      <div className="bg-white p-4 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
           <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Rendimiento General por Región</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={regionalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Visitas" fill="#c00000" />
            <Bar dataKey="Prospectos" fill="#444444" />
            <Bar dataKey="Cierres" fill="#9E9E9E" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {regionalData.map(region => (
          <div key={region.name} className="bg-white p-4 rounded-lg shadow-md border-t-4 border-gle-red">
            <h4 className="font-bold text-lg text-center text-gle-gray-dark">{region.name}</h4>
            <div className="mt-4 space-y-2 flex flex-col items-center">
                <KpiCard 
                    title="Tasa Conversión" 
                    value={`${region.conversionRate.toFixed(1)}%`} 
                    icon="fa-percent" 
                    color="gle-red" 
                />
                 <KpiCard 
                    title="Total Visitas" 
                    value={region.Visitas} 
                    icon="fa-route" 
                    color="gle-gray" 
                />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegionalAnalysis;