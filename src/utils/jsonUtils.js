/**
 * Validates JSON string
 * @param {string} jsonString - The JSON string to validate
 * @returns {object} - { isValid: boolean, error: string|null }
 */
export const validateJson = (jsonString) => {
  if (!jsonString.trim()) {
    return { isValid: false, error: 'Input is empty' };
  }

  try {
    JSON.parse(jsonString);
    return { isValid: true, error: null };
  } catch (error) {
    // Extract line number from error message if possible
    const match = error.message.match(/position (\d+)/);
    const position = match ? match[1] : '';
    
    return { 
      isValid: false, 
      error: `${error.message}${position ? ` at position ${position}` : ''}`
    };
  }
};

/**
 * Formats JSON with specified indentation
 * @param {string} jsonString - The JSON string to format
 * @param {number} indent - Number of spaces for indentation
 * @returns {string} - Formatted JSON string
 */
export const formatJson = (jsonString, indent = 2) => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    throw new Error('Invalid JSON');
  }
};

/**
 * Minifies JSON (removes all unnecessary whitespace)
 * @param {string} jsonString - The JSON string to minify
 * @returns {string} - Minified JSON string
 */
export const minifyJson = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed);
  } catch (error) {
    throw new Error('Invalid JSON');
  }
};

/**
 * Counts lines in a string
 * @param {string} str - The string to count lines in
 * @returns {number} - Number of lines
 */
export const countLines = (str) => {
  return str.split('\n').length;
};
