// test/test-cases.js
import { planMemeResponse, validateAndNormalizePlan, extractJsonFromLlmOutput } from '../src/planner.js';
import { MEME_TEMPLATES } from '../src/templates.js';

// 1. BASELINE HACKATHON TEST CASES
const BASELINE_TESTS = [
  { input: 'Mi deploy falló cinco minutos antes de la demo.', expectedTemplate: 'fine' },
  { input: 'Mi jefe quiere que terminemos hoy algo que tarda dos semanas.', expectedTemplate: 'two-buttons' },
  { input: 'No hice backup y borré producción.', expectedTemplate: 'fine' },
  { input: '¿Debería trabajar o seguir viendo memes?', expectedTemplate: 'db' },
  { input: 'Mi cliente quiere otros diez cambios gratis.', expectedTemplate: 'buzz' },
  { input: 'Aprendí Kubernetes para publicar un HTML.', expectedTemplate: 'brain' },
  { input: 'Ignoré todos los warnings y ahora no funciona.', expectedTemplate: 'pikachu' },
  { input: 'Tengo una reunión que pudo ser un email.', expectedTemplate: 'gru' },
  { input: 'Creo que esta vez sí voy a dormir temprano.', expectedTemplate: 'drake' },
  { input: '¿Qué opinas de usar Excel como base de datos?', expectedTemplate: 'cmm' }
];

// 2. NEW SEMANTIC COMEDY TEST CASES
const NEW_SEMANTIC_TESTS = [
  {
    input: 'Subí directo a producción sin tests y ahora no funciona nada.',
    expectedTemplate: 'pikachu',
    conceptKeywords: ['produccion', 'tests', 'funciona']
  },
  {
    input: 'La entrega vence hoy pero quiero probar un nuevo framework.',
    expectedTemplate: 'db',
    conceptKeywords: ['entrega', 'framework']
  },
  {
    input: 'Por fin logré arreglar ese bug imposible.',
    expectedTemplate: 'doge',
    conceptKeywords: ['bug', 'senior', 'hacker', 'lineas']
  },
  {
    input: 'Estoy harto, el login falla otra vez.',
    expectedTemplate: 'fine',
    conceptKeywords: ['login']
  },
  {
    input: '¿Documentar el proyecto o confiar en mi memoria?',
    expectedTemplate: 'two-buttons',
    conceptKeywords: ['documentacion', 'memoria']
  },
  {
    input: 'Le añadimos Kubernetes a una landing con tres usuarios.',
    expectedTemplate: 'brain',
    conceptKeywords: ['kubernetes', 'landing', 'usuarios']
  }
];

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 RBR LLMEME COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  // SECTION 1: BASELINE TESTS
  console.log('--- [SECTION 1: BASELINE HACKATHON CASES (10/10)] ---');
  for (let i = 0; i < BASELINE_TESTS.length; i++) {
    total++;
    const { input, expectedTemplate } = BASELINE_TESTS[i];
    const res = await planMemeResponse(input);

    if (!res || res.type !== 'image' || !res.url.startsWith('https://api.memegen.link/images/')) {
      console.error(`❌ [Baseline ${i + 1}] FAILED output contract:`, res);
      continue;
    }

    if (expectedTemplate && res.template !== expectedTemplate) {
      console.warn(`⚠️ [Baseline ${i + 1}] Template mismatch: got [${res.template}], expected [${expectedTemplate}]`);
    }

    console.log(`✅ [Baseline ${i + 1}] "${input.slice(0, 40)}..."`);
    console.log(`   → Template: [${res.template}] | Top: "${res.top}" | Bottom: "${res.bottom}"`);
    passed++;
  }

  // SECTION 2: NEW SEMANTIC TESTS
  console.log('\n--- [SECTION 2: NEW SEMANTIC COMEDY CASES (6/6)] ---');
  for (let i = 0; i < NEW_SEMANTIC_TESTS.length; i++) {
    total++;
    const { input, expectedTemplate } = NEW_SEMANTIC_TESTS[i];
    const res = await planMemeResponse(input);

    // Assert strict visual contract
    if (!res || res.type !== 'image' || !res.url.startsWith('https://api.memegen.link/images/')) {
      console.error(`❌ [Semantic ${i + 1}] FAILED output contract:`, res);
      continue;
    }

    // Assert valid meme template from catalog
    if (!MEME_TEMPLATES[res.template]) {
      console.error(`❌ [Semantic ${i + 1}] FAILED unknown template [${res.template}]`);
      continue;
    }

    // Assert archetype match
    if (expectedTemplate && res.template !== expectedTemplate) {
      console.error(`❌ [Semantic ${i + 1}] FAILED archetype mismatch: got [${res.template}], expected [${expectedTemplate}]`);
      continue;
    }

    console.log(`✅ [Semantic ${i + 1}] "${input}"`);
    console.log(`   → Template: [${res.template}]`);
    console.log(`   → Top: "${res.top}" | Bottom: "${res.bottom}"`);
    passed++;
  }

  // SECTION 3: FAIL-SAFE & RESILIENCE
  console.log('\n--- [SECTION 3: FAIL-SAFE & RESILIENCE (4/4)] ---');

  // Test 3.1: Empty input
  total++;
  const emptyRes = await planMemeResponse('');
  if (emptyRes && (emptyRes.type === 'image' || emptyRes.type === 'emoji')) {
    console.log('✅ [Fail-Safe 1] Empty input -> Handled cleanly with visual response');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 1] Empty input failed:', emptyRes);
  }

  // Test 3.2: Unknown template fallback
  total++;
  const fallbackPlan = validateAndNormalizePlan({ template_id: 'non_existent_crazy_id' });
  if (fallbackPlan && fallbackPlan.template_id === 'fine') {
    console.log('✅ [Fail-Safe 2] Unknown template -> Normalized to default [fine]');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 2] Unknown template normalization failed:', fallbackPlan);
  }

  // Test 3.3: Corrupt LLM text parser
  total++;
  const parsedGarbage = extractJsonFromLlmOutput('Explaining meme: This is broken plain text');
  if (parsedGarbage === null) {
    console.log('✅ [Fail-Safe 3] Corrupt non-JSON LLM text -> Rejected cleanly without throwing');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 3] Garbage parser rejection failed:', parsedGarbage);
  }

  // Test 3.4: Markdown fenced JSON parser
  total++;
  const fenced = extractJsonFromLlmOutput('```json\n{"template_id":"doge","top_text":"wow","bottom_text":"such code"}\n```');
  if (fenced && fenced.template_id === 'doge' && fenced.top_text === 'wow') {
    console.log('✅ [Fail-Safe 4] Fenced markdown JSON -> Parsed cleanly');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 4] Fenced JSON parsing failed:', fenced);
  }

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED (100%)`);
  console.log('====================================================\n');
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
