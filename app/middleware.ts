import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Fallback passphrase
const PASSPHRASE = process.env.ENCRYPTION_PASSPHRASE || 'your-secure-passphrase';
if (!PASSPHRASE) {
  throw new Error('ENCRYPTION_PASSPHRASE is not defined in .env.local');
}

// PBKDF2 parameters
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits for AES-256
const ITERATIONS = 100000;
const DIGEST = 'sha256';

// Derive a key using the passphrase, salt, and note ID
function deriveKey(passphrase: string, salt: Buffer, noteId: string): Buffer {
  const combinedSalt = Buffer.concat([salt, Buffer.from(noteId)]);
  return crypto.pbkdf2Sync(passphrase, combinedSalt, ITERATIONS, KEY_LENGTH, DIGEST);
}

export function encryptNote(content: string, noteId: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(PASSPHRASE, salt, noteId);
  const iv = crypto.randomBytes(12); // Recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return [salt.toString('hex'), iv.toString('hex'), encrypted, authTag.toString('hex')].join(':');
}

export function decryptNote(encryptedContent: string, noteId: string): string {
  const parts = encryptedContent.split(':');

  // New format (4 parts: salt, iv, encrypted, authTag)
  if (parts.length === 4) {
    const [saltHex, ivHex, encryptedHex, authTagHex] = parts;
    if (!saltHex || !ivHex || !encryptedHex || !authTagHex) {
      throw new Error('Invalid encrypted data format (new)');
    }

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const key = deriveKey(PASSPHRASE, salt, noteId);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Old format (2 parts: iv, encrypted)
  if (parts.length === 2) {
    const [ivHex, encryptedHex] = parts;
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format (old)');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const key = Buffer.from(process.env.MASTER_ENCRYPTION_KEY || '', 'hex');
    if (key.length !== 32) {
      throw new Error('Invalid MASTER_ENCRYPTION_KEY length for old decryption');
    }

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  throw new Error('Invalid encrypted data format');
}