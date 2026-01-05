import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { colors } from '../../theme/colors';

const buildTeams = (initialTeams) => {
  if (!Array.isArray(initialTeams)) return [];
  return initialTeams.map((team) => ({
    ...team,
    members: team.members || team.team_members || [],
    name: team.name || team.team_name || '팀',
  }));
};

export default function TeamEditorModal({
  isOpen,
  visible,
  onClose,
  teams: initialTeams,
  participants = [],
  meetingId,
  onSave,
  processing,
}) {
  const isVisible = visible ?? isOpen;
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (isVisible) {
      setTeams(buildTeams(initialTeams));
    }
  }, [initialTeams, isVisible]);

  if (!isVisible) return null;

  const handleTeamNameChange = (index, value) => {
    setTeams((prev) =>
      prev.map((team, idx) => (idx === index ? { ...team, name: value } : team)),
    );
  };

  const handleRemoveTeam = (index) => {
    setTeams((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRemoveMember = (teamIndex, memberIndex) => {
    setTeams((prev) =>
      prev.map((team, idx) => {
        if (idx !== teamIndex) return team;
        const members = [...(team.members || [])];
        members.splice(memberIndex, 1);
        return { ...team, members };
      }),
    );
  };

  const handleAddTeam = () => {
    setTeams((prev) => [...prev, { name: `팀 ${prev.length + 1}`, members: [] }]);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(teams);
    }
  };

  return (
    <Modal
      visible={isVisible}
      title="팀 편성 편집"
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          <Button variant="outline" size="sm" style={styles.footerButton} onPress={onClose}>
            닫기
          </Button>
          <Button size="sm" style={styles.footerButton} onPress={handleSave} loading={processing}>
            저장
          </Button>
        </View>
      )}
    >
      <ScrollView style={styles.scroll}>
        {teams.map((team, index) => (
          <View key={team.id || index} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <Input
                label="팀 이름"
                value={team.name}
                onChangeText={(value) => handleTeamNameChange(index, value)}
                placeholder="팀 이름"
              />
              <Pressable onPress={() => handleRemoveTeam(index)}>
                <Text style={styles.removeText}>팀 삭제</Text>
              </Pressable>
            </View>
            {team.members?.length ? (
              team.members.map((member, memberIndex) => (
                <View key={member.id || memberIndex} style={styles.memberRow}>
                  <Text style={styles.memberName}>
                    {member.user_name || member.name || member.guest_name || '멤버'}
                  </Text>
                  <Pressable onPress={() => handleRemoveMember(index, memberIndex)}>
                    <Text style={styles.removeText}>삭제</Text>
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>팀에 배정된 멤버가 없습니다.</Text>
            )}
          </View>
        ))}
        <Button size="sm" variant="outline" onPress={handleAddTeam}>
          팀 추가
        </Button>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 360,
  },
  teamCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  teamHeader: {
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  memberName: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  emptyText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  removeText: {
    fontSize: 11,
    color: colors.error[600],
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
