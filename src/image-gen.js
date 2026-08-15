// src/image-gen.js
// Multi-Provider AI Image Generation Engine (Pollinations Free Zero-Config + Together AI + Fal.ai + OpenAI)

/**
 * Builds an AI Image Generation URL / payload based on configured keys
 */
export async function generateMemeImage(imagePrompt, seed = Math.floor(Math.random() * 100000)) {
  const togetherKey = process.env.TOGETHER_API_KEY;
  const falKey = process.env.FAL_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // Option 1: Together AI FLUX.1-schnell (Ultra fast ~1s if key configured)
  if (togetherKey && togetherKey.trim()) {
    try {
      const res = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${togetherKey}`
        },
        body: JSON.stringify({
          model: 'black-forest-labs/FLUX.1-schnell',
          prompt: imagePrompt,
          width: 512,
          height: 512,
          steps: 4,
          n: 1,
          response_format: 'url'
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const url = data?.data?.[0]?.url;
        if (url) return { url, provider: 'Together AI (FLUX.1-schnell)' };
      }
    } catch (e) {
      console.warn('[generateMemeImage] Together AI failed, trying next provider:', e.message);
    }
  }

  // Option 2: Fal.ai FLUX.1-schnell (Sub-second if key configured)
  if (falKey && falKey.trim()) {
    try {
      const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Key ${falKey}`
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          image_size: 'square_hd',
          num_inference_steps: 4,
          enable_safety_checker: true
        }),
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const data = await res.json();
        const url = data?.images?.[0]?.url;
        if (url) return { url, provider: 'Fal.ai (FLUX.1-schnell)' };
      }
    } catch (e) {
      console.warn('[generateMemeImage] Fal.ai failed, trying next provider:', e.message);
    }
  }

  // Option 3: Pollinations.ai (100% Free, Zero-Config, FLUX.1 / Turbo engine)
  try {
    const cleanPrompt = encodeURIComponent(imagePrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?model=flux&width=512&height=512&nologo=true&seed=${seed}`;
    
    return {
      url: pollinationsUrl,
      provider: 'Pollinations.ai (FLUX.1 Open)'
    };
  } catch (e) {
    console.error('[generateMemeImage] Pollinations URL builder failed:', e.message);
  }

  return null;
}

/**
 * Creates a clean, composited SVG meme with crisp Impact font captions
 */
export function buildCompositeMemeSvg(imageUrl, topText, bottomText) {
  const sanitizeXml = (str) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const cleanTop = sanitizeXml(topText ? topText.toUpperCase().trim() : '');
  const cleanBottom = sanitizeXml(bottomText ? bottomText.toUpperCase().trim() : '');
  const cleanImgUrl = sanitizeXml(imageUrl);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <style>
      .meme-caption {
        font-family: 'Impact', 'Plus Jakarta Sans', 'Arial Black', sans-serif;
        font-size: 32px;
        font-weight: 900;
        fill: #FFFFFF;
        stroke: #000000;
        stroke-width: 2.8px;
        paint-order: stroke fill;
        text-anchor: middle;
        letter-spacing: 0.5px;
      }
    </style>
  </defs>
  <image href="${cleanImgUrl}" width="512" height="512" preserveAspectRatio="xMidYMid slice" />
  ${cleanTop ? `<text x="256" y="52" class="meme-caption">${cleanTop}</text>` : ''}
  ${cleanBottom ? `<text x="256" y="475" class="meme-caption">${cleanBottom}</text>` : ''}
</svg>`;
}
