import crypto from 'crypto';

export const generateHexToken = () => {
  return crypto.randomBytes(48).toString('hex');
};

export const generateRandom = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};
