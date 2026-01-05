import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { colors } from '../../theme/colors';

const formationModeLabels = {
  GENDER_SEPARATED_HANDICAP: '성별 분리 + 핸디캡 기준',
  GENDER_SEPARATED_PREVIOUS_RECORD: '성별 분리 + 직전대회 성적 기준',
  GENDER_SEPARATED_RANDOM: '성별 분리 + 랜덤',
  GENDER_MIXED_HANDICAP: '성별 혼합 + 핸디캡 기준',
  GENDER_MIXED_PREVIOUS_RECORD: '성별 혼합 + 직전대회 성적 기준',
  GENDER_MIXED_RANDOM: '성별 혼합 + 랜덤',
};

export default function TeamFormationPreviewModal({
  isOpen,
  visible,
  onClose,
  teams = [],
  formationMode,
  teamSize,
  onConfirm,
  onReform,
  onSaveHistory,
  processing,
}) {
  const isVisible = visible ?? isOpen;
  if (!isVisible || !teams || teams.length === 0) return null;

  return (
    <Modal
      visible={isVisible}
      title="팀 편성 결과 미리보기"
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          {onReform ? (
            <Button size="sm" variant="outline" style={styles.footerButton} onPress={onReform}>
              다시 편성
            </Button>
          ) : null}
          {onSaveHistory ? (
            <Button size="sm" variant="outline" style={styles.footerButton} onPress={onSaveHistory}>
              히스토리 저장
            </Button>
          ) : null}
          <Button size="sm" style={styles.footerButton} onPress={onConfirm} loading={processing}>
            확정
          </Button>
        </View>
      )}
    >
      <Text style={styles.subTitle}>
        편성 모드: {formationModeLabels[formationMode] || formationMode} | 팀 크기: {teamSize}명
      </Text>
      <ScrollView style={styles.teamList}>
        {teams.map((team, index) => {
          const members = team.members || team.team_members || [];
          return (
            <View key={team.id || index} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <Text style={styles.teamTitle}>{team.name || `팀 ${index + 1}`}</Text>
                <Text style={styles.teamMeta}>{members.length || team.member_count || 0}명</Text>
              </View>
              {members.length === 0 ? (
                <Text style={styles.emptyText}>멤버가 없습니다.</Text>
              ) : (
                members.map((member, memberIndex) => (
                  <View key={member.id || memberIndex} style={styles.memberRow}>
                    <Text style={styles.memberName}>{member.user_name || member.name || member.guest_name || '이름 없음'}</Text>
                    <Text style={styles.memberMeta}>{member.handicap_index ?? member.handicap ?? '-'}</Text>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  subTitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 8,
  },
  teamList: {
    maxHeight: 320,
  },
  teamCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: colors.neutral[50],
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  teamMeta: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  memberName: {
    fontSize: 12,
    color: colors.neutral[800],
  },
  memberMeta: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  emptyText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerButton: {
    flex: 1,
  },
});
