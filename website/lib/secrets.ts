export type SecretStorage = 'memory' | 'localStorage';

export interface SecretSaveOptions {
  key: string;
  value: string;
  storage: SecretStorage;
}

export class SecretManager {
  private memorySecrets: Record<string, string> = {};
  private localStorageKey = 'flyde-playground-secrets';
  
  constructor() {
    this.loadSecretsFromLocalStorage();
  }

  private loadSecretsFromLocalStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Don't load localStorage secrets into memory automatically
        // They remain in localStorage only
      }
    } catch (error) {
      console.warn('Failed to load secrets from localStorage:', error);
    }
  }

  private getLocalStorageSecrets(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to get secrets from localStorage:', error);
      return {};
    }
  }

  private saveLocalStorageSecrets(secrets: Record<string, string>) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(secrets));
    } catch (error) {
      console.error('Failed to save secrets to localStorage:', error);
      throw new Error('Failed to save secret to localStorage');
    }
  }

  setSecret(key: string, value: string, storage: SecretStorage) {
    if (storage === 'memory') {
      this.memorySecrets[key] = value;
    } else {
      const localSecrets = this.getLocalStorageSecrets();
      localSecrets[key] = value;
      this.saveLocalStorageSecrets(localSecrets);
    }
  }

  getSecret(key: string): string | undefined {
    // Check memory first, then localStorage
    return this.memorySecrets[key] || this.getLocalStorageSecrets()[key];
  }

  getSecrets(): Record<string, string> {
    // Merge memory and localStorage secrets, with memory taking precedence
    return {
      ...this.getLocalStorageSecrets(),
      ...this.memorySecrets,
    };
  }

  getAvailableSecrets(): string[] {
    const memoryKeys = Object.keys(this.memorySecrets);
    const localStorageKeys = Object.keys(this.getLocalStorageSecrets());
    // Return unique keys
    return Array.from(new Set([...memoryKeys, ...localStorageKeys]));
  }

  deleteSecret(key: string) {
    // Delete from both storages
    delete this.memorySecrets[key];
    
    const localSecrets = this.getLocalStorageSecrets();
    delete localSecrets[key];
    this.saveLocalStorageSecrets(localSecrets);
  }

  clearMemorySecrets() {
    this.memorySecrets = {};
  }

  clearAllSecrets() {
    this.memorySecrets = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.localStorageKey);
    }
  }
}

// Singleton instance for the playground
let secretManagerInstance: SecretManager | null = null;

export function getSecretManager(): SecretManager {
  if (!secretManagerInstance) {
    secretManagerInstance = new SecretManager();
  }
  return secretManagerInstance;
}