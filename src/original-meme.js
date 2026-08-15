// src/original-meme.js
// Original AI Meme Mode (Comedy Director + Image Prompt Planner + Memegen Failover)

import { planMemeResponse, heuristicMemePlanner, validateAndNormalizePlan } from './planner.js';
import { buildMemeUrl } from './memegen.js';

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
  "image_prompt": "Prompt en inglés para generar la escena visual: clean meme composition, dramatic contrast, original characters, no text in image, 1:1 aspect ratio"
}

3. NO pidas texto dentro de la ilustración del image_prompt.
4. Crea situaciones cómicas exageradas pero claras y visualmente legibles.`;

/**
 * Checks if programmatic image generation API is available
 */
export function isImageApiAvailable() {
  const isEnabled = process.env.ENABLE_ORIGINAL_AI === 'true';
  const hasMetaImage = Boolean(process.env.META_IMAGE_API_KEY || process.env.MUSE_IMAGE_API_KEY);
  return isEnabled && hasMetaImage;
}

/**
 * Generates an original meme response
 * Fallback to classic Memegen pipeline if image generation is unavailable or fails
 */
export async function planOriginalAiMeme(userMessage = '') {
  // If image generation is blocked or disabled by feature flag, failover directly to classic pipeline
  if (!isImageApiAvailable()) {
    console.log('[planOriginalAiMeme] Image API unavailable or disabled (ENABLE_ORIGINAL_AI=false), using classic Memegen fallback');
    return planMemeResponse(userMessage);
  }

  try {
    // 1. In future if Muse Image endpoint is active, call image generation API here
    // For now, if no live image generator endpoint responds with image URL, failover cleanly:
    console.warn('[planOriginalAiMeme] No active image diffusion endpoint connected, falling back to classic Memegen');
    return planMemeResponse(userMessage);
  } catch (err) {
    console.error('[planOriginalAiMeme] Error during original AI generation, triggering fail-safe:', err.message);
    return planMemeResponse(userMessage);
  }
}
