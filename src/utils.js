/**
 * Validate if a string is a valid URL
 * @param {string} urlString - URL to validate
 * @returns {boolean}
 */
const validateUrl = (urlString) => {
  if (!urlString || typeof urlString !== 'string') return false;
  
  try {
    // Add protocol if missing
    const url = urlString.startsWith('http') 
      ? urlString 
      : `https://${urlString}`;
    
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Generate a random short code
 * @param {number} length - Length of the short code
 * @returns {string}
 */
const generateShortCode = (length = 6) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return code;
};

/**
 * Check if a code is valid (alphanumeric, 3-20 chars)
 * @param {string} code - Code to validate
 * @returns {boolean}
 */
const isValidCode = (code) => {
  if (!code || typeof code !== 'string') return false;
  return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  validateUrl,
  generateShortCode,
  isValidCode,
  sanitizeInput
};
