
import React, { useMemo, useState } from 'react';
import { Visit, Prospect, Closure, User, Role } from '../types';
import { users } from '../services/mockData';
import KpiCard from './ui/KpiCard';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import ClientEditModal from './ui/ClientEditModal';

interface ClientAnalysisProps {
    clients: { name: string; nit: string }[];
    visits: Visit[];
    prospects: Prospect[];
    closures: Closure[];
    user: User;
    onUpdateClient: (nit: string, data: any) => void;
}

const getIconForType = (type: string) => {
    switch (type) {
        case 'Visita': return { icon: 'fa-route', color: 'blue-500' };
        case 'Prospecto': return { icon: 'fa-user-plus', color: 'gle-red' };
        case 'Cierre': return { icon: 'fa-handshake', color: 'green-500' };
        default: return { icon: 'fa-question-circle', color: 'gray-500' };
    }
};

const ClientCard: React.FC<{client: {name: string, nit: string}, onClick: () => void}> = ({ client, onClick }) => (
    <button 
        onClick={onClick} 
        className="w-full text-left bg-white p-4 rounded-lg shadow-md hover:shadow-xl hover:border-gle-red border-2 border-transparent transition-all duration-300"
        aria-label={`Ver detalles de ${client.name}`}
    >
        <div className="flex items-center space-x-4">
            <div className="bg-gle-gray-light rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                <i className="fas fa-building text-gle-red text-xl"></i>
            </div>
            <div className="overflow-hidden">
                <p className="font-bold text-gle-gray-dark truncate">{client.name}</p>
                <p className="text-sm text-gray-500">NIT: {client.nit}</p>
            </div>
        </div>
    </button>
);


const ClientAnalysis: React.FC<ClientAnalysisProps> = ({ clients, visits, prospects, closures, user, onUpdateClient }) => {
    const [selectedNit, setSelectedNit] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    
    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const lowercasedFilter = searchTerm.toLowerCase();
        return clients.filter(c => 
            c.name.toLowerCase().includes(lowercasedFilter) ||
            c.nit.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, clients]);

    const clientData = useMemo(() => {
        if (!selectedNit) return null;
        
        let clientVisits = visits.filter(v => v.nit === selectedNit);
        let clientProspects = prospects.filter(p => p.nit === selectedNit);
        let clientClosures = closures.filter(c => c.nit === selectedNit);
        
        if(user.cargo === Role.COMERCIAL) {
            clientVisits = clientVisits.filter(v => v.cedula_ejecutivo === user.cedula);
            clientProspects = clientProspects.filter(p => p.cedula_comercial === user.cedula);
            clientClosures = clientClosures.filter(c => c.cedula_comercial === user.cedula);
        }
        
        const assignedCommercials = [...new Set(
            [
                ...visits.filter(v => v.nit === selectedNit).map(v => v.nombre_ejecutivo),
                ...prospects.filter(p => p.nit === selectedNit).map(p => users.find(u => u.cedula === p.cedula_comercial)?.nombre),
                ...closures.filter(c => c.nit === selectedNit).map(c => users.find(u => u.cedula === c.cedula_comercial)?.nombre)
            ].filter(Boolean)
        )];
        
        const timeline = [
            ...clientVisits.map(v => ({ date: v.fecha_hora, type: 'Visita', description: `${v.motivo}: ${v.observaciones}`, commercial: v.nombre_ejecutivo })),
            ...clientProspects.map(p => ({ date: p.fecha_registro, type: 'Prospecto', description: `Nuevo prospecto registrado. Estado: ${p.estado}`, commercial: users.find(u=>u.cedula === p.cedula_comercial)?.nombre })),
            ...clientClosures.map(c => ({ date: c.fecha_cierre, type: 'Cierre', description: `Cierre de ${c.tipo_cierre} por valor de $${c.valor.toLocaleString('es-CO')}`, commercial: users.find(u=>u.cedula === c.cedula_comercial)?.nombre })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            info: clients.find(c => c.nit === selectedNit),
            visits: clientVisits,
            prospects: clientProspects,
            closures: clientClosures,
            commercials: assignedCommercials.join(', ') || 'No asignado',
            timeline,
        };

    }, [selectedNit, clients, visits, prospects, closures, user]);
    
    const representativeClientData = useMemo(() => {
        if (!clientData || !clientData.info) return null;

        const allInteractions: (Visit | Prospect | Closure)[] = [
            ...clientData.visits,
            ...clientData.prospects,
            ...clientData.closures
        ].sort((a, b) => {
            const dateA = 'fecha_hora' in a ? a.fecha_hora : 'fecha_registro' in a ? a.fecha_registro : a.fecha_cierre;
            const dateB = 'fecha_hora' in b ? b.fecha_hora : 'fecha_registro' in b ? b.fecha_registro : b.fecha_cierre;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        const latestRecord = allInteractions[0];
        
        return {
            nombre: clientData.info.name,
            nit: clientData.info.nit,
            direccion: latestRecord?.direccion || '',
            contacto: latestRecord?.contacto || '',
            telefono: latestRecord?.telefono || '',
            correo: latestRecord?.correo || '',
        };
    }, [clientData]);

    const engagementScore = useMemo(() => {
        if (!clientData) return 0;
        let score = 0;
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        clientData.closures.forEach(c => {
            if (new Date(c.fecha_cierre) > oneYearAgo) score += 40;
        });
        clientData.prospects.forEach(p => {
            if (new Date(p.fecha_registro) > oneYearAgo) score += 10;
        });
        clientData.visits.forEach(v => {
            if (new Date(v.fecha_hora) > oneYearAgo) score += 5;
        });

        if (clientData.timeline.length > 0) {
            const lastActivityDate = new Date(clientData.timeline[0].date);
            const daysSinceLastActivity = (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 3600 * 24);
            if (daysSinceLastActivity <= 30) score += 20;
            else if (daysSinceLastActivity <= 90) score += 10;
        }
        
        return Math.min(100, Math.round(score));
    }, [clientData]);
    
    const handleSaveClient = (updatedData: any) => {
        if (selectedNit) {
            onUpdateClient(selectedNit, updatedData);
        }
        setEditModalOpen(false);
    };
    
    // Client Detail View
    if (clientData) {
        return (
            <div className="space-y-6">
                <button onClick={() => setSelectedNit('')} className="flex items-center space-x-2 text-gle-gray hover:text-gle-red font-semibold transition-colors">
                    <i className="fas fa-arrow-left"></i>
                    <span>Volver al Directorio de Clientes</span>
                </button>
                 <div className="bg-white p-6 rounded-lg shadow-lg border-l-8 border-gle-red">
                      <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-3xl font-bold text-gle-gray-dark mb-1">{clientData.info?.name}</h3>
                            <p className="text-md text-gray-500">NIT: {clientData.info?.nit}</p>
                            <p className="text-md text-gray-500 mt-2"><i className="fas fa-user-tie mr-2"></i>Ejecutivo(s): {clientData.commercials}</p>
                        </div>
                        {user.cargo === Role.ADMIN && (
                            <button 
                                onClick={() => setEditModalOpen(true)}
                                className="bg-gle-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center space-x-2"
                            >
                                <i className="fas fa-pencil-alt"></i>
                                <span>Editar Cliente</span>
                            </button>
                        )}
                      </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <KpiCard title="Total Visitas" value={clientData.visits.length} icon="fa-route" color="gle-blue" />
                       <KpiCard title="Total Prospectos" value={clientData.prospects.length} icon="fa-user-plus" color="gle-red" />
                       <KpiCard title="Total Cierres" value={clientData.closures.length} icon="fa-handshake" color="gle-gray" />
                       <KpiCard title="Último Contacto" value={clientData.timeline.length > 0 ? new Date(clientData.timeline[0].date).toLocaleDateString('es-CO') : 'N/A'} icon="fa-calendar-alt" color="gle-blue" />
                    </div>
                     <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
                         <h3 className="text-gray-500 font-medium mb-2 text-center">Nivel de Engagement</h3>
                         <ResponsiveContainer width="100%" height={150}>
                            <RadialBarChart 
                                innerRadius="70%" 
                                outerRadius="95%" 
                                data={[{ name: 'Engagement', value: engagementScore }]} 
                                startAngle={180} 
                                endAngle={-180}
                                barSize={25}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background dataKey="value" cornerRadius={12} fill="#c00000" />
                                <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-4xl font-bold fill-current text-gle-gray-dark">
                                    {engagementScore}
                                </text>
                                 <text x="50%" y="75%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-current text-gray-500">
                                    / 100
                                </text>
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-gray-500 text-center mt-2">Puntaje basado en actividad reciente.</p>
                    </div>
                 </div>
                 
                 <div className="bg-white p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold mb-6">Cadena de Trazabilidad Histórica</h3>
                     <div className="relative overflow-y-auto max-h-96 pr-4 border-l-4 border-gle-gray-light ml-6">
                        {clientData.timeline.length > 0 ? clientData.timeline.map((item, index) => {
                            const { icon, color } = getIconForType(item.type);
                            return (
                             <div key={index} className="pl-10 mb-8 relative">
                                 <div className={`absolute -left-8 top-0 w-12 h-12 rounded-full bg-${color} text-white flex items-center justify-center shadow-lg`}>
                                     <i className={`fas ${icon} text-xl`}></i>
                                 </div>
                                 <p className={`font-bold text-lg text-gray-800`}>{item.type} <span className="text-gray-500 font-normal text-sm">- {new Date(item.date).toLocaleString('es-CO')}</span></p>
                                 <p className="text-gray-700 mt-1">{item.description}</p>
                                 <p className="text-xs text-gray-500 mt-2 italic">Atendido por: {item.commercial}</p>
                             </div>
                            )
                        }) : (
                             <div className="pl-8 text-center text-gray-500">No hay actividades registradas para este cliente.</div>
                        )}
                     </div>
                 </div>
                 {isEditModalOpen && representativeClientData && (
                    <ClientEditModal
                        clientData={representativeClientData}
                        onClose={() => setEditModalOpen(false)}
                        onSave={handleSaveClient}
                    />
                 )}
             </div>
        )
    }

    // Client Directory View
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Directorio de Clientes</h2>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <label htmlFor="client-search" className="sr-only">Buscar Cliente</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <i className="fas fa-search text-gray-400"></i>
                    </div>
                    <input 
                        type="text" 
                        id="client-search"
                        placeholder={`Buscar entre ${clients.length} clientes por NIT o Nombre...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="block w-full p-3 pl-10 border border-gray-300 rounded-md shadow-sm text-lg"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.length > 0 ? filteredClients.map(c => (
                    <ClientCard key={c.nit} client={c} onClick={() => setSelectedNit(c.nit)} />
                )) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                        <i className="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
                        <p className="text-lg text-gray-600">No se encontraron clientes con ese criterio de búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientAnalysis;