import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Fallback passphrase (override with .env or environment variable)
const PASSPHRASE = process.env.ENCRYPTION_PASSPHRASE || 'your-secure-passphrase';
if (!PASSPHRASE) {
  throw new Error('ENCRYPTION_PASSPHRASE is not defined in .env.local');
}

// PBKDF2 parameters for new encryption
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits for AES-256
const ITERATIONS = 100000; // High iteration count for security
const DIGEST = 'sha256';

// Derive key from passphrase and salt
function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEY_LENGTH, DIGEST);
}

// Encrypt note with AES-GCM (new method)
export function encryptNote(content: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(PASSPHRASE, salt);
  const iv = crypto.randomBytes(12); // Recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(content, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return [salt.toString('hex'), iv.toString('hex'), encrypted, authTag.toString('hex')].join(':');
}

// Decrypt note with support for old AES-CBC format
export function decryptNote(encryptedContent: string): string {
  const parts = encryptedContent.split(':');

  // Check if it's the new format (4 parts: salt, iv, encrypted, authTag)
  if (parts.length === 4) {
    const [saltHex, ivHex, encryptedHex, authTagHex] = parts;
    if (!saltHex || !ivHex || !encryptedHex || !authTagHex) {
      throw new Error('Invalid encrypted data format (new)');
    }

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const key = deriveKey(PASSPHRASE, salt);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Handle old AES-CBC format (2 parts: iv, encrypted)
  if (parts.length === 2) {
    const [ivHex, encryptedHex] = parts;
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted data format (old)');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const key = Buffer.from(process.env.MASTER_ENCRYPTION_KEY || '', 'hex'); // Use old key
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