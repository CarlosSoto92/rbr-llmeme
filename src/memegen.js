// src/memegen.js

/**
 * Sanitizes caption text strictly according to Memegen API rules
 * See: https://memegen.link/
 */
export function sanitizeForMemegen(text) {
  if (!text || typeof text !== 'string') return '_';
  let t = text.trim();
  if (!t) return '_';

  // Memegen special character mapping:
  // _ -> __
  // - -> --
  // space -> _
  // ? -> ~q
  // % -> ~p
  // # -> ~h
  // / -> ~s
  // \ -> ~b
  // < -> ~l
  // > -> ~g
  // " -> ''
  // ' -> ''
  // \n -> ~n
  t = t
    .replace(/_/g, '__')
    .replace(/-/g, '--')
    .replace(/\s+/g, '_')
    .replace(/\?/g, '~q')
    .replace(/%/g, '~p')
    .replace(/#/g, '~h')
    .replace(/\//g, '~s')
    .replace(/\\/g, '~b')
    .replace(/</g, '~l')
    .replace(/>/g, '~g')
    .replace(/"/g, "''")
    .replace(/'/g, "''")
    .replace(/\n/g, '~n');

  return encodeURIComponent(t)
    .replace(/%7Eq/gi, '~q')
    .replace(/%7Ep/gi, '~p')
    .replace(/%7Eh/gi, '~h')
    .replace(/%7Es/gi, '~s')
    .replace(/%7Eb/gi, '~b')
    .replace(/%7El/gi, '~l')
    .replace(/%7Eg/gi, '~g')
    .replace(/%7En/gi, '~n')
    .replace(/%27%27/g, "''")
    .replace(/%20/g, '_');
}

const MEMEGEN_KEY_MAP = {
  'two-buttons': 'ds',        // Daily Struggle (Two Buttons)
  'brain': 'gb',              // Galaxy Brain (Expanding Brain)
  'pikachu': 'disastergirl'   // Consequence / surprise / disaster
};

/**
 * Constructs a valid Memegen image URL
 */
export function buildMemeUrl(templateId, topText, bottomText, extension = 'png') {
  const cleanTemplate = (templateId || 'fine').toLowerCase().trim();
  const apiTemplateKey = MEMEGEN_KEY_MAP[cleanTemplate] || cleanTemplate;
  const cleanTop = sanitizeForMemegen(topText);
  const cleanBottom = sanitizeForMemegen(bottomText);
  return `https://api.memegen.link/images/${apiTemplateKey}/${cleanTop}/${cleanBottom}.${extension}`;
}
