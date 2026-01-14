import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubManageSections } from '@/constants/clubConstants';
import { createManageSectionHandler } from '@/lib/render/clubs/manage';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function ClubManageScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const router = useRouter();

  const handleSectionPress = useMemo(
    () => createManageSectionHandler({ clubId: resolvedId, router }),
    [resolvedId, router]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 관리" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>클럽 관리 대시보드</Text>
          <Text style={styles.summaryText}>클럽 운영과 멤버 관리 기능을 제공합니다.</Text>
        </Card>

        <View style={styles.sectionList}>
          {clubManageSections.map((section) => (
            <Pressable
              key={section.id}
              style={styles.sectionItem}
              onPress={handleSectionPress(section.route)}
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
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  summaryCard: {
    marginBottom: tokens.spacing.md,
  },
  summaryTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  summaryText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  sectionList: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.padding.xs2,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  sectionHint: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
});
