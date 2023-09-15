import crypto from 'crypto';

export const generateHexToken = () => {
  return crypto.randomBytes(48).toString('hex');
};
