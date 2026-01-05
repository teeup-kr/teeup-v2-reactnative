import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ScreenHeader from '../../../../src/components/ui/ScreenHeader';
import Card from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/theme/colors';

const sections = [
  { id: 'members', label: '멤버 관리', icon: 'users', route: 'members' },
  { id: 'notices', label: '공지사항', icon: 'bullhorn', route: 'notices' },
  { id: 'regulations', label: '클럽 규정', icon: 'file-alt', route: 'regulations' },
  { id: 'fees', label: '회비 관리', icon: 'money-bill-wave', route: 'fees' },
  { id: 'stats', label: '통계', icon: 'chart-line', route: 'stats' },
  { id: 'activities', label: '활동 내역', icon: 'clipboard-list', route: 'activities' },
];

export default function ClubManageScreen() {
  const { clubId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 관리" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>클럽 관리 대시보드</Text>
          <Text style={styles.summaryText}>클럽 운영과 멤버 관리 기능을 제공합니다.</Text>
        </Card>

        <View style={styles.sectionList}>
          {sections.map((section) => (
            <Pressable
              key={section.id}
              style={styles.sectionItem}
              onPress={() => router.push(`/clubs/${clubId}/${section.route}`)}
            >
              <View style={styles.sectionIcon}>
                <FontAwesome5 name={section.icon} size={16} color={colors.primary[600]} />
              </View>
              <View style={styles.sectionTextWrap}>
                <Text style={styles.sectionLabel}>{section.label}</Text>
                <Text style={styles.sectionHint}>관리 페이지로 이동</Text>
              </View>
              <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
            </Pressable>
          ))}
        </View>
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
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  sectionList: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 6,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  sectionHint: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
});
