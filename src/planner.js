// src/planner.js
import { MEME_TEMPLATES, DEFAULT_FALLBACK_EMOJI, DEFAULT_FALLBACK_TEMPLATE } from './templates.js';
import { buildMemeUrl } from './memegen.js';

const SYSTEM_PROMPT = `Eres un Senior Meme Planner y Comedy Editor para un bot de hackathon llamado LLMeme.
Tu objetivo es transformar el mensaje del usuario en un meme gracioso, semánticamente relevante y con punch cómico.

REGLAS ABSOLUTAS:
1. NUNCA devuelvas explicaciones, saludos ni texto conversacional.
2. Devuelve EXCLUSIVAMENTE un objeto JSON válido con las claves: template_id, top_text, bottom_text, fallback_emoji.
3. template_id DEBE ser uno de los 15 IDs permitidos:
   ${Object.keys(MEME_TEMPLATES).join(', ')}

PRINCIPIOS DE COMEDIA Y ESTRUCTURA DE MEME:
1. COMPRENSIÓN SEMÁNTICA: Responde al significado e intención real del mensaje, reutilizando sustantivos o conceptos clave del usuario (ej. "login", "Kubernetes", "deploy", "tests", "framework").
2. CONSTRUCCIÓN EN DOS TIEMPOS:
   - TOP: Premisa, expectativa o acción inicial (3-6 palabras).
   - BOTTOM: Contradicción, consecuencia obvia, exageración o remate cómico (3-7 palabras).
3. EVITA REPETICIONES: No copies ni parafrasees exactamente lo mismo arriba y abajo.
4. EVITA RESPUESTAS GENÉRICAS: Nunca uses clichés como "todo va a estar bien" o "parece complicado". El chiste debe ser específico al contexto.
5. IDIOMA: Mantén el idioma del usuario (español si escribe en español, inglés si en inglés).

MAPA DE ARQUETIPOS Y PLANTILLAS:
- pikachu: Acción imprudente / omitir buenas prácticas (arriba) + sorpresa ante el desastre predecible (abajo).
- fine: Crisis inminente / desastre total (arriba) + resignación fingiendo normalidad (abajo).
- two-buttons: Dilema o conflicto entre dos decisiones reales y opuestas.
- db: Prioridad o tarea urgente ignorada (arriba) por una tentación o distracción brillante (abajo).
- brain: Solución simple y sensata (arriba) vs sobreingeniería absurdamente compleja (abajo).
- doge: Pequeña victoria o logro cotidiano (arriba) celebrado con ego o satisfacción exagerada (abajo).
- rollsafe: Lógica absurda o 'lifehack' dudoso presentado como genialidad.
- gru: Plan con pasos lógicos que falla inevitablemente en el último paso.
- cmm: Opinión polémica, controversial o hot take definitiva.
- drake: Rechazar la opción correcta o sana (arriba) / Elegir la opción caótica o procrastinadora (abajo).
- fry: Duda genuina o sospecha entre dos interpretaciones posibles.
- pigeon: Confusión flagrante entre un concepto básico y otro totalmente equivocado.
- astronaut: Revelación de que una verdad oculta siempre estuvo presente.
- buzz: Algo multiplicándose descontroladamente por todas partes.
- afraid: No entender algo fundamental y tener demasiado miedo de preguntar a estas alturas.

FORMATO JSON ESTRICTO:
{
  "template_id": "pikachu",
  "top_text": "Subo a producción sin correr tests",
  "bottom_text": "Se cae la app y me sorprendo",
  "fallback_emoji": "⚡"
}`;

/**
 * Normalizes input text for resilient semantic matching
 */
export function normalizeSemanticText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * High-quality heuristic semantic planner for offline / mock / backup
 */
export function heuristicMemePlanner(userMessage = '') {
  const norm = normalizeSemanticText(userMessage);
  if (!norm) {
    return {
      template_id: 'rollsafe',
      top_text: 'No envías ningún mensaje',
      bottom_text: 'No puedes recibir errores',
      fallback_emoji: DEFAULT_FALLBACK_EMOJI
    };
  }

  // 1. Sobreingeniería / Complejidad absurda (brain)
  // Ej: "Le añadimos Kubernetes a una landing con tres usuarios", "Aprendí Kubernetes para publicar un HTML"
  if (norm.includes('kubernetes') || norm.includes('k8s') || norm.includes('microservicios') || norm.includes('blockchain')) {
    if (norm.includes('landing') || norm.includes('tres usuarios') || norm.includes('3 usuarios') || norm.includes('pocos usuarios')) {
      return {
        template_id: 'brain',
        top_text: 'Servidor web básico para 3 visitas',
        bottom_text: 'Cluster de Kubernetes multi-region',
        fallback_emoji: '🧠'
      };
    }
    if (norm.includes('html') || norm.includes('estatico') || norm.includes('publicar')) {
      return {
        template_id: 'brain',
        top_text: 'Subir HTML con FTP',
        bottom_text: 'Cluster de Kubernetes multi-cloud',
        fallback_emoji: '🧠'
      };
    }
    return {
      template_id: 'brain',
      top_text: 'Resolver el problema con 2 líneas',
      bottom_text: 'Arquitectura distribuida en Kubernetes',
      fallback_emoji: '🧠'
    };
  }

  // 2. Acción imprudente + Desastre predecible (pikachu)
  // Ej: "Subí directo a producción sin tests y ahora no funciona nada", "Ignoré todos los warnings y ahora no funciona"
  if (
    (norm.includes('sin tests') && (norm.includes('produccion') || norm.includes('funciona') || norm.includes('rompio') || norm.includes('subi'))) ||
    (norm.includes('warning') && (norm.includes('ignore') || norm.includes('funciona'))) ||
    (norm.includes('sin probar') && norm.includes('rompio'))
  ) {
    if (norm.includes('warning')) {
      return {
        template_id: 'pikachu',
        top_text: 'Ignoro 450 warnings en consola',
        bottom_text: 'La app explota en producción',
        fallback_emoji: '⚡'
      };
    }
    return {
      template_id: 'pikachu',
      top_text: 'Subo directo a producción sin tests',
      bottom_text: 'Nada funciona y me sorprendo',
      fallback_emoji: '⚡'
    };
  }

  // 3. Distracción / Nueva tentación vs Tarea urgente (db)
  // Ej: "La entrega vence hoy pero quiero probar un nuevo framework", "¿Debería trabajar o seguir viendo memes?"
  if (
    (norm.includes('vence hoy') || norm.includes('entrega') || norm.includes('deadline') || norm.includes('tarea')) &&
    (norm.includes('framework') || norm.includes('nueva lib') || norm.includes('refactor') || norm.includes('probar'))
  ) {
    return {
      template_id: 'db',
      top_text: 'Entregar a tiempo la tarea',
      bottom_text: 'Aprender un nuevo framework',
      fallback_emoji: '👀'
    };
  }
  if (norm.includes('trabajar') && (norm.includes('memes') || norm.includes('redes') || norm.includes('procrastinar'))) {
    return {
      template_id: 'db',
      top_text: 'Avanzar los pendientes',
      bottom_text: 'Seguir viendo memes',
      fallback_emoji: '👀'
    };
  }

  // 4. Pequeña victoria con ego exagerado (doge)
  // Ej: "Por fin logré arreglar ese bug imposible."
  if (
    (norm.includes('por fin') || norm.includes('logre') || norm.includes('arregle') || norm.includes('solucione')) &&
    (norm.includes('bug') || norm.includes('imposible') || norm.includes('error') || norm.includes('despues de'))
  ) {
    return {
      template_id: 'doge',
      top_text: 'Borré 3 líneas al azar',
      bottom_text: 'Much senior engineer, very hacker',
      fallback_emoji: '🐕'
    };
  }

  // 5. Crisis / Frustración repetida / Resignación (fine)
  // Ej: "Estoy harto, el login falla otra vez", "Mi deploy falló cinco minutos antes de la demo", "No hice backup y borré producción"
  if (norm.includes('login') && (norm.includes('falla') || norm.includes('harto') || norm.includes('rompio') || norm.includes('otra vez'))) {
    return {
      template_id: 'fine',
      top_text: 'El login volvió a romperse',
      bottom_text: 'Nadie necesita autenticarse hoy',
      fallback_emoji: '🔥'
    };
  }
  if (norm.includes('deploy') || (norm.includes('fallo') && norm.includes('demo')) || norm.includes('exploto')) {
    return {
      template_id: 'fine',
      top_text: 'El deploy explotó',
      bottom_text: 'La demo empieza en 5 minutos',
      fallback_emoji: '🔥'
    };
  }
  if ((norm.includes('backup') && norm.includes('produccion')) || norm.includes('borre produccion') || norm.includes('drop database') || norm.includes('drop table')) {
    return {
      template_id: 'fine',
      top_text: 'Borré producción sin backup',
      bottom_text: 'Fue un honor programar con ustedes',
      fallback_emoji: '🔥'
    };
  }

  // 6. Dilema entre dos decisiones difíciles (two-buttons)
  // Ej: "¿Documentar el proyecto o confiar en mi memoria?", "Mi jefe quiere que terminemos hoy algo que tarda dos semanas."
  if (norm.includes('documentar') && (norm.includes('memoria') || norm.includes('confiar') || norm.includes('codigo'))) {
    return {
      template_id: 'two-buttons',
      top_text: 'Escribir la documentación',
      bottom_text: 'Confiar en mi memoria de pez',
      fallback_emoji: '😰'
    };
  }
  if (norm.includes('jefe') || norm.includes('dos semanas') || norm.includes('2 semanas') || norm.includes('terminemos hoy') || norm.includes('para hoy')) {
    return {
      template_id: 'two-buttons',
      top_text: 'Hacerlo bien en 2 semanas',
      bottom_text: 'Parchear todo para hoy',
      fallback_emoji: '😰'
    };
  }

  // 7. Rechazar lo sano / Elegir lo caótico (drake)
  // Ej: "Creo que esta vez sí voy a dormir temprano."
  if (norm.includes('dormir temprano') || (norm.includes('dormir') && norm.includes('programando'))) {
    return {
      template_id: 'drake',
      top_text: 'Dormir 8 horas temprano',
      bottom_text: 'Ver memes y codear hasta las 4am',
      fallback_emoji: '😴'
    };
  }

  // 8. Opinión polémica / Hot take (cmm)
  // Ej: "¿Qué opinas de usar Excel como base de datos?"
  if (norm.includes('excel') && (norm.includes('base de datos') || norm.includes('database') || norm.includes('db'))) {
    return {
      template_id: 'cmm',
      top_text: 'Excel es la base de datos',
      bottom_text: 'Más usada del mundo. Change my mind.',
      fallback_emoji: '📊'
    };
  }

  // 9. Reunión innecesaria / Plan fallido (gru)
  // Ej: "Tengo una reunión que pudo ser un email."
  if (norm.includes('reunion') && (norm.includes('email') || norm.includes('correo') || norm.includes('slack'))) {
    return {
      template_id: 'gru',
      top_text: 'Agendar reunión de 2 horas',
      bottom_text: 'El tema era un sí o no',
      fallback_emoji: '☕'
    };
  }

  // 10. Exceso descontrolado / Inundación (buzz)
  // Ej: "Mi cliente quiere otros diez cambios gratis."
  if (norm.includes('cliente') && (norm.includes('cambios') || norm.includes('gratis') || norm.includes('ajustes'))) {
    return {
      template_id: 'buzz',
      top_text: 'Cambios de alcance gratis',
      bottom_text: 'Cambios gratis everywhere',
      fallback_emoji: '🤡'
    };
  }

  // 11. Lógica absurda / Lifehack dudoso (rollsafe)
  // Ej: "No escribas tests para no encontrar bugs"
  if (norm.includes('truco') || norm.includes('lifehack') || norm.includes('no hay bugs') || norm.includes('no compilar') || norm.includes('no puedes tener')) {
    return {
      template_id: 'rollsafe',
      top_text: 'No puedes tener bugs',
      bottom_text: 'Si nunca compilas el código',
      fallback_emoji: '👉'
    };
  }

  // 12. Miedo a preguntar algo básico (afraid)
  if (norm.includes('miedo') || norm.includes('verguenza') || (norm.includes('no se que') && norm.includes('preguntar'))) {
    return {
      template_id: 'afraid',
      top_text: 'No sé qué hace esta línea',
      bottom_text: 'Y tengo miedo de preguntar',
      fallback_emoji: '👀'
    };
  }

  // 13. Duda o sospecha (fry)
  if (userMessage.startsWith('¿') || userMessage.startsWith('?') || norm.includes('no se si') || norm.includes(' o ') || norm.includes(' vs ')) {
    return {
      template_id: 'fry',
      top_text: 'No sé si es una gran idea',
      bottom_text: 'O el inicio de una tragedia',
      fallback_emoji: '🤔'
    };
  }

  // 14. Fallback semántico mejorado (honesto, sin fingir comprensión de crisis falsa)
  return {
    template_id: 'rollsafe',
    top_text: 'Si el código compila',
    bottom_text: 'No preguntes cómo ni por qué',
    fallback_emoji: '👉'
  };
}

/**
 * Validates and normalizes planner JSON
 * Returns null if the plan is missing required fields, empty captions, or invalid types.
 */
export function validateAndNormalizePlan(rawJson) {
  if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    return null;
  }

  // Must have template_id as a non-empty string
  if (!rawJson.template_id || typeof rawJson.template_id !== 'string') {
    return null;
  }

  // Must have top_text and bottom_text as non-empty strings
  if (typeof rawJson.top_text !== 'string' || typeof rawJson.bottom_text !== 'string') {
    return null;
  }

  const top_text = rawJson.top_text.trim();
  const bottom_text = rawJson.bottom_text.trim();

  // Empty captions are invalid
  if (!top_text || !bottom_text || top_text === '_' && bottom_text === '_') {
    return null;
  }

  // Limit max caption length
  if (top_text.length > 120 || bottom_text.length > 120) {
    return null;
  }

  let template_id = rawJson.template_id.toLowerCase().trim();
  if (!MEME_TEMPLATES[template_id]) {
    // Map close synonyms or fallback to default approved template
    if (template_id === 'distracted' || template_id === 'distracted-boyfriend') template_id = 'db';
    else if (template_id === 'change-my-mind') template_id = 'cmm';
    else if (template_id === 'buttons') template_id = 'two-buttons';
    else if (template_id === 'expanding-brain') template_id = 'brain';
    else if (template_id === 'think-about-it') template_id = 'rollsafe';
    else template_id = DEFAULT_FALLBACK_TEMPLATE;
  }

  const fallback_emoji = (typeof rawJson.fallback_emoji === 'string' && rawJson.fallback_emoji.trim())
    ? rawJson.fallback_emoji.trim()
    : DEFAULT_FALLBACK_EMOJI;

  return {
    template_id,
    top_text,
    bottom_text,
    fallback_emoji
  };
}

/**
 * Parses JSON response from LLM output string
 */
export function extractJsonFromLlmOutput(text) {
  if (!text) return null;
  try {
    // Clean markdown code blocks if present
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Match first {...} block
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('[extractJsonFromLlmOutput] Parse error:', err.message);
  }
  return null;
}

/**
 * Calls LLM (Meta Llama, Gemini, OpenAI, Groq, etc.) if keys are configured
 */
async function callLlmApi(userMessage) {
  const groqKey = process.env.GROQ_API_KEY;
  const metaKey = process.env.META_API_KEY || process.env.LLAMA_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // 1. Groq (Fastest Meta Llama 3.3 70B provider)
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 200,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data?.choices?.[0]?.message?.content;
        const parsed = extractJsonFromLlmOutput(rawContent);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn('[callLlmApi] Groq failed, falling back:', e.message);
    }
  }

  // 2. Direct Meta / Llama API (if configured with custom base or direct endpoint)
  if (metaKey) {
    try {
      const endpoint = process.env.META_API_BASE || process.env.LLAMA_API_BASE || 'https://api.llama.com/v1/chat/completions';
      const model = process.env.META_MODEL || 'llama-3.3-70b-instruct';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${metaKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 200,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data?.choices?.[0]?.message?.content;
        const parsed = extractJsonFromLlmOutput(rawContent);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn('[callLlmApi] Meta API failed, falling back:', e.message);
    }
  }

  // 3. Google Gemini API
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nMensaje del usuario: "${userMessage}"` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
          maxOutputTokens: 256
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = extractJsonFromLlmOutput(candidate);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn('[callLlmApi] Gemini failed, falling back:', e.message);
    }
  }

  // 4. OpenAI API
  if (openAiKey) {
    try {
      const endpoint = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 200,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const data = await res.json();
        const rawContent = data?.choices?.[0]?.message?.content;
        const parsed = extractJsonFromLlmOutput(rawContent);
        if (parsed) return parsed;
      }
    } catch (e) {
      console.warn('[callLlmApi] OpenAI failed:', e.message);
    }
  }

  return null;
}

/**
 * Main Meme Planning function
 * Strictly guarantees a valid visual response (image URL or emoji)
 * NEVER exposes top/bottom captions, explanations, or error messages in public payload.
 */
export async function planMemeResponse(userMessage = '') {
  try {
    let validPlan = null;

    // 1. Try LLM API first if configured
    try {
      const rawLlmPlan = await callLlmApi(userMessage);
      if (rawLlmPlan) {
        validPlan = validateAndNormalizePlan(rawLlmPlan);
        if (!validPlan) {
          console.warn('[planMemeResponse] LLM returned invalid plan structure, falling back to heuristic planner');
        }
      }
    } catch (llmErr) {
      console.warn('[planMemeResponse] LLM call failed, using comedy heuristic planner:', llmErr.message);
    }

    // 2. Fallback to intelligent heuristic planner if LLM was unavailable or invalid
    if (!validPlan) {
      const heuristicPlan = heuristicMemePlanner(userMessage);
      validPlan = validateAndNormalizePlan(heuristicPlan);
    }

    // 3. Absolute fail-safe if both somehow failed to produce a valid plan
    if (!validPlan) {
      return {
        type: 'emoji',
        emoji: DEFAULT_FALLBACK_EMOJI
      };
    }

    // 4. Build Memegen URL
    const memeUrl = buildMemeUrl(validPlan.template_id, validPlan.top_text, validPlan.bottom_text);

    // 5. PUBLIC PAYLOAD: STRICTLY VISUAL-ONLY (type, url, template - NO CAPTIONS)
    return {
      type: 'image',
      url: memeUrl,
      template: validPlan.template_id
    };
  } catch (err) {
    console.error('[planMemeResponse] Critical fail-safe triggered:', err.message);
    return {
      type: 'emoji',
      emoji: DEFAULT_FALLBACK_EMOJI
    };
  }
}
