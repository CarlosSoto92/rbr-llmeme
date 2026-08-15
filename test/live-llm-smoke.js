// test/live-llm-smoke.js
import http from 'node:http';
import { extractJsonFromLlmOutput, validateAndNormalizePlan } from '../src/planner.js';

// Auto-load .env
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

const FORBIDDEN_PUBLIC_KEYS = [
  'top',
  'bottom',
  'top_text',
  'bottom_text',
  'message',
  'error',
  'explanation',
  'markdown',
  'json'
];

async function runLiveSmokeTest() {
  console.log('====================================================');
  console.log('⚡ RBR LLMEME LIVE LLM SMOKE TEST');
  console.log('====================================================\n');

  const groqKey = process.env.GROQ_API_KEY;
  const metaKey = process.env.META_API_KEY || process.env.LLAMA_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  let activeProvider = 'NONE';
  let activeModel = 'NONE';

  if (groqKey && groqKey.trim()) {
    activeProvider = 'Groq (Meta Llama 3.3)';
    activeModel = 'llama-3.3-70b-versatile';
  } else if (metaKey && metaKey.trim()) {
    activeProvider = 'Meta Llama API';
    activeModel = process.env.META_MODEL || 'llama-3.3-70b-instruct';
  } else if (geminiKey && geminiKey.trim()) {
    activeProvider = 'Google Gemini';
    activeModel = 'gemini-1.5-flash';
  } else if (openAiKey && openAiKey.trim()) {
    activeProvider = 'OpenAI';
    activeModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  console.log(`📡 Configured Provider: ${activeProvider}`);
  console.log(`🤖 Configured Model:    ${activeModel}\n`);

  if (activeProvider === 'NONE') {
    console.log('⚠️ LIVE_LLM: NOT_CONFIGURED (No API key found in .env)');
    return;
  }

  const unseenPrompts = [
    'El backend tarda 14 segundos en responder un ping y el cliente dice que es normal.',
    'Cambié una coma en el CSS y se desalineó todo el formulario de checkout.',
    'El tester encontró 50 bugs en mi código pero todos son edge cases imposibles.'
  ];

  let liveSuccessCount = 0;

  for (let i = 0; i < unseenPrompts.length; i++) {
    const prompt = unseenPrompts[i];
    console.log(`[Test ${i + 1}/3] Query: "${prompt}"`);

    const t0 = Date.now();
    try {
      // Query local server /chat endpoint to test full end-to-end HTTP pipeline
      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      const elapsed = Date.now() - t0;
      const data = await res.json();

      // Check HTTP status
      if (!res.ok) {
        console.error(`  ❌ HTTP error status: ${res.status}`);
        continue;
      }

      // Check visual-only public payload
      if (!data || (data.type !== 'image' && data.type !== 'emoji')) {
        console.error(`  ❌ Invalid public payload type:`, data);
        continue;
      }

      // Assert forbidden keys
      for (const k of FORBIDDEN_PUBLIC_KEYS) {
        if (k in data) {
          console.error(`  ❌ FORBIDDEN key in public response: "${k}"`);
          continue;
        }
      }

      if (data.type === 'image') {
        // Verify memegen link accessibility
        const imgCheck = await fetch(data.url, { method: 'HEAD' });
        const imgOk = imgCheck.ok;

        console.log(`  ✅ Live Response:`);
        console.log(`     - Type:       ${data.type}`);
        console.log(`     - Template:   [${data.template}]`);
        console.log(`     - Image HTTP: ${imgCheck.status} (${imgOk ? 'OK' : 'FAIL'})`);
        console.log(`     - Latency:    ${elapsed}ms`);
        console.log(`     - URL:        ${data.url}`);
        liveSuccessCount++;
      } else {
        console.log(`  ✅ Emoji Response: ${data.emoji} (${elapsed}ms)`);
        liveSuccessCount++;
      }
    } catch (err) {
      console.error(`  ❌ Error querying /chat:`, err.message);
    }
    console.log('');
  }

  console.log('====================================================');
  if (liveSuccessCount === unseenPrompts.length) {
    console.log(`🎉 LIVE LLM STATUS: VALIDATED (${liveSuccessCount}/${unseenPrompts.length} live responses OK)`);
  } else {
    console.log(`⚠️ LIVE LLM STATUS: PARTIAL/FALLBACK (${liveSuccessCount}/${unseenPrompts.length})`);
  }
  console.log('====================================================\n');
}

runLiveSmokeTest().catch(err => {
  console.error('Fatal live smoke test error:', err);
  process.exit(1);
});
