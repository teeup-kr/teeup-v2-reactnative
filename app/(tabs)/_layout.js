import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    />
  );
}
