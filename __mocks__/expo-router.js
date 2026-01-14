const React = require('react');

let mockParams = {};

const setMockParams = (nextParams = {}) => {
  mockParams = { ...nextParams };
};

const useLocalSearchParams = () => mockParams;
const useGlobalSearchParams = () => mockParams;

const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  setParams: jest.fn(),
};

const useRouter = () => router;

const Link = ({ children }) => React.createElement(React.Fragment, null, children);
const Redirect = () => null;

const Stack = { Screen: () => null };
const Tabs = { Screen: () => null };

module.exports = {
  __setMockParams: setMockParams,
  useLocalSearchParams,
  useGlobalSearchParams,
  useRouter,
  useSegments: () => [],
  usePathname: () => '/',
  Link,
  Redirect,
  Stack,
  Tabs,
  router,
};
