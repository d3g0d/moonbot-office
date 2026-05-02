/**
 * Simple obfuscation for URL query parameters
 * This is not cryptographically secure, but prevents casual reading/tampering of URL values.
 */

const SECRET_KEY = 'moonbot-office-v1';

/**
 * Encrypts a string value using XOR and Base64
 * @param {string|number} value 
 * @returns {string}
 */
export const encryptParam = (value) => {
    if (value === null || value === undefined || value === '') return '';
    
    const str = String(value);
    let result = '';
    
    // XOR with secret key
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    
    // Base64 encode and make URL-safe (remove padding)
    try {
        return btoa(encodeURIComponent(result)).replace(/=/g, '');
    } catch (e) {
        return value;
    }
};

/**
 * Decrypts a string value
 * @param {string} value 
 * @returns {string}
 */
export const decryptParam = (value) => {
    if (!value) return '';
    
    try {
        // Base64 decode
        // Add back padding if needed
        let base64 = value;
        while (base64.length % 4 !== 0) base64 += '=';
        
        const decoded = decodeURIComponent(atob(base64));
        let result = '';
        
        // XOR back
        for (let i = 0; i < decoded.length; i++) {
            result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
        }
        
        return result;
    } catch (e) {
        // If decryption fails, return original (might be old unencrypted URL)
        return value;
    }
};

/**
 * Helper to encrypt all values in a query object
 */
export const encryptQuery = (query) => {
    const encrypted = {};
    for (const key in query) {
        if (query[key] !== undefined && query[key] !== null) {
            encrypted[key] = encryptParam(query[key]);
        }
    }
    return encrypted;
};

/**
 * Helper to decrypt all values in a query object
 */
export const decryptQuery = (query) => {
    const decrypted = {};
    for (const key in query) {
        decrypted[key] = decryptParam(query[key]);
    }
    return decrypted;
};
