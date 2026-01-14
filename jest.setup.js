import '@testing-library/jest-native/extend-expect';

jest.mock('expo-router');

jest.mock('react-native-safe-area-context', () => {
  const mock = require('react-native-safe-area-context/jest/mock').default;
  return {
    __esModule: true,
    ...mock,
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, ...props }) => React.createElement(View, props, children);
  return { LinearGradient };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return new Proxy(
    {},
    {
      get: (_target, name) => (props) => React.createElement(Text, props, String(name)),
    },
  );
});

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    refreshAuth: jest.fn(),
    logout: jest.fn(),
    setUser: jest.fn(),
  }),
}));

jest.mock('@/context/AppLayoutContext', () => ({
  useAppLayout: () => ({
    isMenuOpen: false,
    toggleMenu: jest.fn(),
    closeMenu: jest.fn(),
  }),
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ data: [], total_pages: 1 }),
    text: async () => '',
  }),
);
