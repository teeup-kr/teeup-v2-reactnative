import { Platform } from 'react-native';

let AsyncStorageModule;
let SecureStoreModule;
let hasWarned = false;
const isWeb = Platform.OS === 'web';

try {
  const imported = require('@react-native-async-storage/async-storage');
  AsyncStorageModule = imported?.default || imported;
  console.log('AsyncStorage module loaded successfully.');
} catch (error) {
  console.error(error);
  AsyncStorageModule = null;
}

try {
  SecureStoreModule = require('expo-secure-store');
} catch (error) {
  console.error(error);
  SecureStoreModule = null;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_CODE_VERIFIER_KEY = 'oauth_code_verifier';

const memoryStore = new Map();

function warnOnce() {
  if (hasWarned) return;
  hasWarned = true;
  console.warn('AsyncStorage unavailable, using in-memory storage fallback.');
};

function getSecureStore() {
  if (!SecureStoreModule?.setItemAsync || !SecureStoreModule?.getItemAsync || !SecureStoreModule?.deleteItemAsync) {
    throw new Error('SecureStore unavailable.');
  }
  return SecureStoreModule;
}

const storage = {
  async setItem(key, value) {
    if (AsyncStorageModule?.setItem) {
      try {
        await AsyncStorageModule.setItem(key, value);
        return;
      } catch (error) {
        console.error(error);
        warnOnce();
      }
    } else {
      warnOnce();
    }
    memoryStore.set(key, value);
  },
  async getItem(key) {
    if (AsyncStorageModule?.getItem) {
      try {
        const value = await AsyncStorageModule.getItem(key);
        if (value !== null && value !== undefined) {
          return value;
        }
      } catch (error) {
        console.error(error);
        warnOnce();
      }
    } else {
      warnOnce();
    }
    return memoryStore.has(key) ? memoryStore.get(key) : null;
  },
  async removeItem(key) {
    if (AsyncStorageModule?.removeItem) {
      try {
        await AsyncStorageModule.removeItem(key);
      } catch (error) {
        console.error(error);
        warnOnce();
      }
    } else {
      warnOnce();
    }
    memoryStore.delete(key);
  },
  async multiRemove(keys) {
    if (AsyncStorageModule?.multiRemove) {
      try {
        await AsyncStorageModule.multiRemove(keys);
        return;
      } catch (error) {
        console.error(error);
        warnOnce();
      }
    } else {
      warnOnce();
    }
    keys.forEach((key) => memoryStore.delete(key));
  },
};

export const tokenStorage = {
  async setTokens(accessToken, refreshToken) {
    if (isWeb) return;
    const secureStore = getSecureStore();
    if (accessToken) {
      await secureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      await secureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  async getAccessToken() {
    if (isWeb) return null;
    return getSecureStore().getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    if (isWeb) return null;
    return getSecureStore().getItemAsync(REFRESH_TOKEN_KEY);
  },
  async clearTokens() {
    if (isWeb) return;
    const secureStore = getSecureStore();
    await Promise.all([
      secureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      secureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
  async setUser(user) {
    if (!user) return;
    await storage.setItem(USER_KEY, JSON.stringify(user));
  },
  async getUser() {
    const stored = await storage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },
  async clearUser() {
    await storage.removeItem(USER_KEY);
  },
  async setOauthState(state) {
    if (!state) return;
    await storage.setItem(OAUTH_STATE_KEY, state);
  },
  async getOauthState() {
    return storage.getItem(OAUTH_STATE_KEY);
  },
  async clearOauthState() {
    await storage.removeItem(OAUTH_STATE_KEY);
  },

  /* =========================
   * PKCE (추가)
   ========================= */
  async setCodeVerifier(verifier) {
    if (!verifier) return;
    await storage.setItem(OAUTH_CODE_VERIFIER_KEY, verifier);
  },

  async getCodeVerifier() {
    return storage.getItem(OAUTH_CODE_VERIFIER_KEY);
  },

  async clearCodeVerifier() {
    await storage.removeItem(OAUTH_CODE_VERIFIER_KEY);
  },

  /* =========================
   * OAuth 전체 정리 (권장)
   ========================= */
  async clearOauth() {
    await storage.multiRemove([
      OAUTH_STATE_KEY,
      OAUTH_CODE_VERIFIER_KEY,
    ]);
  },
};
