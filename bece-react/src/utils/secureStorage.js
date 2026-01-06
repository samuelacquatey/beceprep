
import { openDB } from 'idb';
import CryptoJS from 'crypto-js';

const DB_NAME = 'BecePrepSecureDB';
const STORE_NAME = 'secure_cache';
const KEY_NAME = 'bece_secure_key_v1';

// In a real production app, this key should be obfuscated or fetched from a secure source
// For client-side PWA, we obfuscate it to prevent casual inspection
const getEncryptionKey = () => {
    // Obfuscated key generation
    const p1 = 'Bece';
    const p2 = 'Prep';
    const p3 = '2025';
    const p4 = 'Secure';
    return `${p1}_${p4}_${p2}_${p3}_Key`;
};

const SECRET_KEY = getEncryptionKey();

class SecureStorage {
    async getDB() {
        return openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
    }

    encrypt(data) {
        try {
            const stringData = JSON.stringify(data);
            return CryptoJS.AES.encrypt(stringData, SECRET_KEY).toString();
        } catch (error) {
            console.error('Encryption failed:', error);
            return null;
        }
    }

    decrypt(ciphertext) {
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decryptedData);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    }

    async setItem(key, data) {
        const db = await this.getDB();
        const encryptedData = this.encrypt(data);
        if (encryptedData) {
            await db.put(STORE_NAME, encryptedData, key);
            return true;
        }
        return false;
    }

    async getItem(key) {
        const db = await this.getDB();
        const encryptedData = await db.get(STORE_NAME, key);
        if (!encryptedData) return null;
        return this.decrypt(encryptedData);
    }

    async removeItem(key) {
        const db = await this.getDB();
        await db.delete(STORE_NAME, key);
    }

    async clear() {
        const db = await this.getDB();
        await db.clear(STORE_NAME);
    }
}

export const secureStorage = new SecureStorage();
