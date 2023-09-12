import crypto from 'crypto';

export default () => {
  return crypto.randomBytes(48).toString('hex');
};
