
import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, Visit, Prospect, Closure } from '../types';
import { users } from '../services/mockData';
import KpiCard from './ui/KpiCard';
import RegionalAnalysis from './RegionalAnalysis';
import CommercialAnalysis from './CommercialAnalysis';
import RegistrationForm from './RegistrationForm';
import ExecutiveSummary from './ExecutiveSummary';
import ClientAnalysis from './ClientAnalysis';
import GleLogo from './ui/GleLogo';
import ActiveVisitBanner from './ui/ActiveVisitBanner';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  visits: Visit[];
  prospects: Prospect[];
  closures: Closure[];
  onAddVisit: (visit: Visit) => void;
  onAddProspect: (prospect: Prospect) => void;
  onAddClosure: (closure: Closure) => void;
  logo: string | null;
  onSetLogo: (logo: string) => void;
  onValidateVisit: (visitId: string) => void;
  onUpdateClient: (nit: string, data: any) => void;
}

interface ActiveVisit {
  clientName: string;
  clientNit: string;
  startTime: number;
}

const today = new Date();
const lastMonth = new Date(today);
lastMonth.setMonth(today.getMonth() - 1);

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, visits, prospects, closures, onAddVisit, onAddProspect, onAddClosure, logo, onSetLogo, onValidateVisit, onUpdateClient }) => {
  const isCommercial = user.cargo === Role.COMERCIAL;
  const isManager = user.cargo === Role.ADMIN || user.cargo === Role.DIRECTOR || user.cargo === Role.LIDER_REGIONAL;
  
  const [activeTab, setActiveTab] = useState(isCommercial ? 'registrar' : 'resumen');
  const [selectedRegion, setSelectedRegion] = useState<string>(user.cargo === Role.LIDER_REGIONAL ? user.regional : '');
  const [selectedCommercial, setSelectedCommercial] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: lastMonth.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  });
  const [activeVisit, setActiveVisit] = useState<ActiveVisit | null>(null);

  useEffect(() => {
    const savedVisit = localStorage.getItem('activeVisit');
    if (savedVisit) {
      try {
        const parsedVisit = JSON.parse(savedVisit);
        if (parsedVisit.startTime && parsedVisit.clientName && parsedVisit.clientNit) {
          setActiveVisit(parsedVisit);
        } else {
          localStorage.removeItem('activeVisit');
        }
      } catch (e) {
        localStorage.removeItem('activeVisit');
      }
    }
  }, []);

  const handleStartVisit = (clientName: string, clientNit: string) => {
    const visitData = { clientName, clientNit, startTime: Date.now() };
    setActiveVisit(visitData);
    localStorage.setItem('activeVisit', JSON.stringify(visitData));
  };

  const handleClearActiveVisit = () => {
    setActiveVisit(null);
    localStorage.removeItem('activeVisit');
  };
  
  const REGIONS = useMemo(() => {
    if (user.cargo === Role.LIDER_REGIONAL) return [user.regional];
    return ['Bogotá', 'Medellín', 'Barranquilla', 'Cali'];
  }, [user]);

  const commercialUsersForFilter = useMemo(() => {
    let filteredUsers = users.filter(u => u.cargo === Role.COMERCIAL);
    if (user.cargo === Role.LIDER_REGIONAL) {
        filteredUsers = filteredUsers.filter(u => u.regional === user.regional);
    }
    if (selectedRegion) {
        filteredUsers = filteredUsers.filter(u => u.regional === selectedRegion);
    }
    return filteredUsers;
  }, [user, selectedRegion]);

  const { filteredVisits, filteredProspects, filteredClosures, previousPeriodData } = useMemo(() => {
    let baseVisits = visits;
    let baseProspects = prospects;
    let baseClosures = closures;

    // Data is already pre-filtered for managers by the filter UI.
    // For commercials, we filter strictly by their ID.
    if (user.cargo === Role.COMERCIAL) {
      baseVisits = visits.filter(v => v.cedula_ejecutivo === user.cedula);
      baseProspects = prospects.filter(p => p.cedula_comercial === user.cedula);
      baseClosures = closures.filter(c => c.cedula_comercial === user.cedula);
    }

    if (isManager) {
        if (selectedRegion) {
            const regionalUsers = new Set(users.filter(u => u.regional === selectedRegion).map(u => u.cedula));
            baseVisits = visits.filter(v => regionalUsers.has(v.cedula_ejecutivo));
            baseProspects = prospects.filter(p => regionalUsers.has(p.cedula_comercial));
            baseClosures = closures.filter(c => regionalUsers.has(c.cedula_comercial));
        }
        if (selectedCommercial) {
            baseVisits = baseVisits.filter(v => v.cedula_ejecutivo === selectedCommercial);
            baseProspects = baseProspects.filter(p => p.cedula_comercial === selectedCommercial);
            baseClosures = baseClosures.filter(c => c.cedula_comercial === selectedCommercial);
        }
    }

    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    
    let currentVisits: Visit[] = [], currentProspects: Prospect[] = [], currentClosures: Closure[] = [];
    let previousVisits: Visit[] = [], previousProspects: Prospect[] = [], previousClosures: Closure[] = [];

    if (start && end) {
        end.setHours(23, 59, 59, 999);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const prevStart = new Date(start);
        prevStart.setDate(start.getDate() - diffDays);
        const prevEnd = new Date(start);
        prevEnd.setDate(start.getDate() - 1);
        prevEnd.setHours(23,59,59,999);

        currentVisits = baseVisits.filter(v => new Date(v.fecha_hora) >= start && new Date(v.fecha_hora) <= end);
        currentProspects = baseProspects.filter(p => new Date(p.fecha_registro) >= start && new Date(p.fecha_registro) <= end);
        currentClosures = baseClosures.filter(c => new Date(c.fecha_cierre) >= start && new Date(c.fecha_cierre) <= end);
        
        previousVisits = baseVisits.filter(v => new Date(v.fecha_hora) >= prevStart && new Date(v.fecha_hora) <= prevEnd);
        previousProspects = baseProspects.filter(p => new Date(p.fecha_registro) >= prevStart && new Date(p.fecha_registro) <= prevEnd);
        previousClosures = baseClosures.filter(c => new Date(c.fecha_cierre) >= prevStart && new Date(c.fecha_cierre) <= prevEnd);
    }

    return { 
        filteredVisits: currentVisits, 
        filteredProspects: currentProspects, 
        filteredClosures: currentClosures,
        previousPeriodData: {
            visits: previousVisits,
            prospects: previousProspects,
            closures: previousClosures,
        }
    };
  }, [user, selectedRegion, selectedCommercial, dateRange, visits, prospects, closures]);
  
  const clientsForView = useMemo(() => {
    const clientMap = new Map<string, { name: string; nit: string }>();
    let interactions: (Visit | Prospect | Closure)[] = [];

    if (user.cargo === Role.COMERCIAL) {
        const commercialVisits = visits.filter(v => v.cedula_ejecutivo === user.cedula);
        const commercialProspects = prospects.filter(p => p.cedula_comercial === user.cedula);
        const commercialClosures = closures.filter(c => c.cedula_comercial === user.cedula);
        interactions = [...commercialVisits, ...commercialProspects, ...commercialClosures];
    } else {
        interactions = [...visits, ...prospects, ...closures];
    }
    
    interactions.forEach(item => {
        const name = 'cliente' in item ? item.cliente : item.nombre_empresa;
        if (item.nit && !clientMap.has(item.nit)) {
            clientMap.set(item.nit, { name, nit: item.nit });
        }
    });
    return Array.from(clientMap.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [user, visits, prospects, closures]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        onSetLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderContent = () => {
     switch (activeTab) {
        case 'registrar':
            return <RegistrationForm 
              user={user} 
              activeVisit={activeVisit}
              onStartVisit={handleStartVisit}
              onRegisterVisit={onAddVisit}
              onAddProspect={onAddProspect} 
              onAddClosure={onAddClosure} 
              onClearActiveVisit={handleClearActiveVisit}
            />;
        case 'resumen':
        case 'registros': // Used for commercial role
            return <ExecutiveSummary 
                visits={filteredVisits} 
                prospects={filteredProspects} 
                closures={filteredClosures} 
                previousData={previousPeriodData}
                user={user}
                users={users} 
                selectedCommercialName={selectedCommercial ? commercialUsersForFilter.find(u => u.cedula === selectedCommercial)?.nombre : ''}
                selectedRegion={selectedRegion}
                dateRange={dateRange}
            />;
        case 'analisis-regional':
             return <RegionalAnalysis 
                visits={visits}
                prospects={prospects}
                closures={closures}
            />;
        case 'analisis-ejecutivo':
             return <CommercialAnalysis 
                commercialUsers={commercialUsersForFilter}
                visits={visits}
                prospects={prospects}
                closures={closures}
                onValidateVisit={onValidateVisit}
             />;
        case 'clientes':
            return <ClientAnalysis clients={clientsForView} visits={visits} prospects={prospects} closures={closures} user={user} onUpdateClient={onUpdateClient} />;
        default:
            return null;
     }
  }

  const baseTabs = [
    { id: 'registrar', name: 'Registrar Actividad', icon: 'fa-edit', roles: [Role.COMERCIAL] },
    { id: 'registros', name: 'Mis Registros', icon: 'fa-history', roles: [Role.COMERCIAL] },
    { id: 'resumen', name: 'Resumen Gerencial', icon: 'fa-chart-line', roles: [Role.ADMIN, Role.DIRECTOR, Role.LIDER_REGIONAL] },
    { id: 'analisis-regional', name: 'Análisis Regional', icon: 'fa-globe-americas', roles: [Role.ADMIN, Role.DIRECTOR, Role.LIDER_REGIONAL] },
    { id: 'analisis-ejecutivo', name: 'Análisis por Ejecutivo', icon: 'fa-user-tie', roles: [Role.ADMIN, Role.DIRECTOR, Role.LIDER_REGIONAL] },
    { id: 'clientes', name: 'Información de Clientes', icon: 'fa-users', roles: [Role.COMERCIAL, Role.ADMIN, Role.DIRECTOR, Role.LIDER_REGIONAL] }
  ];

  const visibleTabs = baseTabs.filter(tab => tab.roles.includes(user.cargo));
  
  return (
    <div className="flex h-screen bg-gle-gray-light">
      <nav className="w-64 bg-gle-gray-dark text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-700 flex items-center space-x-2">
            <GleLogo logo={logo} style={{ height: '40px' }} />
            <span className="text-xl font-semibold">SmartSales</span>
        </div>
        <div className="flex-grow">
          {visibleTabs.map(tab => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition duration-200 ${activeTab === tab.id ? 'bg-gle-red' : 'hover:bg-gle-gray'}`}
                >
                <i className={`fas ${tab.icon} w-5`}></i>
                <span>{tab.name}</span>
                </button>
            )
          )}
        </div>
        <div className="p-4 border-t border-gray-700">
            <p className="font-bold">{user.nombre}</p>
            <p className="text-sm text-gray-400">{user.cargo} - {user.regional}</p>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {activeVisit && isCommercial && <ActiveVisitBanner activeVisit={activeVisit} onEndVisit={() => setActiveTab('registrar')} />}
        <header className="bg-white shadow-md p-4 flex justify-between items-center z-10">
          <h1 className="text-2xl font-bold text-gle-gray-dark">Dashboard de Control</h1>
          <div className="flex items-center space-x-4">
            {user.cargo === Role.ADMIN && (
              <>
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition duration-200 flex items-center space-x-2 cursor-pointer">
                  <i className="fas fa-upload"></i>
                  <span>Cambiar Logo</span>
                </label>
              </>
            )}
            <button onClick={onLogout} className="bg-gle-red text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200 flex items-center space-x-2">
              <i className="fas fa-sign-out-alt"></i>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </header>
        {isManager && ['resumen', 'analisis-ejecutivo'].includes(activeTab) && (
            <div className="bg-white p-4 shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Región</label>
                    <select value={selectedRegion} onChange={e => { setSelectedRegion(e.target.value); setSelectedCommercial(''); }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" disabled={user.cargo === Role.LIDER_REGIONAL}>
                        <option value="">Todas las Regiones</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ejecutivo Comercial</label>
                    <select value={selectedCommercial} onChange={e => setSelectedCommercial(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm">
                        <option value="">Todos los Ejecutivos</option>
                        {commercialUsersForFilter.map(u => <option key={u.cedula} value={u.cedula}>{u.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                    <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
            </div>
        )}
         {isCommercial && ['registros', 'clientes'].includes(activeTab) && (
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
         )}
        <div className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;