
import React, { useState } from 'react';
import { users } from '../services/mockData';
import GleLogo from './ui/GleLogo';

interface LoginPageProps {
  onLogin: (cedula: string) => void;
  logo: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, logo }) => {
  const [cedula, setCedula] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(cedula);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl">
        <div className="text-center">
            <GleLogo logo={logo} className="mx-auto mb-4" style={{ height: '80px' }} />
            <h1 className="text-3xl font-bold text-gray-800">Bienvenido a SmartSales</h1>
            <p className="mt-2 text-gray-600">Por favor, ingrese su número de cédula para continuar.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="cedula" className="sr-only">Número de Cédula</label>
              <input
                id="cedula"
                name="cedula"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gle-red focus:border-gle-red focus:z-10 sm:text-sm"
                placeholder="Número de Cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gle-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-lock text-red-300 group-hover:text-red-200"></i>
              </span>
              Ingresar
            </button>
          </div>
        </form>
         <div className="text-center mt-4">
          <p className="text-sm text-gray-500">Usuarios de prueba:</p>
          <select 
            onChange={e => setCedula(e.target.value)} 
            value={cedula}
            className="mt-1 text-sm text-gray-700 border-gray-300 rounded"
          >
            <option value="">Seleccione un usuario</option>
            {users.map(user => (
              <option key={user.cedula} value={user.cedula}>{user.nombre} ({user.cargo})</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;