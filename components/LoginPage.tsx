import React, { useState } from 'react';
// import { users } from '../services/mockData'; // <--- Ya no necesitamos esto
import GleLogo from './ui/GleLogo';

// 1. Definimos los tipos para el usuario y la respuesta de la API
// (Basado en el serializer de Django)
interface User {
  cedula: string;
  nombre: string;
  cargo: string;
  regional: string;
  is_active: boolean;
  // ... (otros campos que hayas incluido, como 'correo' o 'ciudad')
}

// (Basado en la respuesta de auth_views.py)
interface LoginResponse {
  ok: true;
  user: User;
  access_token: string;
  refresh_token: string;
}

interface LoginErrorResponse {
  ok: false;
  error: string;
}

// 2. Actualizamos las props. 'onLogin' ahora pasará el objeto User
interface LoginPageProps {
  onLogin: (user: User) => void;
  logo: string | null;
}

// 3. Definimos la URL de tu API
// (Asegúrate de que sea https si tu backend tiene SSL)
const API_URL = 'https://back.smartsales.cerebria.co/api/auth/validate';

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, logo }) => {
  const [cedula, setCedula] = useState('');
  
  // 4. Añadimos estados de carga y error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) return;

    setIsLoading(true);
    setError(null);

    try {
      // 5. Hacemos la llamada POST al backend
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cedula }),
      });

      const data = await response.json();

      // Si la respuesta NO es exitosa (ej. 403 "no autorizado")
      if (!response.ok) {
        const errorData = data as LoginErrorResponse;
        throw new Error(errorData.error || 'Error desconocido');
      }

      // --- ÉXITO ---
      const loginData = data as LoginResponse;

      // 6. Guardamos los tokens en localStorage
      localStorage.setItem('accessToken', loginData.access_token);
      localStorage.setItem('refreshToken', loginData.refresh_token);

      // 7. Llamamos a 'onLogin' (del componente padre, App.tsx)
      //    con los datos del usuario para cambiar el estado global.
      onLogin(loginData.user);

    } catch (err: any) {
      // Si hay un error de red o del backend, lo mostramos
      setError(err.message || 'Error de conexión. Intente más tarde.');
    } finally {
      setIsLoading(false);
    }
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
                disabled={isLoading} // <--- Deshabilitado mientras carga
              />
            </div>
          </div>

          {/* 8. Mostramos el mensaje de error si existe */}
          {error && (
            <div className="text-center text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gle-red hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300 disabled:opacity-50"
              disabled={isLoading} // <--- Deshabilitado mientras carga
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-lock text-red-300 group-hover:text-red-200"></i>
              </span>
              {/* 9. Cambiamos el texto del botón al cargar */}
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
        
        {/* 10. Eliminamos el selector de usuarios de prueba */}
        {/*
         <div className="text-center mt-4">
           <p className="text-sm text-gray-500">Usuarios de prueba:</p>
           ... (Todo este bloque se ha eliminado) ...
         </div>
        */}
      </div>
    </div>
  );
};

export default LoginPage;