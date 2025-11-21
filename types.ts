// types.ts

// --- ROLES Y USUARIO ---

export enum Role {
  COMERCIAL = 'Comercial',
  LIDER_REGIONAL = 'Líder Regional',
  DIRECTOR = 'Director Comercial Nacional',
  ADMIN = 'Administrador',
}

export interface User {
  cedula: string;
  nombre: string;
  cargo: Role;
  regional: string;
  // Si el backend devuelve ciudad para el usuario:
  ciudad?: string;
}

// --- VISITAS ---

export enum VisitType {
  PROSPECTO = 'prospecto',
  MANTENIMIENTO = 'mantenimiento',
  CIERRE = 'cierre',
}

/**
 * Visita tal como la expone el backend (GET /visitas/)
 * y la usamos en el frontend.
 *
 * Para crear una visita usamos:
 * Omit<Visit, 'id_visita' | 'creado_en'>
 */
export interface Visit {
  id_visita: string;

  nombre_ejecutivo: string;
  cedula_ejecutivo: string;

  nombre_cliente: string;
  nit: string;

  sucursal?: string;
  direccion: string;
  contacto: string;
  telefono?: string;
  correo: string;

  motivo: VisitType;
  fecha_hora: string;          // ISO completo: "2025-11-21T02:55:40.274Z"

  // En el ejemplo del backend vienen como string:
  lat?: string;
  lng?: string;

  tiempo_visita_min: number;   // duracion de la visita en minutos

  fecha_aprox_cierre?: string | null; // formato "YYYY-MM-DD"
  observaciones: string;
  evidencia_urls?: string;     // puede ser lista en texto plano, coma separada

  estado: string;              // p.ej. "registrado"
  creado_por: string;
  creado_en: string;           // fecha/hora de creación en backend (ISO)
}

// --- PROSPECTOS ---

/**
 * Prospecto tal como lo devuelve el backend.
 * Para crear uno usamos:
 * Omit<Prospect, 'id_prospecto' | 'creado_en'>
 */
export interface Prospect {
  id_prospecto: string;

  comercial_cedula: string;
  nombre_empresa: string;
  nit: string;

  direccion: string;
  ciudad: string;
  contacto: string;
  telefono: string;
  correo: string;

  sector: string;
  compromisos: string;

  fecha_registro: string;  // "YYYY-MM-DD"
  estado: string;          // p.ej. "contactado", "en_seguimiento", etc.

  observaciones?: string;

  creado_en: string;       // fecha/hora de creación en backend (ISO)
}

// --- CIERRES ---

/**
 * Cierre tal como lo devuelve el backend.
 * Para crear uno usamos:
 * Omit<Closure, 'id_cierre' | 'creado_en'>
 */
export interface Closure {
  valor: any;
  id_cierre: string;

  comercial_cedula: string;

  cliente: string;
  nit: string;
  direccion: string;
  correo: string;

  tipo_cierre: 'nuevo' | 'renovacion' | string;
  fecha_cierre: string;     // "YYYY-MM-DD"
  valor_estimado: number;

  regional: string;
  ciudad: string;

  observaciones?: string;
  compromisos?: string;

  // Opcionales según lo que tengas en el backend
  contacto?: string;
  telefono?: string;

  creado_en: string;        // fecha/hora de creación en backend (ISO)
}
