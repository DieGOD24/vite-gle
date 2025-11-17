// src/services/api.ts
import axios from 'axios';
import { User, Visit, Prospect, Closure } from '../types'; // Asumo que tus tipos están en '../types'

// Creamos una instancia de Axios con tu URL base
const api = axios.create({
  baseURL: 'https://back.smartsales.cerebria.co/api',
});

// ------------------------------------------------------------------
// ¡CLAVE! Esto intercepta CADA petición y le añade el token.
// Así no tienes que poner el "Authorization" header manualmente.
// ------------------------------------------------------------------
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Definimos las funciones para obtener los datos ---

// Nota: Tus endpoints de API (visitas, prospectos, etc.) están paginados.
// Por ahora, solo obtendremos la primera página (.data.results).
// Más adelante, se puede implementar un "fetch" de todas las páginas.

// Asumo que la respuesta de DRF es { count: number, results: T[] }
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}



// --- Funciones GET (ya existentes) ---
export const getVisits = () => api.get<PaginatedResponse<Visit>>('/visitas/');
export const getProspects = () => api.get<PaginatedResponse<Prospect>>('/prospectos/');
export const getClosures = () => api.get<PaginatedResponse<Closure>>('/cierres/');
export const getUsers = () => api.get<PaginatedResponse<User>>('/usuarios/');

// --- Funciones POST (nuevas) ---
export const postVisit = (visit: Omit<Visit, 'id'>) => api.post<Visit>('/visitas/', visit);
export const postProspect = (prospect: Omit<Prospect, 'id'>) => api.post<Prospect>('/prospectos/', prospect);
export const postClosure = (closure: Omit<Closure, 'id'>) => api.post<Closure>('/cierres/', closure);

export default api;
