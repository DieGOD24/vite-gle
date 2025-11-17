
export enum Role {
  COMERCIAL = 'Comercial',
  LIDER_REGIONAL = 'Líder Regional',
  DIRECTOR = 'Director Comercial Nacional',
  ADMIN = 'Administrador'
}

export interface User {
  cedula: string;
  nombre: string;
  cargo: Role;
  regional: string;
}

export enum VisitType {
  PROSPECTO = 'prospecto',
  MANTENIMIENTO = 'mantenimiento',
  CIERRE = 'cierre'
}

export interface Visit {
  id: string;
  cedula_ejecutivo: string;
  nombre_ejecutivo: string;
  cliente: string;
  nit: string;
  direccion: string;
  contacto: string;
  telefono: string;
  correo: string;
  motivo: VisitType;
  fecha_hora: Date;
  observaciones: string;
  latitud?: number;
  longitud?: number;
  ubicacion_validada?: boolean;
  duracion_minutos?: number;
}

export interface Prospect {
    id: string;
    nombre_empresa: string;
    nit: string;
    direccion: string;
    ciudad: string;
    contacto: string;
    telefono: string;
    correo: string;
    sector: string;
    compromisos: string;
    cedula_comercial: string;
    fecha_registro: Date;
    fecha_posible_cierre: Date;
    estado: 'Contactado' | 'En seguimiento' | 'Perdido';
    latitud?: number;
    longitud?: number;
}

export interface Closure {
    id: string;
    cliente: string;
    nit: string;
    direccion: string;
    contacto: string;
    telefono: string;
    correo: string;
    tipo_cierre: 'Nuevo' | 'Renovación';
    cedula_comercial: string;
    fecha_cierre: Date;
    valor: number;
    latitud?: number;
    longitud?: number;
}