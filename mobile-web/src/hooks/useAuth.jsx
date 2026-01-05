import { useState, useEffect, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenManager, api } from '../lib/api';

// Auth Context 생성
const AuthContext = createContext();

// Auth Provider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // 사용자 정보 로드
  const loadUser = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token || !tokenManager.isTokenValid()) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      // 토큰이 유효하면 사용자 정보를 가져옴
      // 실제로는 API 호출이 필요하지만, 여기서는 토큰에서 정보를 추출
      const payload = JSON.parse(atob(token.split('.')[1]));
      // 백엔드는 JWT payload에 'id' 필드를 사용 (user_id가 아님)
      setUser({
        id: payload.id, // 백엔드에서 'id' 필드로 저장
        email: payload.email,
        nickname: payload.nickname,
        role: payload.role
      });
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      tokenManager.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const login = async (loginData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // axios 사용 (api.js의 post 메서드)
      const authResponse = await api.post('/auth/login', loginData);
      
      // 토큰 저장
      tokenManager.setTokens(authResponse.access_token, authResponse.refresh_token);
      
      // 사용자 정보 로드
      await loadUser();
      
      setIsLoading(false);
    } catch (error) {
      // axios 에러 구조에서 메시지 추출
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          '로그인에 실패했습니다.';
      
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);  // 명시적으로 Error 객체 생성
    }
  };

  // 에러 초기화
  const clearError = () => {
    setError(null);
  };

  // 로그아웃
  const logout = () => {
    tokenManager.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // 회원가입
  const register = async (userData) => {
    try {
      setIsLoading(true);
      const data = await api.post('/auth/register', userData);
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          '회원가입 실패';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth 로그인
  const googleLogin = async (oauthData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const authResponse = await api.post('/auth/oauth/google/callback', oauthData);
      
      // 토큰 저장
      tokenManager.setTokens(authResponse.access_token, authResponse.refresh_token);
      
      // 사용자 정보 설정 (강제 리렌더링을 위해 즉시 업데이트)
      setUser(authResponse.user);
      setIsAuthenticated(true);
      
      // 상태 업데이트 강제 적용
      await new Promise(resolve => setTimeout(resolve, 0));
      
      return { is_new_user: authResponse.is_new_user || false };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Google 로그인에 실패했습니다.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 어드민 토큰 처리 (POST 요청, 일회용)
  const handleAdminToken = async (adminToken) => {
    try {
      setIsLoading(true);
      
      // POST 요청으로 토큰 검증 (일회용)
      const userData = await api.post('/auth/verify-admin-token', {
        token: adminToken
      });
      
      // 일반 access 토큰을 저장 (임시 토큰이 아닌 새로 생성된 access 토큰)
      if (userData.access_token) {
        tokenManager.setTokens(userData.access_token, null);
      } else if (userData.temp_token) {
        // 호환성을 위해 temp_token도 지원
        tokenManager.setTokens(userData.temp_token, null);
      }
      
      // 사용자 정보 설정
      setUser({
        id: userData.id,
        email: userData.email,
        nickname: userData.nickname,
        role: userData.role,
        admin_view: userData.admin_view
      });
      setIsAuthenticated(true);
      
      // URL에서 토큰 파라미터 제거 (히스토리 정리)
      const url = new URL(window.location.href);
      url.searchParams.delete('admin_token');
      window.history.replaceState({}, '', url.toString());
      
      setIsLoading(false);
    } catch (error) {
      console.error('어드민 토큰 처리 실패:', error);
      setIsLoading(false);
      // 토큰이 유효하지 않으면 일반 로드 진행
      loadUser();
    }
  };

  // 초기 로드 및 어드민 토큰 체크
  useEffect(() => {
    // URL에서 admin_token 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const adminToken = urlParams.get('admin_token');
    
    if (adminToken) {
      // 어드민 토큰이 있으면 처리
      handleAdminToken(adminToken);
    } else {
      // 일반 사용자 로드
      loadUser();
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    register,
    googleLogin,
    loadUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다');
  }
  return context;
};

export default useAuth;