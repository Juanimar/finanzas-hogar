export const GRUPOS = ['Fijos', 'Variables', 'No es gasto'];
export const NO_GASTO = ['Ahorro/Inversión', 'Movimiento interno'];

const CATS = {
  Fijos: ['Vivienda', 'Servicios', 'Servicio doméstico', 'Suscripciones', 'Bancos/Comisiones'],
  Variables: [
    'Supermercado', 'Delivery', 'ComidaSocial', 'Transporte', 'Casa', 'Estética/Cosmética', 'Salud',
    'Diversión', 'Regalos y Cumpleaños', 'Donación', 'Viajes', 'Otros',
  ],
  'No es gasto': NO_GASTO,
};

export const SEED_CATEGORIAS = Object.entries(CATS).flatMap(([grupo, nombres]) =>
  nombres.map(nombre => ({ nombre, grupo, activa: true })),
).map((c, i) => ({ ...c, orden: i + 1 }));

// Patterns are already in normalizeComercio() form (uppercase, no accents, no processor prefixes).
const r = (patron, categoria, descripcion, tipo = 'contiene') => ({ tipo, patron, categoria, descripcion });

export const SEED_REGLAS = [
  r('DEVOTO', 'Supermercado', 'Devoto'),
  r('DISCO', 'Supermercado', 'Disco'),
  r('GEANT', 'Supermercado', 'Géant'),
  r('TIENDA INGLESA', 'Supermercado', 'Tienda Inglesa'),
  r('MACROMERCADO', 'Supermercado', 'Macromercado'),
  r('TA TA', 'Supermercado', 'Ta-Ta'),
  r('TATA', 'Supermercado', 'Ta-Ta'),
  r('EL DORADO', 'Supermercado', 'El Dorado'),
  r('FRESH MARKET', 'Supermercado', 'Fresh Market'),
  r('PEDIDOSYA', 'Delivery', 'PedidosYa'),
  r('RAPPI', 'Delivery', 'Rappi'),
  r('UBER EATS', 'Delivery', 'Uber Eats'),
  r('UBER', 'Transporte', 'Uber'),
  r('CABIFY', 'Transporte', 'Cabify'),
  r('ANCAP', 'Transporte', 'Ancap'),
  r('PETROBRAS', 'Transporte', 'Petrobras'),
  r('AXION', 'Transporte', 'Axion'),
  r('STM', 'Transporte', 'STM', 'exacta'),
  r('UTE', 'Servicios', 'UTE', 'exacta'),
  r('OSE', 'Servicios', 'OSE', 'exacta'),
  r('ANTEL', 'Servicios', 'Antel'),
  r('MOVISTAR', 'Servicios', 'Movistar'),
  r('CLARO', 'Servicios', 'Claro'),
  r('NETFLIX', 'Suscripciones', 'Netflix'),
  r('SPOTIFY', 'Suscripciones', 'Spotify'),
  r('ANTHROPIC', 'Suscripciones', 'Claude'),
  r('OPENAI', 'Suscripciones', 'ChatGPT'),
  r('DISNEY', 'Suscripciones', 'Disney+'),
  r('HBO', 'Suscripciones', 'HBO Max'),
  r('APPLE COM', 'Suscripciones', 'Apple'),
  r('GOOGLE', 'Suscripciones', 'Google'),
  r('YOUTUBE', 'Suscripciones', 'YouTube'),
  r('SAN ROQUE', 'Salud', 'San Roque'),
  r('FARMASHOP', 'Salud', 'Farmashop'),
  r('FARMACIA', 'Salud', 'Farmacia'),
  r('STARBUCKS', 'ComidaSocial', 'Starbucks'),
  r('FREDDO', 'ComidaSocial', 'Freddo'),
  r('MERCADOLIBRE', 'Casa', 'Mercado Libre'),
  r('FROG', 'Casa', 'Frog'),
  r('SODIMAC', 'Casa', 'Sodimac'),
  r('MIDINERO', 'Servicio doméstico', 'Midinero'),
];
