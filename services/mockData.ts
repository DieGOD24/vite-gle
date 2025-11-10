import { User, Role, Visit, Prospect, Closure, VisitType } from '../types';

export const users: User[] = [
  { cedula: '1', nombre: 'Luis Carlos Ramírez', cargo: Role.ADMIN, regional: 'Nacional' },
  { cedula: '2', nombre: 'Director Nacional', cargo: Role.DIRECTOR, regional: 'Nacional' },
  // Bogotá
  { cedula: '100', nombre: 'Líder Bogotá', cargo: Role.LIDER_REGIONAL, regional: 'Bogotá' },
  ...Array.from({ length: 7 }, (_, i) => ({ cedula: `10${i+1}`, nombre: `Comercial Bogotá ${i+1}`, cargo: Role.COMERCIAL, regional: 'Bogotá' })),
  // Medellín
  { cedula: '200', nombre: 'Líder Medellín', cargo: Role.LIDER_REGIONAL, regional: 'Medellín' },
  ...Array.from({ length: 4 }, (_, i) => ({ cedula: `20${i+1}`, nombre: `Comercial Medellín ${i+1}`, cargo: Role.COMERCIAL, regional: 'Medellín' })),
  // Barranquilla
  { cedula: '300', nombre: 'Líder Barranquilla', cargo: Role.LIDER_REGIONAL, regional: 'Barranquilla' },
  ...Array.from({ length: 3 }, (_, i) => ({ cedula: `30${i+1}`, nombre: `Comercial Barranquilla ${i+1}`, cargo: Role.COMERCIAL, regional: 'Barranquilla' })),
  // Cali
  { cedula: '400', nombre: 'Líder Cali', cargo: Role.LIDER_REGIONAL, regional: 'Cali' },
  ...Array.from({ length: 3 }, (_, i) => ({ cedula: `40${i+1}`, nombre: `Comercial Cali ${i+1}`, cargo: Role.COMERCIAL, regional: 'Cali' })),
];

const commercialUsers = users.filter(u => u.cargo === Role.COMERCIAL);
const companyNames = [
  "Logística del Caribe SAS", "Transportes Andinos S.A.", "Almacenes Globales", "Distribuciones Veloz",
  "Paquetería Express", "Carga Segura Ltda.", "Soluciones Logísticas Integrales", "Inversiones El Cóndor",
  "Comercializadora La Estrella", "Agropecuaria El Futuro", "Constructora Concreto Sólido", "Tecnología Avanzada de Colombia",
  "Vestimos S.A.", "Café de la Finca Dorada", "Flores de Exportación S.A.S", "Maderas del Oriente",
  "Plásticos Innovadores", "Metales de la Sabana", "Químicos Industriales de Bogotá", "Alimentos Procesados del Valle",
  "Consultores y Asesores Legales", "Servicios Financieros Confianza", "Salud y Bienestar IPS", "Educación Futura Ltda.",
  "Turismo y Aventura Colombia", "Hotel La Candelaria", "Restaurante Sabor Típico", "Marketing Digital Creativo",
  "Importaciones y Exportaciones Global Trade", "Seguridad Privada Centinela", "Energías Renovables del Sol", "Reciclaje EcoAmigo",
  "Desarrollo de Software CodeStream", "Ingeniería y Proyectos Civiles", "Muebles y Diseño Hogar Actual", "Joyería El Diamante Fino",
  "Panadería y Pastelería Delicias", "Lácteos de la Montaña Fresca", "Frutas Tropicales del Trópico", "Carnes Selectas El Ganadero",
  "Ferretería El Tornillo de Oro", "Repuestos Automotrices El Veloz", "Librería El Saber Antiguo", "Juguetería El Mundo Mágico",
  "Cosméticos Belleza Pura", "Farmacia Salud Total", "Óptica Visión Clara", "Clínica Veterinaria Amigo Fiel",
  "Gimnasio Cuerpo Sano", "Academia de Baile Ritmo Latino", "Estudio Fotográfico Captura Momentos", "Agencia de Viajes Mundo Aventura",
  "Taller de Mecánica El Pistón Feliz", "Lavandería Burbujas Limpias", "Floristería Jardín Encantado", "Cervecería Artesanal La Pola Dorada"
];

const generateRandomData = <T,>(count: number, generator: (i: number) => T): T[] => {
  return Array.from({ length: count }, (_, i) => generator(i));
};

export const visits: Visit[] = generateRandomData(300, i => {
  const user = commercialUsers[i % commercialUsers.length];
  const date = new Date();
  date.setDate(date.getDate() - (i % 30));
  
  const hasLocation = i < 5; // Add location only to the first 5 visits for testing
  let latitud, longitud;
  if(hasLocation){
    switch(user.regional){
        case 'Bogotá':
            latitud = 4.60971 + (Math.random() - 0.5) * 0.1;
            longitud = -74.08175 + (Math.random() - 0.5) * 0.1;
            break;
        case 'Medellín':
            latitud = 6.244203 + (Math.random() - 0.5) * 0.1;
            longitud = -75.581215 + (Math.random() - 0.5) * 0.1;
            break;
        default:
            latitud = 4.60971 + (Math.random() - 0.5) * 0.5;
            longitud = -74.08175 + (Math.random() - 0.5) * 0.5;
    }
  }

  return {
    id: `V-${i+1}`,
    cedula_ejecutivo: user.cedula,
    nombre_ejecutivo: user.nombre,
    cliente: companyNames[i % companyNames.length],
    nit: `900123${(i % companyNames.length).toString().padStart(3, '0')}-${i % 9}`,
    direccion: `Calle Falsa 123, ${user.regional}`,
    contacto: `Contacto ${i+1}`,
    telefono: '3001234567',
    correo: `contacto${i+1}@empresa.com`,
    motivo: Object.values(VisitType)[i % 3],
    fecha_hora: date,
    observaciones: 'Visita de seguimiento para revisar nuevas oportunidades de negocio.',
    ...(hasLocation && { latitud, longitud })
  };
});

export const prospects: Prospect[] = generateRandomData(80, i => {
  const user = commercialUsers[i % commercialUsers.length];
  const date = new Date();
  date.setDate(date.getDate() - (i % 60));

  const closingDate = new Date(date);
  closingDate.setDate(closingDate.getDate() + 30 + (i % 90));

  return {
    id: `P-${i+1}`,
    nombre_empresa: `Nuevo Prospecto ${i+1} Corp`,
    nit: `800123${(i % 50).toString().padStart(3, '0')}-${i % 9}`,
    direccion: `Avenida Siempre Viva 742, ${user.regional}`,
    ciudad: user.regional,
    contacto: `Gerente ${i+1}`,
    telefono: '3109876543',
    correo: `gerente${i+1}@prospecto.com`,
    sector: 'Tecnología',
    compromisos: 'Enviar cotización antes del fin de semana.',
    cedula_comercial: user.cedula,
    fecha_registro: date,
    fecha_posible_cierre: closingDate,
    estado: ['Contactado', 'En seguimiento', 'Perdido'][i % 3] as 'Contactado' | 'En seguimiento' | 'Perdido',
  };
});

export const closures: Closure[] = generateRandomData(50, i => {
    const user = commercialUsers[i % commercialUsers.length];
    const date = new Date();
    date.setDate(date.getDate() - (i % 90));
    return {
        id: `C-${i+1}`,
        cliente: companyNames[i % companyNames.length],
        nit: `900123${(i % companyNames.length).toString().padStart(3, '0')}-${i % 9}`,
        direccion: `Carrera 10 # 20 - 30, ${user.regional}`,
        contacto: `Jefe de Compras ${i+1}`,
        telefono: '3201112233',
        correo: `compras${i+1}@cliente.com`,
        tipo_cierre: ['Nuevo', 'Renovación'][i % 2] as 'Nuevo' | 'Renovación',
        cedula_comercial: user.cedula,
        fecha_cierre: date,
        valor: Math.floor(Math.random() * 5000000) + 1000000,
    };
});