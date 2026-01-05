import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationList from '../../components/notifications/NotificationList';
import { colors } from '../../theme/colors';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />
        <NotificationList />
        <AppFooter />
</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
});
