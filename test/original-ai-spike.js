// test/original-ai-spike.js
import { planOriginalAiMeme } from '../src/original-meme.js';

// Auto-load .env
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

const SPIKE_PROMPTS = [
  'El café se acabó durante el incidente.',
  'Construimos doce microservicios para tres usuarios.',
  'El cliente pidió otro pequeño cambio.',
  'La IA escribió el código y nadie sabe cómo funciona.',
  'Finalmente conseguimos nuestro primer cliente.'
];

async function runSpike() {
  process.env.ENABLE_ORIGINAL_AI = 'true';
  console.log('====================================================');
  console.log('✨ ORIGINAL AI MEME SPIKE TEST (5/5)');
  console.log('====================================================\n');

  let passed = 0;

  for (let i = 0; i < SPIKE_PROMPTS.length; i++) {
    const prompt = SPIKE_PROMPTS[i];
    const t0 = Date.now();
    const res = await planOriginalAiMeme(prompt);
    const ms = Date.now() - t0;

    console.log(`[Spike ${i + 1}/5] Prompt: "${prompt}"`);
    console.log(`  - Output Type:      ${res.type}`);
    console.log(`  - Template ID:      [${res.template}]`);
    console.log(`  - Latency:          ${ms}ms`);
    console.log(`  - Public URL:       ${res.url}`);

    // Strict assertions
    const isValid = res && res.type === 'image' && (res.url.startsWith('/api/meme-composite') || res.url.startsWith('https://'));
    const hasNoForbiddenKeys = !('top' in res) && !('bottom' in res) && !('prompt' in res);

    if (isValid && hasNoForbiddenKeys) {
      console.log('  ✅ Visual-only contract & URL valid\n');
      passed++;
    } else {
      console.error('  ❌ Failed validation\n');
    }
  }

  console.log('====================================================');
  console.log(`🎉 SPIKE RESULTS: ${passed}/${SPIKE_PROMPTS.length} COMPLETED`);
  console.log('====================================================\n');
}

runSpike().catch(err => {
  console.error('Fatal spike error:', err);
  process.exit(1);
});
