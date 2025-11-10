
import React, { useState, useEffect } from 'react';
import { User, Visit, Prospect, Closure } from './types';
import { users, visits as initialVisits, prospects as initialProspects, closures as initialClosures } from './services/mockData';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>(initialVisits);
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [closures, setClosures] = useState<Closure[]>(initialClosures);

  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const handleLogin = (cedula: string) => {
    const user = users.find(u => u.cedula === cedula);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('Número de cédula no encontrado.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleSetLogo = (logoDataUrl: string) => {
    setLogo(logoDataUrl);
    localStorage.setItem('companyLogo', logoDataUrl);
  };

  const addVisit = (visit: Visit) => setVisits(prev => [visit, ...prev]);
  const addProspect = (prospect: Prospect) => setProspects(prev => [prospect, ...prev]);
  const addClosure = (closure: Closure) => setClosures(prev => [closure, ...prev]);

  const handleValidateVisit = (visitId: string) => {
    setVisits(prevVisits => 
      prevVisits.map(v => 
        v.id === visitId ? { ...v, ubicacion_validada: true } : v
      )
    );
  };
  
  const handleUpdateClient = (nit: string, updatedData: any) => {
    setVisits(prev => prev.map(item => item.nit === nit ? { ...item, cliente: updatedData.nombre, ...updatedData } : item));
    setProspects(prev => prev.map(item => item.nit === nit ? { ...item, nombre_empresa: updatedData.nombre, ...updatedData } : item));
    setClosures(prev => prev.map(item => item.nit === nit ? { ...item, cliente: updatedData.nombre, ...updatedData } : item));
  };


  return (
    <div className="min-h-screen bg-gle-gray-light font-sans">
      {currentUser ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout}
          visits={visits}
          prospects={prospects}
          closures={closures}
          onAddVisit={addVisit}
          onAddProspect={addProspect}
          onAddClosure={addClosure}
          logo={logo}
          onSetLogo={handleSetLogo}
          onValidateVisit={handleValidateVisit}
          onUpdateClient={handleUpdateClient}
        />
      ) : (
        <LoginPage onLogin={handleLogin} logo={logo} />
      )}
    </div>
  );
};

export default App;