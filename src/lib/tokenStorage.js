let AsyncStorageModule;
let hasWarned = false;

try {
  const imported = require('@react-native-async-storage/async-storage');
  AsyncStorageModule = imported?.default || imported;
  console.log('AsyncStorage module loaded successfully.');
} catch (error) {
  console.error(error);
  AsyncStorageModule = null;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';
const OAUTH_STATE_KEY = 'oauth_state';
const OAUTH_CODE_VERIFIER_KEY = 'oauth_code_verifier';
const TERMS_AGREEMENT_TOKEN_KEY = 'terms_agreement_token';

const memoryStore = new Map();

function warnOnce() {
  if (hasWarned) return;
  hasWarned = true;
  console.warn('AsyncStorage unavailable, using in-memory storage fallback.');
};

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
    if (accessToken) {
      await storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  async getAccessToken() {
    return storage.getItem(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return storage.getItem(REFRESH_TOKEN_KEY);
  },
  async clearTokens() {
    await storage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
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

  /* =========================
   * 약관 동의 토큰
   ========================= */
  async setTermsAgreementToken(token) {
    if (!token) return;
    await storage.setItem(TERMS_AGREEMENT_TOKEN_KEY, token);
  },

  async getTermsAgreementToken() {
    return storage.getItem(TERMS_AGREEMENT_TOKEN_KEY);
  },

  async clearTermsAgreementToken() {
    await storage.removeItem(TERMS_AGREEMENT_TOKEN_KEY);
  },
};
