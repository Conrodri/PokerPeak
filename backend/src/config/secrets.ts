// Centralized auth secrets. Importing this module fails fast at boot if the JWT
// secret is missing/weak in production, so a misconfigured deploy can never fall
// back to a guessable key (which would let anyone forge premium/admin tokens).

const isProd = process.env.NODE_ENV === 'production';
const DEV_FALLBACK = 'change_me_dev_only';

const secret = process.env.JWT_SECRET;

if (isProd && (!secret || secret === 'change_me' || secret === DEV_FALLBACK || secret.length < 16)) {
  throw new Error(
    'JWT_SECRET must be set to a strong (≥16 char) value in production. Refusing to start with a guessable key.'
  );
}

export const JWT_SECRET = secret || DEV_FALLBACK;
export const JWT_EXPIRES = '30d';
