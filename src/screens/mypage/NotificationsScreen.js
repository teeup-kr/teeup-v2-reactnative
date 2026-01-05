import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ui/ScreenHeader';
import NotificationList from '../../components/notifications/NotificationList';
import { colors } from '../../theme/colors';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="알림" />
      <ScrollView contentContainerStyle={styles.container}>
        <NotificationList />
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
