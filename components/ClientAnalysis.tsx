import React, { useState, useMemo } from 'react';
import { User, Visit, Prospect, Closure, VisitType } from '../types';
import KpiCard from './ui/KpiCard';
import DataTable from './ui/DataTable';

interface ClientAnalysisProps {
  clients: { name: string; nit: string }[];
  visits: Visit[];
  prospects: Prospect[];
  closures: Closure[];
  user: User;
  onUpdateClient: (nit: string, data: any) => void;
}

const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('es-CO');
};

const ClientAnalysis: React.FC<ClientAnalysisProps> = ({
  clients,
  visits,
  prospects,
  closures,
  user,
  onUpdateClient
}) => {
  const [selectedClientNit, setSelectedClientNit] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fechas por defecto (Mes actual)
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  const [dateRange, setDateRange] = useState({
    start: lastMonth.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  });

  // Filtrar lista de clientes por búsqueda
  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.nit.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  // Obtener datos del cliente seleccionado
  const clientData = useMemo(() => {
    if (!selectedClientNit) return null;

    const clientInfo = clients.find(c => c.nit === selectedClientNit);
    if (!clientInfo) return null;

    // --- LÓGICA DE FECHAS SEGURA ---
    const start = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : new Date(0);
    const end = dateRange.end ? new Date(`${dateRange.end}T23:59:59`) : new Date();

    const filterByDate = (item: any) => {
      const itemDateStr = item.fecha_hora || item.fecha_registro || item.fecha_cierre;
      if (!itemDateStr) return false;
      const itemDate = new Date(itemDateStr);
      return itemDate >= start && itemDate <= end;
    };

    // Filtramos por NIT del cliente Y por fecha
    const clientVisits = visits.filter(v => v.nit === selectedClientNit && filterByDate(v));
    const clientProspects = prospects.filter(p => p.nit === selectedClientNit && filterByDate(p));
    const clientClosures = closures.filter(c => c.nit === selectedClientNit && filterByDate(c));

    // Cálculo seguro del valor total
    const totalValue = clientClosures.reduce((sum, c) => {
        const val = (c as any).valor_estimado ?? (c as any).valor ?? 0;
        return sum + (Number(val) || 0);
    }, 0);

    // --- CÁLCULO DE ÚLTIMO CONTACTO ---
    // Buscamos la fecha más reciente entre todas las interacciones filtradas
    let lastContactDate: Date | null = null;
    const allInteractions = [...clientVisits, ...clientProspects, ...clientClosures];
    
    if (allInteractions.length > 0) {
        // Obtenemos la fecha más grande
        const maxDateStr = allInteractions.reduce((max, item) => {
            const currentStr = 'fecha_hora' in item ? item.fecha_hora : 'fecha_registro' in item ? item.fecha_registro : (item as any).fecha_cierre;
            if (!currentStr) return max;
            return currentStr > max ? currentStr : max;
        }, '');
        
        if (maxDateStr) lastContactDate = new Date(maxDateStr);
    }

    return {
      name: clientInfo.name,
      nit: clientInfo.nit,
      visits: clientVisits,
      prospects: clientProspects,
      closures: clientClosures,
      totalValue,
      lastContact: lastContactDate ? lastContactDate.toLocaleDateString('es-CO') : 'Sin actividad reciente'
    };
  }, [selectedClientNit, clients, visits, prospects, closures, dateRange]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Información de Clientes</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Panel Izquierdo: Lista de Clientes */}
        <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-1 flex flex-col h-[600px]">
          <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
             <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </span>
                <input
                  type="text"
                  className="block w-full pl-10 p-2 border border-gray-300 rounded-md"
                  placeholder="Nombre o NIT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
             {filteredClients.length > 0 ? (
               filteredClients.map(client => (
                 <button
                   key={client.nit}
                   onClick={() => setSelectedClientNit(client.nit)}
                   className={`w-full text-left p-3 rounded-md transition duration-150 flex justify-between items-center ${
                     selectedClientNit === client.nit 
                       ? 'bg-gle-red text-white shadow-md' 
                       : 'hover:bg-gray-100 text-gray-700'
                   }`}
                 >
                   <div>
                     <p className="font-bold truncate">{client.name}</p>
                     <p className={`text-xs ${selectedClientNit === client.nit ? 'text-red-100' : 'text-gray-500'}`}>NIT: {client.nit}</p>
                   </div>
                   <i className="fas fa-chevron-right opacity-50"></i>
                 </button>
               ))
             ) : (
               <p className="text-center text-gray-500 py-4">No se encontraron clientes.</p>
             )}
          </div>
        </div>

        {/* Panel Derecho: Detalles del Cliente */}
        <div className="lg:col-span-2 space-y-6">
          {clientData ? (
            <>
              {/* Filtros de Fecha para el detalle */}
              <div className="bg-white p-4 shadow-md grid grid-cols-2 gap-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Desde</label>
                  <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hasta</label>
                  <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} 
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" 
                  />
                </div>
              </div>

              {/* KPIs del Cliente */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gle-gray-dark">{clientData.name}</h3>
                        <p className="text-gray-500">NIT: {clientData.nit}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Valor Total (Periodo)</p>
                        <p className="text-2xl font-bold text-green-600">${clientData.totalValue.toLocaleString('es-CO')}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard 
                      title="Total Visitas" 
                      value={clientData.visits.length} 
                      icon="fa-route" // Icono restaurado
                      color="gle-blue" 
                    />
                    <KpiCard 
                      title="Total Prospectos" 
                      value={clientData.prospects.length} 
                      icon="fa-user-plus" // Icono restaurado
                      color="gle-gray" 
                    />
                    <KpiCard 
                      title="Total Cierres" 
                      value={clientData.closures.length} 
                      icon="fa-handshake" // Icono mantenido
                      color="gle-red" 
                    />
                     <KpiCard 
                      title="Último Contacto" 
                      value={clientData.lastContact} 
                      icon="fa-history" 
                      color="gle-gray" 
                    />
                 </div>
              </div>

              {/* Tablas de Detalle */}
              <div className="space-y-6">
                  {clientData.visits.length > 0 && (
                      <DataTable 
                        title="Historial de Visitas" 
                        data={clientData.visits} 
                        columns={[
                            { key: 'fecha_hora', name: 'Fecha', render: (i: Visit) => formatDate(i.fecha_hora) },
                            { key: 'motivo', name: 'Motivo', render: (i: Visit) => i.motivo },
                            { key: 'nombre_ejecutivo', name: 'Ejecutivo', render: (i: Visit) => i.nombre_ejecutivo || 'N/A' },
                            { key: 'observaciones', name: 'Observaciones', render: (i: Visit) => i.observaciones || '-' }
                        ]}
                      />
                  )}

                  {clientData.closures.length > 0 && (
                      <DataTable 
                        title="Historial de Cierres" 
                        data={clientData.closures} 
                        columns={[
                            { key: 'fecha_cierre', name: 'Fecha', render: (i: Closure) => formatDate(i.fecha_cierre) },
                            { key: 'tipo_cierre', name: 'Tipo', render: (i: Closure) => i.tipo_cierre },
                            { 
                                key: 'valor_estimado', 
                                name: 'Valor', 
                                render: (i: Closure) => `$${(Number((i as any).valor_estimado ?? i.valor ?? 0)).toLocaleString('es-CO')}` 
                            },
                        ]}
                      />
                  )}
                  
                  {clientData.visits.length === 0 && clientData.closures.length === 0 && (
                      <div className="text-center py-10 bg-white rounded-lg shadow border border-dashed border-gray-300">
                          <p className="text-gray-500">No hay actividad registrada para este cliente en el rango de fechas seleccionado.</p>
                      </div>
                  )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-lg shadow-md p-10 text-center">
               <i className="fas fa-user-friends text-6xl text-gray-200 mb-4"></i>
               <h3 className="text-xl font-semibold text-gray-700">Seleccione un cliente</h3>
               <p className="text-gray-500">Haga clic en un cliente de la lista para ver su historial detallado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAnalysis;