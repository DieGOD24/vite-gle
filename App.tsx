import React, { useState, useEffect } from 'react';
// 1. IMPORTAMOS 'User' DESDE types.ts (junto con los otros tipos)
import { User, Visit, Prospect, Closure } from './types'; 

// Importa los componentes de la interfaz
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

// 1. IMPORTA TUS FUNCIONES DE API (del archivo api.ts)
import api, { getVisits, getProspects, getClosures, getUsers } from './services/api';

// 2. ELIMINAMOS LA INTERFAZ 'User' LOCAL (porque ya la importamos)
/*
interface User {
  cedula: string;
  nombre: string;
  cargo: string;
  // ... (etc.)
}
*/

const App: React.FC = () => {
  // Estado para el usuario actual (ahora usa el tipo 'User' importado)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // (El resto de tus 'useState' y 'useEffect' están perfectos)
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [visitsRes, prospectsRes, closuresRes, usersRes] = await Promise.all([
        getVisits(),
        getProspects(),
        getClosures(),
        getUsers(),
      ]);
      setVisits(visitsRes.data.results);
      setProspects(prospectsRes.data.results);
      setClosures(closuresRes.data.results);
      setUsers(usersRes.data.results);
    } catch (error: any) {
      console.error("Error cargando los datos del dashboard:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setVisits([]);
    setProspects([]);
    setClosures([]);
    setUsers([]);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const handleSetLogo = (logoDataUrl: string) => {
    setLogo(logoDataUrl);
    localStorage.setItem('companyLogo', logoDataUrl);
  };

  // --- 3. CORRECCIÓN EN LAS FIRMAS DE LAS FUNCIONES 'add...' ---
  // Deben coincidir con lo que 'RegistrationForm' envía (objetos sin ID)
  
  const addVisit = async (visit: Omit<Visit, 'id_visita' | 'creado_en'>) => {
    try {
      await api.post('/visitas/', visit); 
      await fetchDashboardData(); 
    } catch (error) {
      console.error("Error al añadir visita:", error);
      throw error; // Re-lanzamos el error para que RegistrationForm lo atrape
    }
  };
  
  const addProspect = async (prospect: Omit<Prospect, 'id_prospecto' | 'creado_en'>) => {
    try {
      await api.post('/prospectos/', prospect);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error al añadir prospecto:", error);
      throw error; // Re-lanzamos el error
    }
  };
  
  const addClosure = async (closure: Omit<Closure, 'id_cierre' | 'creado_en'>) => {
    try {
      await api.post('/cierres/', closure);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error al añadir cierre:", error);
      throw error; // Re-lanzamos el error
    }
  };

  // (El resto de las funciones están bien)
  const handleValidateVisit = async (visitId: string) => {
    try {
      // (Tu modelo 'Visit' no tiene 'ubicacion_validada', así que comentamos esto)
      // await api.patch(`/visitas/${visitId}/`, { ubicacion_validada: true });
      console.log("TODO: Implementar validación de visita", visitId);
      // await fetchDashboardData(); 
    } catch (error) {
      console.error("Error al validar visita:", error);
    }
  };
  
  const handleUpdateClient = async (nit: string, updatedData: any) => {
    console.log("TODO: Implementar API para actualizar cliente por NIT", nit, updatedData);
  };

  // --- (LÓGICA DE RENDERIZADO - SIN CAMBIOS) ---
  
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gle-gray-light font-sans">
        <LoginPage onLogin={handleLogin} logo={logo} />
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando datos...
      </div>
    );
  }
    return (
    <div className="min-h-screen bg-gle-gray-light font-sans">
      <Dashboard 
        user={currentUser} 
        onLogout={handleLogout}
        visits={visits}
        prospects={prospects}
        closures={closures}
        users={users}
        onAddVisit={addVisit}
        onAddProspect={addProspect}
        onAddClosure={addClosure}
        logo={logo}
        onSetLogo={handleSetLogo}
        onValidateVisit={handleValidateVisit}
        onUpdateClient={handleUpdateClient}
      />
    </div>
  );
};

export default App;