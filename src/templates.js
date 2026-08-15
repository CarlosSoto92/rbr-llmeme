// src/templates.js
// Approved meme template library with semantics and archetypes

export const MEME_TEMPLATES = {
  fine: {
    id: 'fine',
    name: 'This Is Fine',
    archetype: 'Desastre + negación o resignación',
    keywords: ['deploy', 'produccion', 'fuego', 'exploto', 'rompio', 'error', 'bug', 'panico', 'quemo', 'backup', 'borre', 'demo', 'desastre', 'morir', 'tarde', 'crisis'],
  },
  drake: {
    id: 'drake',
    name: 'Drake Hotline Bling',
    archetype: 'Rechazar A / preferir B',
    keywords: ['dormir', 'trabajar', 'estudiar', 'documentacion', 'tests', 'preferir', 'mejor', 'versus', 'elegir', 'optar', 'vago', 'procrastinar'],
  },
  'two-buttons': {
    id: 'two-buttons',
    name: 'Daily Struggle / Two Buttons',
    archetype: 'Dilema imposible',
    keywords: ['decision', 'dilema', 'boton', 'opcion', 'ambos', 'elegir', 'duda', 'programar', 'dormir', 'cafe'],
  },
  pikachu: {
    id: 'pikachu',
    name: 'Surprised Pikachu',
    archetype: 'Consecuencia totalmente predecible que sorprende',
    keywords: ['sorpresa', 'warnings', 'ignore', 'sin probar', 'sin backup', 'esperaba', 'obvio', 'sabia', 'consecuencia'],
  },
  db: {
    id: 'db',
    name: 'Distracted Boyfriend',
    archetype: 'Distracción o abandono de prioridad por algo nuevo',
    keywords: ['distraccion', 'nuevo framework', 'nuevo proyecto', 'abandonar', 'refactor', 'shiny', 'otra cosa', 'olvidar'],
  },
  brain: {
    id: 'brain',
    name: 'Expanding Brain',
    archetype: 'Escalada de sofisticación o absurdo',
    keywords: ['kubernetes', 'excel', 'ia', 'blockchain', 'overkill', 'complicar', 'html', 'database', 'arquitectura', 'complejidad', 'genio'],
  },
  gru: {
    id: 'gru',
    name: "Gru's Plan",
    archetype: 'Plan que falla por su propia lógica',
    keywords: ['plan', 'estrategia', 'salio mal', 'pasos', 'esperar', 'reunion', 'fallo', 'logica'],
  },
  cmm: {
    id: 'cmm',
    name: 'Change My Mind',
    archetype: 'Opinión fuerte / hot take',
    keywords: ['opinar', 'creo', 'excel', 'base de datos', 'lenguaje', 'framework', 'mejor', 'verdad', 'polemica', 'debate', 'cambia mi mente'],
  },
  pigeon: {
    id: 'pigeon',
    name: 'Is This a Pigeon?',
    archetype: 'Confundir algo con otra cosa',
    keywords: ['confundir', 'senior', 'junior', 'feature', 'bug', 'es esto', 'parece', 'confuso'],
  },
  astronaut: {
    id: 'astronaut',
    name: 'Always Has Been',
    archetype: 'Revelación de algo que siempre fue cierto',
    keywords: ['siempre', 'revelacion', 'mentira', 'verdad', 'descubri', 'todo este tiempo', 'realidad', 'secreto'],
  },
  rollsafe: {
    id: 'rollsafe',
    name: 'Roll Safe (Think About It)',
    archetype: 'Lógica absurda pero aparentemente inteligente',
    keywords: ['truco', 'lifehack', 'inteligente', 'sin bugs', 'no pruebas', 'no deploy', 'solucion', 'facil', 'hack'],
  },
  fry: {
    id: 'fry',
    name: 'Futurama Fry / Not Sure If',
    archetype: 'Duda / sospecha entre dos interpretaciones',
    keywords: ['no se si', 'sospecha', 'duda', 'real o fake', 'broma', 'sarcasmo', 'junior o senior', 'bug o feature'],
  },
  doge: {
    id: 'doge',
    name: 'Doge',
    archetype: 'Comentario absurdo, ligero o sarcástico',
    keywords: ['much', 'very', 'wow', 'perro', 'doge', 'meme', 'gracioso', 'random'],
  },
  buzz: {
    id: 'buzz',
    name: 'Buzz Lightyear / Everywhere',
    archetype: 'Algo apareciendo por todas partes',
    keywords: ['por todos lados', 'infinito', 'cambios', 'reuniones', 'bugs', 'emails', 'clientes', 'mensajes', 'muchos'],
  },
  afraid: {
    id: 'afraid',
    name: 'Afraid to Ask Andy',
    archetype: 'No comprender algo básico y tener miedo de preguntar',
    keywords: ['no entiendo', 'miedo', 'preguntar', 'verguenza', 'tarde', 'que es', 'como se usa', 'demasiado tarde'],
  }
};

export const DEFAULT_FALLBACK_EMOJI = '🤯';
export const DEFAULT_FALLBACK_TEMPLATE = 'fine';
