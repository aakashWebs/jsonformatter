// Validates a JSON string
export const validateJson = (jsonString) => {
  if (!jsonString.trim()) return { isValid: false, error: 'Input is empty' };
  try {
    JSON.parse(jsonString);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

// Auto-fixes common JSON mistakes silently, then returns the corrected string.
// Handles: trailing commas, single quotes, unquoted keys, JS/Python literals, comments.
// Returns { fixed, wasFixed, error }
export const fixJson = (raw) => {
  if (!raw.trim()) return { fixed: raw, wasFixed: false, error: 'Input is empty' };

  // Already valid — return as-is
  try {
    JSON.parse(raw);
    return { fixed: raw, wasFixed: false, error: null };
  } catch (_) { /* fall through to fixing */ }

  let s = raw;

  // 1. Strip single-line comments  (// ...)
  s = s.replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*/g, (m, str) => str !== undefined ? str : '');

  // 2. Strip block comments  (/* ... */)
  s = s.replace(/("(?:[^"\\]|\\.)*")|\/\*[\s\S]*?\*\//g, (m, str) => str !== undefined ? str : '');

  // 3. Python / JS undefined literals → JSON equivalents
  s = s
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/\bundefined\b/g, 'null');

  // 4. Single-quoted strings → double-quoted
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner) => {
    const escaped = inner.replace(/\\'/g, "'").replace(/"/g, '\\"');
    return '"' + escaped + '"';
  });

  // 5. Unquoted object keys → quoted keys  { foo: 1 } => { "foo": 1 }
  s = s.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g, '$1"$2"$3');

  // 6. Trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // 7. Try parsing the patched string
  try {
    JSON.parse(s);
    return { fixed: s, wasFixed: true, error: null };
  } catch (err) {
    // Report the error from the original input so the position makes sense
    try { JSON.parse(raw); } catch (origErr) {
      return { fixed: raw, wasFixed: false, error: origErr.message };
    }
    return { fixed: raw, wasFixed: false, error: err.message };
  }
};

// Formats JSON with the given indentation
export const formatJson = (jsonString, indent = 2) => {
  return JSON.stringify(JSON.parse(jsonString), null, indent);
};

// Minifies JSON (removes all whitespace)
export const minifyJson = (jsonString) => {
  return JSON.stringify(JSON.parse(jsonString));
};
