import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from 'vite-jsconfig-paths'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 프로젝트 루트 디렉토리 경로 (apps/mobile-web에서 2단계 위)
  const rootDir = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, rootDir, '');
  
  // Mobile-web 개발 서버 포트 (환경변수 필수)
  const MOBILE_PORT = env.VITE_MOBILE_PORT;
  if (!MOBILE_PORT) {
    throw new Error('VITE_MOBILE_PORT 환경 변수가 설정되지 않았습니다.');
  }
  const mobilePortNum = parseInt(MOBILE_PORT, 10);
  if (isNaN(mobilePortNum) || mobilePortNum <= 0) {
    throw new Error(`VITE_MOBILE_PORT가 유효하지 않습니다: ${MOBILE_PORT}`);
  }
  
  // Backend API 서버 포트 (환경변수 필수)
  const BACKEND_PORT = env.VITE_BACKEND_PORT;
  if (!BACKEND_PORT) {
    throw new Error('VITE_BACKEND_PORT 환경 변수가 설정되지 않았습니다.');
  }
  const backendPortNum = parseInt(BACKEND_PORT, 10);
  if (isNaN(backendPortNum) || backendPortNum <= 0) {
    throw new Error(`VITE_BACKEND_PORT가 유효하지 않습니다: ${BACKEND_PORT}`);
  }
  
  // 개발 서버 프록시 타겟 (환경변수로 설정, 없으면 localhost 백엔드 사용)
  const DEV_API_TARGET = env.VITE_API_BASE_URL || env.VITE_DEV_API_TARGET || `http://localhost:${backendPortNum}`;

  return {
    plugins: [
      react(),
      jsconfigPaths(),
    ],

    envDir: rootDir, // 루트 디렉토리의 .env 파일 사용 (절대 경로)

    css: {
      postcss: './postcss.config.js',
    },

    /** 개발 서버 */
    server: {
      port: mobilePortNum,
      open: true,
      host: true,
      fs: {
        strict: true,
      },
      proxy: {
        '/api': {
          target: DEV_API_TARGET,
          changeOrigin: true,
        },
      },
    },

    /** preview 서버 (빌드 결과 serve) */
    preview: {
      port: mobilePortNum,        // dev와 동일한 포트
      open: true,
      host: true,
      proxy: {
        '/api': {
          target: DEV_API_TARGET,
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      manifest: true,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
        },
      },
    },

    define: {
      'process.env': {},
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
      // 환경 변수를 클라이언트에 명시적으로 주입
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'http://localhost:8002'),
    },

    esbuild: {
      charset: 'utf8',
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
  };
});
