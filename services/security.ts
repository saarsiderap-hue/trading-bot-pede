
// FORGE SECURITY LAYER - AES-256 SIMULATION

// In a real production environment, this would use the Web Crypto API
// for client-side encryption before sending to a secure backend.
// For this standalone terminal, we simulate secure local storage obfuscation.

export const encryptSecret = (secret: string): string => {
  if (!secret) return '';
  // Simulation of encryption hash
  const b64 = btoa(secret);
  return `FORGE_ENC_${b64.split('').reverse().join('')}`;
};

export const decryptSecret = (encrypted: string): string => {
  if (!encrypted.startsWith('FORGE_ENC_')) return '';
  const payload = encrypted.replace('FORGE_ENC_', '');
  const original = atob(payload.split('').reverse().join(''));
  return original;
};

export const maskKey = (key: string): string => {
  if (key.length < 8) return '********';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export const validateApiKeyFormat = (key: string): boolean => {
  // Basic regex check for standard exchange API key formats (alphanumeric, ~64 chars)
  return /^[a-zA-Z0-9]{32,64}$/.test(key);
};
