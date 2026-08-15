// src/original-meme.js
// Original AI Meme Mode (Comedy Director + Image Prompt Planner + Multi-Provider Image Generator + Memegen Failover)

import { planMemeResponse, extractJsonFromLlmOutput } from './planner.js';
import { generateMemeImage } from './image-gen.js';

const COMEDY_DIRECTOR_PROMPT = `Eres un Comedy Director y Art Director para memes visuales originales.
Tu objetivo es transformar la tragedia o mensaje del usuario en un concepto visual cómico y original para un meme sin usar marcas registradas ni personajes protegidos.

REGLAS ABSOLUTAS:
1. NUNCA generes explicaciones ni texto conversacional.
2. Devuelve EXCLUSIVAMENTE un JSON válido con la siguiente estructura:
{
  "mode": "original",
  "semantic_intent": "sobreingeniería / desastre / etc.",
  "visual_premise": "un desarrollador frente a una pantalla diminuta",
  "visual_twist": "detrás hay un centro de control espacial absurdo",
  "top_text": "Texto superior corto (3-6 palabras)",
  "bottom_text": "Texto inferior corto (3-7 palabras)",
  "image_prompt": "Prompt en inglés para generar la escena visual: funny cartoon meme style, clean composition, dramatic lighting, high contrast, original character, no text in image, square format"
}

3. NO pidas texto dentro de la ilustración del image_prompt.
4. Crea situaciones cómicas exageradas pero claras y visualmente legibles.`;

/**
 * Checks if original AI mode is enabled
 */
export function isImageApiAvailable() {
  return process.env.ENABLE_ORIGINAL_AI === 'true';
}

/**
 * Calls Comedy Director LLM to get a creative visual concept
 */
async function callComedyDirector(userMessage) {
  const groqKey = process.env.GROQ_API_KEY;
  const metaKey = process.env.META_API_KEY || process.env.LLAMA_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  const token = groqKey || openAiKey || metaKey;
  if (!token) return null;

  try {
    const endpoint = groqKey
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions');
    const model = groqKey ? 'llama-3.3-70b-versatile' : (process.env.OPENAI_MODEL || 'gpt-4o-mini');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: COMEDY_DIRECTOR_PROMPT },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 250,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content;
      return extractJsonFromLlmOutput(raw);
    }
  } catch (e) {
    console.warn('[callComedyDirector] LLM call failed:', e.message);
  }

  return null;
}

/**
 * Generates an original meme response
 * Fallback to classic Memegen pipeline if image generation is unavailable or fails
 */
export async function planOriginalAiMeme(userMessage = '') {
  // If original mode is not enabled by feature flag, failover directly to classic pipeline
  if (!isImageApiAvailable()) {
    console.log('[planOriginalAiMeme] ENABLE_ORIGINAL_AI is false, using classic Memegen');
    return planMemeResponse(userMessage);
  }

  try {
    // 1. Direct comedy concept with LLM
    const concept = await callComedyDirector(userMessage);
    const imagePrompt = concept?.image_prompt || `funny cartoon meme illustration about: ${userMessage}, dramatic funny comic, clean vector meme style, no text in image`;
    const topText = concept?.top_text || '';
    const bottomText = concept?.bottom_text || '';

    // 2. Generate original AI image
    const imageResult = await generateMemeImage(imagePrompt);
    if (!imageResult || !imageResult.url) {
      console.warn('[planOriginalAiMeme] Image generation failed, falling back to classic Memegen');
      return planMemeResponse(userMessage);
    }

    // 3. Encode composite URL
    const compositeUrl = `/api/meme-composite?img=${encodeURIComponent(imageResult.url)}&top=${encodeURIComponent(topText)}&bottom=${encodeURIComponent(bottomText)}`;

    // 4. Return strictly visual public payload (no captions or prompts leaked)
    return {
      type: 'image',
      url: compositeUrl,
      template: 'original-ai'
    };
  } catch (err) {
    console.error('[planOriginalAiMeme] Error during original AI generation, triggering fail-safe:', err.message);
    return planMemeResponse(userMessage);
  }
}
