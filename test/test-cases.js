// test/test-cases.js
import {
  heuristicMemePlanner,
  planMemeResponse,
  validateAndNormalizePlan,
  extractJsonFromLlmOutput,
  normalizeSemanticText
} from '../src/planner.js';
import { MEME_TEMPLATES } from '../src/templates.js';

// Forbidden keys that must NEVER exist in any public bot payload
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

// SECTION 1: 10 BASELINE HACKATHON CASES
const BASELINE_CASES = [
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

// SECTION 2: 6 NEW SEMANTIC CASES (Validated directly on internal plan for concept relevance)
const SEMANTIC_CASES = [
  {
    input: 'Subí directo a producción sin tests y ahora no funciona nada.',
    expectedTemplate: 'pikachu',
    conceptGroups: [['produccion', 'prod'], ['tests', 'test'], ['sorprendo', 'funciona', 'nada']]
  },
  {
    input: 'La entrega vence hoy pero quiero probar un nuevo framework.',
    expectedTemplate: 'db',
    conceptGroups: [['entrega', 'tarea', 'tiempo'], ['framework', 'aprender']]
  },
  {
    input: 'Por fin logré arreglar ese bug imposible.',
    expectedTemplate: 'doge',
    conceptGroups: [['lineas', 'bug', 'codigo'], ['senior', 'hacker', 'much', 'very']]
  },
  {
    input: 'Estoy harto, el login falla otra vez.',
    expectedTemplate: 'fine',
    conceptGroups: [['login'], ['romperse', 'falla', 'autenticarse', 'entrar']]
  },
  {
    input: '¿Documentar el proyecto o confiar en mi memoria?',
    expectedTemplate: 'two-buttons',
    conceptGroups: [['documentacion', 'documentar'], ['memoria']]
  },
  {
    input: 'Le añadimos Kubernetes a una landing con tres usuarios.',
    expectedTemplate: 'brain',
    conceptGroups: [['servidor', 'visitas', 'usuarios', 'estatico'], ['kubernetes', 'k8s', 'cluster']]
  }
];

function assertNoForbiddenKeys(obj, contextName) {
  for (const key of FORBIDDEN_PUBLIC_KEYS) {
    if (key in obj) {
      throw new Error(`[${contextName}] FORBIDDEN text key "${key}" detected in public payload!`);
    }
  }
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 RBR LLMEME RIGOROUS TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  // --- SECTION 1: BASELINE CASES (Public Output & Template Strict Matching) ---
  console.log('--- [SECTION 1: BASELINE HACKATHON CASES] ---');
  for (let i = 0; i < BASELINE_CASES.length; i++) {
    total++;
    const { input, expectedTemplate } = BASELINE_CASES[i];
    try {
      const res = await planMemeResponse(input);

      // Check visual-only payload
      if (!res || (res.type !== 'image' && res.type !== 'emoji')) {
        console.error(`❌ [Baseline ${i + 1}] FAILED: Invalid response structure`, res);
        continue;
      }

      // Check forbidden text keys
      assertNoForbiddenKeys(res, `Baseline ${i + 1}`);

      // Check image URL
      if (res.type === 'image' && !res.url.startsWith('https://api.memegen.link/images/')) {
        console.error(`❌ [Baseline ${i + 1}] FAILED: URL is not memegen`, res.url);
        continue;
      }

      // Check strict template matching
      if (expectedTemplate && res.template !== expectedTemplate) {
        console.error(`❌ [Baseline ${i + 1}] FAILED template mismatch: got [${res.template}], expected [${expectedTemplate}]`);
        continue;
      }

      console.log(`✅ [Baseline ${i + 1}] "${input.slice(0, 42)}..." -> [${res.template}]`);
      passed++;
    } catch (err) {
      console.error(`❌ [Baseline ${i + 1}] FAILED with exception:`, err.message);
    }
  }

  // --- SECTION 2: SEMANTIC RELEVANCE ON INTERNAL PLAN (conceptKeywords assertion) ---
  console.log('\n--- [SECTION 2: INTERNAL SEMANTIC PLAN RELEVANCE] ---');
  for (let i = 0; i < SEMANTIC_CASES.length; i++) {
    total++;
    const { input, expectedTemplate, conceptGroups } = SEMANTIC_CASES[i];
    try {
      // 1. Check internal heuristic plan
      const internalPlan = heuristicMemePlanner(input);
      if (!internalPlan || internalPlan.template_id !== expectedTemplate) {
        console.error(`❌ [Semantic ${i + 1}] FAILED internal template: got [${internalPlan?.template_id}], expected [${expectedTemplate}]`);
        continue;
      }

      const combinedCaptions = normalizeSemanticText(`${internalPlan.top_text} ${internalPlan.bottom_text}`);

      // Assert that at least one keyword from each expected concept group is present in the internal captions
      let conceptMatch = true;
      for (const group of conceptGroups) {
        const found = group.some(kw => combinedCaptions.includes(normalizeSemanticText(kw)));
        if (!found) {
          console.error(`❌ [Semantic ${i + 1}] FAILED missing concept group [${group.join(', ')}] in captions: "${combinedCaptions}"`);
          conceptMatch = false;
          break;
        }
      }

      if (!conceptMatch) continue;

      // 2. Check public payload (must remain strictly visual without captions)
      const publicPayload = await planMemeResponse(input);
      assertNoForbiddenKeys(publicPayload, `Semantic ${i + 1} Public`);
      if (publicPayload.type !== 'image' || !MEME_TEMPLATES[publicPayload.template]) {
        console.error(`❌ [Semantic ${i + 1}] FAILED public payload structure`);
        continue;
      }

      console.log(`✅ [Semantic ${i + 1}] "${input.slice(0, 45)}..." -> [${internalPlan.template_id}] (Concepts OK)`);
      passed++;
    } catch (err) {
      console.error(`❌ [Semantic ${i + 1}] FAILED with exception:`, err.message);
    }
  }

  // --- SECTION 3: FAIL-SAFE & BOUNDARY TESTS ---
  console.log('\n--- [SECTION 3: FAIL-SAFE & EDGE CASES] ---');

  // Test 3.1: Empty plan {} must be rejected by validator
  total++;
  const emptyPlanValidation = validateAndNormalizePlan({});
  if (emptyPlanValidation === null) {
    console.log('✅ [Fail-Safe 1] Empty plan {} rejected cleanly with null');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 1] FAILED: Empty plan was accepted as valid:', emptyPlanValidation);
  }

  // Test 3.2: Empty captions must be rejected
  total++;
  const emptyCaptionsValidation = validateAndNormalizePlan({ template_id: 'fine', top_text: '', bottom_text: '' });
  if (emptyCaptionsValidation === null) {
    console.log('✅ [Fail-Safe 2] Empty captions rejected cleanly with null');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 2] FAILED: Empty captions were accepted:', emptyCaptionsValidation);
  }

  // Test 3.3: Unknown template with valid captions normalizes to approved fallback template
  total++;
  const unknownTemplatePlan = validateAndNormalizePlan({
    template_id: 'non_existent_template_xyz',
    top_text: 'Top caption',
    bottom_text: 'Bottom caption'
  });
  if (unknownTemplatePlan && unknownTemplatePlan.template_id === 'fine') {
    console.log('✅ [Fail-Safe 3] Unknown template with valid captions normalized to approved [fine]');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 3] FAILED: Unknown template normalization error:', unknownTemplatePlan);
  }

  // Test 3.4: LLM non-JSON parser rejection
  total++;
  const garbageParse = extractJsonFromLlmOutput('Here is your explanation: this is plain text');
  if (garbageParse === null) {
    console.log('✅ [Fail-Safe 4] Garbage text rejected cleanly by extractJsonFromLlmOutput');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 4] FAILED: Garbage parsed as JSON:', garbageParse);
  }

  // Test 3.5: Fenced markdown JSON parsed cleanly
  total++;
  const fencedParse = extractJsonFromLlmOutput('```json\n{"template_id":"doge","top_text":"wow","bottom_text":"such meme"}\n```');
  if (fencedParse && fencedParse.template_id === 'doge' && fencedParse.top_text === 'wow') {
    console.log('✅ [Fail-Safe 5] Fenced JSON parsed cleanly');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 5] FAILED: Fenced JSON parsing error:', fencedParse);
  }

  // Test 3.6: Empty user input public response
  total++;
  const emptyInputRes = await planMemeResponse('');
  assertNoForbiddenKeys(emptyInputRes, 'Empty Input Public');
  if (emptyInputRes && (emptyInputRes.type === 'image' || emptyInputRes.type === 'emoji')) {
    console.log('✅ [Fail-Safe 6] Empty input handled cleanly with visual output');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 6] FAILED: Empty input handling:', emptyInputRes);
  }

  // Test 3.7: Public payload forbidden keys assertion
  total++;
  const sampleRes = await planMemeResponse('Mi deploy explotó');
  const hasForbiddenKey = FORBIDDEN_PUBLIC_KEYS.some(k => k in sampleRes);
  if (!hasForbiddenKey && !('top' in sampleRes) && !('bottom' in sampleRes)) {
    console.log('✅ [Fail-Safe 7] Strict visual-only contract verified (no captions or text keys in public response)');
    passed++;
  } else {
    console.error('❌ [Fail-Safe 7] FAILED: Captions or forbidden keys leaked into public response:', sampleRes);
  }

  // Test 3.8: Original AI Mode Fallback Gate
  total++;
  const { planOriginalAiMeme, isImageApiAvailable } = await import('../src/original-meme.js');
  const originalRes = await planOriginalAiMeme('Construimos doce microservicios para tres usuarios.');
  assertNoForbiddenKeys(originalRes, 'Original AI Fallback Public');
  if (originalRes && (originalRes.type === 'image' || originalRes.type === 'emoji')) {
    console.log(`✅ [Fail-Safe 8] Original AI Mode gated & failover verified (isImageApiAvailable=${isImageApiAvailable()})`);
    passed++;
  } else {
    console.error('❌ [Fail-Safe 8] FAILED: Original AI failover:', originalRes);
  }

  // --- FINAL SUMMARY & EXIT CODE CALCULATION ---
  const percentage = total === 0 ? 0 : Math.round((passed / total) * 100);
  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed}/${total} PASSED (${percentage}%)`);
  console.log('====================================================\n');

  if (passed !== total) {
    console.error(`🚨 TEST SUITE FAILED: ${total - passed} test(s) did not pass.`);
    process.exitCode = 1;
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test runner exception:', err);
  process.exit(1);
});
