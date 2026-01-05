import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaPlus, FaArrowRight, FaEdit, FaCheck, FaTimes as FaCancel, FaGripVertical, FaExclamationTriangle } from 'react-icons/fa';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TeamEditorModal = ({
  isOpen,
  onClose,
  teams: initialTeams,
  participants,
  meetingId,
  onSave,
  processing
}) => {
  const [teams, setTeams] = useState([]);
  const [editingTeamName, setEditingTeamName] = useState(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [movingMember, setMovingMember] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, teamId: null });
  const [closeConfirmModal, setCloseConfirmModal] = useState(false);
  
  // 게스트 관련 상태
  const [guests, setGuests] = useState([]);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({
    name: '',
    birthdate: '',
    gender: '',
    handicap: '',
    average_score: ''
  });
  const [guestFormErrors, setGuestFormErrors] = useState({});
  
  // 제거된 멤버 정보 보존 (핸디캡 정보 유지용)
  const [removedMembersCache, setRemovedMembersCache] = useState(new Map());
  
  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen && initialTeams) {
      // 팀 데이터를 깊은 복사하여 로컬 state로 관리
      const teamsCopy = initialTeams.map(team => ({
        ...team,
        members: [...(team.members || team.team_members || [])]
      }));
      setTeams(teamsCopy);
      // 모달이 열릴 때 게스트 목록 초기화
      setGuests([]);
      setShowGuestForm(false);
      setGuestForm({
        name: '',
        birthdate: '',
        gender: '',
        handicap: '',
        average_score: ''
      });
      setGuestFormErrors({});
      // 모달이 열릴 때 제거된 멤버 캐시 초기화
      setRemovedMembersCache(new Map());
    }
  }, [isOpen, initialTeams, participants]);

  if (!isOpen) return null;

  // 팀 이름 편집 시작
  const handleStartEditTeamName = (teamId, currentName) => {
    setEditingTeamName(teamId);
    setTeamNameInput(currentName || '');
  };

  // 팀 이름 편집 취소
  const handleCancelEditTeamName = () => {
    setEditingTeamName(null);
    setTeamNameInput('');
  };

  // 팀 이름 저장
  const handleSaveTeamName = (teamId) => {
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, name: teamNameInput.trim() || team.name }
          : team
      )
    );
    setEditingTeamName(null);
    setTeamNameInput('');
  };

  // 새 팀 추가
  const handleAddTeam = () => {
    const newTeam = {
      id: `temp-${Date.now()}`,
      name: `팀 ${teams.length + 1}`,
      members: [],
      isNew: true
    };
    setTeams([...teams, newTeam]);
  };

  // 팀 삭제
  const handleDeleteTeam = (teamId) => {
    setDeleteConfirmModal({ isOpen: true, teamId });
  };

  const handleConfirmDeleteTeam = () => {
    const { teamId } = deleteConfirmModal;
    setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
    // 이동 중이던 멤버가 삭제된 팀에 속한 경우 초기화
    if (movingMember && movingMember.teamId === teamId) {
      setMovingMember(null);
    }
    setDeleteConfirmModal({ isOpen: false, teamId: null });
  };

  // 멤버 이동 시작
  const handleStartMoveMember = (member, teamId) => {
    setMovingMember({ member, teamId });
  };

  // 멤버 이동 취소
  const handleCancelMoveMember = () => {
    setMovingMember(null);
  };

  // 멤버를 다른 팀으로 이동
  const handleMoveMemberToTeam = (targetTeamId) => {
    if (!movingMember) return;

    const { member, teamId: sourceTeamId } = movingMember;

    // 같은 팀으로 이동하는 경우 무시
    if (sourceTeamId === targetTeamId) {
      setMovingMember(null);
      return;
    }

    // 멤버 식별: user_id를 우선 사용하고, 없으면 id 사용 (게스트/일반 참가자 모두 동일)
    const memberIdentifier = String(member.user_id || member.id);

    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === sourceTeamId) {
          // 원본 팀에서 멤버 제거
          return {
            ...team,
            members: team.members.filter(m => {
              const mIdentifier = String(m.user_id || m.id);
              return mIdentifier !== memberIdentifier;
            })
          };
        } else if (team.id === targetTeamId) {
          // 대상 팀에 멤버 추가 (중복 체크)
          // 중복 체크
          const isDuplicate = team.members.some(m => {
            if (member.is_guest) {
              if (!m.is_guest) return false;
              // 게스트는 id 또는 user_id로 비교 (하나만 일치해도 중복)
              if (m.id && member.id && String(m.id) === String(member.id)) return true;
              if (m.user_id && member.user_id && String(m.user_id) === String(member.user_id)) return true;
              return false;
            } else {
              if (m.is_guest) return false;
              const mUserId = String(m.user_id || m.id);
              return mUserId && mUserId === memberIdentifier;
            }
          });
          
          if (isDuplicate) {
            // 중복이면 추가하지 않음
            return team;
          }
          
          // participants 배열에서 해당 참가자를 찾아서 모든 정보(핸디캡 포함)를 포함시킴
          let fullMember = member;
          if (member.user_id) {
            // user_id로 participants에서 찾기
            const foundParticipant = participants.find(p => 
              p.user_id === member.user_id || 
              (member.is_guest && p.is_guest && p.user_id === member.user_id)
            );
            if (foundParticipant) {
              // participants에서 찾은 정보로 병합 (핸디캡 정보 포함)
              // member에 이미 있는 정보는 우선 유지
              fullMember = {
                ...member,
                ...foundParticipant,
                // 핸디캡 정보 우선순위: member에 있으면 유지, 없으면 foundParticipant에서 가져오기
                handicap_index: member.handicap_index !== null && member.handicap_index !== undefined
                  ? member.handicap_index
                  : foundParticipant.handicap_index,
                handicap: member.handicap !== null && member.handicap !== undefined
                  ? member.handicap
                  : foundParticipant.handicap,
                guest_handicap: member.guest_handicap !== null && member.guest_handicap !== undefined
                  ? member.guest_handicap
                  : foundParticipant.guest_handicap,
                recent_avg_score: member.recent_avg_score !== null && member.recent_avg_score !== undefined
                  ? member.recent_avg_score
                  : foundParticipant.recent_avg_score,
                gender: member.gender || foundParticipant.gender,
                guest_gender: member.guest_gender || foundParticipant.guest_gender,
              };
            }
          } else if (member.id && member.is_guest) {
            // 임시 게스트인 경우 id로 찾기
            const foundGuest = guests.find(g => g.id === member.id);
            if (foundGuest) {
              fullMember = {
                ...member,
                ...foundGuest,
              };
            }
          }
          
          return {
            ...team,
            members: [...team.members, fullMember]
          };
        }
        return team;
      })
    );

    setMovingMember(null);
  };

  // 드래그 시작
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // 드래그된 멤버 정보 찾기
    const memberInfo = active.data.current;
    if (memberInfo) {
      setMovingMember({ member: memberInfo.member, teamId: memberInfo.teamId });
    }
  };

  // 드래그 종료
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || !movingMember) {
      setMovingMember(null);
      return;
    }

    const sourceTeamId = movingMember.teamId;
    const targetTeamId = over.id;

    // 같은 팀 내에서 순서만 변경
    if (sourceTeamId === targetTeamId) {
      const team = teams.find(t => t.id === sourceTeamId);
      if (team) {
        const memberIdentifier = String(movingMember.member.user_id || movingMember.member.id);
        
        const oldIndex = team.members.findIndex(m => {
          const mIdentifier = String(m.user_id || m.id);
          return mIdentifier === memberIdentifier;
        });
        const newIndex = event.active.data.current?.index ?? oldIndex;
        
        if (oldIndex !== newIndex && oldIndex !== -1) {
          setTeams(prevTeams =>
            prevTeams.map(t =>
              t.id === sourceTeamId
                ? { ...t, members: arrayMove(t.members, oldIndex, newIndex) }
                : t
            )
          );
        }
      }
      setMovingMember(null);
      return;
    }

    // 다른 팀으로 이동
    handleMoveMemberToTeam(targetTeamId);
  };

  // 드래그 취소
  const handleDragCancel = () => {
    setActiveId(null);
    setMovingMember(null);
  };

  // 멤버를 팀에서 제거 (미할당 상태로)
  const handleRemoveMember = (member, teamId) => {
    // 멤버 식별: user_id를 우선 사용하고, 없으면 id 사용 (게스트/일반 참가자 모두 동일)
    const memberIdentifier = String(member.user_id || member.id);
    
    // 제거된 멤버 정보를 캐시에 저장 (핸디캡 정보 보존)
    setRemovedMembersCache(prev => {
      const newCache = new Map(prev);
      const cacheKey = member.user_id ? `user-${member.user_id}` : (member.is_guest ? `guest-${member.id}` : String(member.id));
      newCache.set(cacheKey, { ...member }); // 깊은 복사
      return newCache;
    });
    
    setTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? {
              ...team,
              members: team.members.filter(m => {
                const mIdentifier = String(m.user_id || m.id);
                return mIdentifier !== memberIdentifier;
              })
            }
          : team
      )
    );
  };

  // 게스트 추가 폼 검증
  const validateGuestForm = () => {
    const newErrors = {};
    
    // 이름 검증
    if (!guestForm.name || guestForm.name.trim() === '') {
      newErrors.name = '게스트 이름을 입력해주세요.';
    } else if (guestForm.name.trim().length > 255) {
      newErrors.name = '이름은 255자 이하여야 합니다.';
    }
    
    // 생년월일 검증 (선택적이지만 입력된 경우)
    if (guestForm.birthdate) {
      const birth = new Date(guestForm.birthdate);
      if (isNaN(birth.getTime())) {
        newErrors.birthdate = '올바른 생년월일을 입력해주세요.';
      } else {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        
        if (age < 14) {
          newErrors.birthdate = '만 14세 이상만 참가할 수 있습니다.';
        }
        if (birth > today) {
          newErrors.birthdate = '생년월일은 미래 날짜일 수 없습니다.';
        }
      }
    }
    
    // 성별 검증 (선택적)
    if (guestForm.gender && guestForm.gender !== 'MALE' && guestForm.gender !== 'FEMALE') {
      newErrors.gender = '성별은 남성 또는 여성만 선택할 수 있습니다.';
    }
    
    // 평균 타수는 필수 (핸디캡은 자동 계산)
    const hasAverageScore = guestForm.average_score && guestForm.average_score.trim() !== '';
    
    if (!hasAverageScore) {
      newErrors.average_score = '평균 타수를 입력해주세요.';
    }
    
    // 평균 타수 검증
    if (hasAverageScore) {
      const avgScoreNum = Number(guestForm.average_score);
      if (isNaN(avgScoreNum) || avgScoreNum < 55 || avgScoreNum > 144) {
        newErrors.average_score = '평균 타수는 55-144 사이의 숫자여야 합니다.';
      }
    }
    
    return newErrors;
  };

  // 게스트 추가 핸들러 (임시 게스트로 추가)
  const handleAddGuest = () => {
    const validationErrors = validateGuestForm();
    if (Object.keys(validationErrors).length > 0) {
      setGuestFormErrors(validationErrors);
      return;
    }
    
    // 평균 타수로부터 핸디캡 자동 계산
    let calculatedHandicap = null;
    if (guestForm.average_score && !isNaN(guestForm.average_score)) {
      const avgScore = parseFloat(guestForm.average_score);
      if (avgScore >= 55 && avgScore <= 144) {
        calculatedHandicap = Math.max(0, Math.min(72, avgScore - 72));
      }
    }
    
    // 임시 게스트 생성
    const newGuest = {
      id: `guest-${Date.now()}`,
      user_id: null, // 게스트는 user_id가 없음
      is_guest: true,
      guest_name: guestForm.name.trim(),
      user_name: guestForm.name.trim(),
      name: guestForm.name.trim(),
      guest_handicap: calculatedHandicap,
      handicap_index: calculatedHandicap,
      handicap: calculatedHandicap,
      guest_gender: guestForm.gender || null,
      gender: guestForm.gender || null,
      guest_birthdate: guestForm.birthdate || null,
      birthdate: guestForm.birthdate || null,
      average_score: guestForm.average_score ? parseInt(guestForm.average_score) : null,
      recent_avg_score: null // 게스트는 직전 대회 성적이 없음 (핸디캡 구성용 평균 타수만 입력)
    };
    
    setGuests([...guests, newGuest]);
    
    // 폼 초기화
    setGuestForm({
      name: '',
      birthdate: '',
      gender: '',
      handicap: '',
      average_score: ''
    });
    setGuestFormErrors({});
    setShowGuestForm(false);
  };

  // 게스트 삭제
  const handleRemoveGuest = (guestId) => {
    setGuests(guests.filter(g => g.id !== guestId));
  };

  // 숫자 입력만 허용
  const handleGuestNumberChange = (field, value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setGuestForm(prev => {
      const updated = { ...prev, [field]: numericValue };
      
      // 평균 타수 입력 시 핸디캡 자동 계산 및 실시간 검증
      if (field === 'average_score') {
        if (numericValue && !isNaN(numericValue)) {
          const avgScore = parseFloat(numericValue);
          if (avgScore >= 55 && avgScore <= 144) {
            const calculatedHandicap = Math.max(0, Math.min(72, avgScore - 72));
            updated.handicap = calculatedHandicap.toFixed(1);
            // 유효한 값이면 에러 제거
            setGuestFormErrors(prevErrors => ({ ...prevErrors, handicap: '', average_score: '' }));
          } else {
            updated.handicap = '';
            // 범위를 벗어나면 에러 설정
            if (avgScore < 55) {
              setGuestFormErrors(prevErrors => ({ ...prevErrors, average_score: '평균 타수는 55 이상이어야 합니다.' }));
            } else if (avgScore > 144) {
              setGuestFormErrors(prevErrors => ({ ...prevErrors, average_score: '평균 타수는 144 이하여야 합니다.' }));
            }
          }
        } else {
          updated.handicap = '';
          // 숫자가 아니면 에러는 제거 (빈 값일 때는 검증하지 않음)
          if (numericValue === '') {
            setGuestFormErrors(prevErrors => ({ ...prevErrors, average_score: '' }));
          }
        }
      }
      
      return updated;
    });
    
    // 다른 필드의 에러는 기존 로직 유지
    if (field !== 'average_score' && guestFormErrors[field]) {
      setGuestFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 미할당 참가자 목록 가져오기 (어떤 팀에도 속하지 않은 참가자 + 임시 게스트)
  const getUnassignedParticipants = () => {
    const assignedUserIds = new Set();
    const assignedGuestIds = new Set();
    
    teams.forEach(team => {
      team.members.forEach(member => {
        // is_guest 확인: member에 있으면 사용, 없으면 participants에서 찾기
        let isGuest = member.is_guest;
        if (isGuest === undefined || isGuest === null) {
          // participants에서 user_id로 찾아서 is_guest 확인
          const participant = participants.find(p => p.user_id === member.user_id);
          if (participant) {
            isGuest = participant.is_guest === true;
          }
        }
        
        if (isGuest === true) {
          // 게스트는 user_id로만 식별 (member.id는 team_member_id일 수 있음)
          if (member.user_id) {
            assignedGuestIds.add(`user-${member.user_id}`);
          } else if (member.id) {
            // user_id가 없을 때만 member.id 사용
            // member.id가 MeetingParticipant.id인지 확인하기 위해 participants에서 찾기
            const participant = participants.find(p => p.id === member.id && p.is_guest === true);
            if (participant && participant.user_id) {
              assignedGuestIds.add(`user-${participant.user_id}`);
            } else {
              // participants에서 찾지 못한 경우 임시 게스트일 수 있으므로 id로 추가
              assignedGuestIds.add(String(member.id));
            }
          }
        } else {
          // 일반 참가자는 user_id를 우선 사용 (member.id는 team_member_id일 수 있음)
          const userId = member.user_id || member.id;
          if (userId) {
            assignedUserIds.add(String(userId));
          }
        }
      });
    });

    // 일반 참가자 필터링 (참가자 탭에서 추가한 게스트 포함)
    const unassignedRegular = participants.filter(p => {
      if (p.is_guest) {
        // 참가자 탭에서 추가한 게스트는 user_id로 필터링
        const userId = p.user_id || p.id;
        if (userId) {
          // user_id 기준으로만 필터링 (user_id가 있으면 user_id 사용, 없으면 id 사용)
          if (p.user_id) {
            return !assignedGuestIds.has(`user-${p.user_id}`);
          } else {
            // user_id가 없으면 id로 체크 (임시 게스트일 수 있음)
            return !assignedGuestIds.has(String(p.id));
          }
        }
        return false;
      } else {
        // 일반 참가자는 user_id로 필터링
        const userId = p.user_id || p.id;
        return userId && !assignedUserIds.has(String(userId));
      }
    }).map(p => {
      // 제거된 멤버 캐시에서 정보를 찾아서 병합 (핸디캡 정보 보존)
      const cacheKey = p.user_id ? `user-${p.user_id}` : (p.is_guest ? `guest-${p.id}` : String(p.id));
      const cachedMember = removedMembersCache.get(cacheKey);
      if (cachedMember) {
        // 캐시된 정보로 병합 (핸디캡 정보 우선)
        return {
          ...p,
          ...cachedMember,
          // 핸디캡 정보 우선순위: cachedMember에 있으면 유지, 없으면 p에서 가져오기
          handicap_index: cachedMember.handicap_index !== null && cachedMember.handicap_index !== undefined
            ? cachedMember.handicap_index
            : p.handicap_index,
          handicap: cachedMember.handicap !== null && cachedMember.handicap !== undefined
            ? cachedMember.handicap
            : p.handicap,
          guest_handicap: cachedMember.guest_handicap !== null && cachedMember.guest_handicap !== undefined
            ? cachedMember.guest_handicap
            : p.guest_handicap,
          recent_avg_score: cachedMember.recent_avg_score !== null && cachedMember.recent_avg_score !== undefined
            ? cachedMember.recent_avg_score
            : p.recent_avg_score,
          gender: cachedMember.gender || p.gender,
          guest_gender: cachedMember.guest_gender || p.guest_gender,
        };
      }
      return p;
    });
    
    // 미할당 게스트 필터링 (임시 게스트)
    const unassignedGuests = guests.filter(g => {
      return !assignedGuestIds.has(String(g.id));
    }).map(g => {
      // 제거된 멤버 캐시에서 정보를 찾아서 병합
      const cacheKey = `guest-${g.id}`;
      const cachedMember = removedMembersCache.get(cacheKey);
      if (cachedMember) {
        return {
          ...g,
          ...cachedMember,
        };
      }
      return g;
    });
    
    return [...unassignedRegular, ...unassignedGuests];
  };

  // 미할당 참가자를 팀에 추가
  const handleAddParticipantToTeam = (participant, teamId) => {
    setTeams(prevTeams =>
      prevTeams.map(team => {
        if (team.id === teamId) {
          // 중복 체크: 같은 팀에 이미 존재하는 참가자는 추가하지 않음
          const isDuplicate = team.members.some(m => {
            if (participant.is_guest) {
              // 게스트인 경우: id 또는 user_id로 비교 (하나만 일치해도 중복)
              if (!m.is_guest) return false;
              
              // id로 비교 (임시 게스트)
              if (m.id && participant.id && String(m.id) === String(participant.id)) {
                return true;
              }
              
              // user_id로 비교 (참가자 탭 게스트)
              if (m.user_id && participant.user_id && String(m.user_id) === String(participant.user_id)) {
                return true;
              }
              
              return false;
            } else {
              // 일반 참가자인 경우: user_id로 비교
              if (m.is_guest) return false;
              const mUserId = String(m.user_id || m.id);
              const pUserId = String(participant.user_id || participant.id);
              return mUserId && pUserId && mUserId === pUserId;
            }
          });
          
          if (isDuplicate) {
            // 중복이면 추가하지 않음
            return team;
          }
          
          // participants 배열에서 해당 참가자를 찾아서 모든 정보(핸디캡 포함)를 포함시킴
          let fullParticipant = participant;
          
          // 먼저 제거된 멤버 캐시에서 정보를 확인
          const cacheKey = participant.user_id ? `user-${participant.user_id}` : (participant.is_guest ? `guest-${participant.id}` : String(participant.id));
          const cachedMember = removedMembersCache.get(cacheKey);
          
          if (cachedMember) {
            // 캐시된 정보가 있으면 우선 사용 (핸디캡 정보 보존)
            fullParticipant = {
              ...participant,
              ...cachedMember,
              // 핸디캡 정보 우선순위: cachedMember에 있으면 유지, 없으면 participant에서 가져오기
              handicap_index: cachedMember.handicap_index !== null && cachedMember.handicap_index !== undefined
                ? cachedMember.handicap_index
                : participant.handicap_index,
              handicap: cachedMember.handicap !== null && cachedMember.handicap !== undefined
                ? cachedMember.handicap
                : participant.handicap,
              guest_handicap: cachedMember.guest_handicap !== null && cachedMember.guest_handicap !== undefined
                ? cachedMember.guest_handicap
                : participant.guest_handicap,
              recent_avg_score: cachedMember.recent_avg_score !== null && cachedMember.recent_avg_score !== undefined
                ? cachedMember.recent_avg_score
                : participant.recent_avg_score,
              gender: cachedMember.gender || participant.gender,
              guest_gender: cachedMember.guest_gender || participant.guest_gender,
            };
          } else if (participant.user_id) {
            // 캐시에 없으면 participants에서 찾기
            const foundParticipant = participants.find(p => 
              p.user_id === participant.user_id || 
              (participant.is_guest && p.is_guest && p.user_id === participant.user_id)
            );
            if (foundParticipant) {
              // participants에서 찾은 정보로 병합 (핸디캡 정보 포함)
              fullParticipant = {
                ...participant,
                ...foundParticipant,
                // 핸디캡 정보 우선순위: participant에 있으면 유지, 없으면 foundParticipant에서 가져오기
                handicap_index: participant.handicap_index !== null && participant.handicap_index !== undefined
                  ? participant.handicap_index
                  : foundParticipant.handicap_index,
                handicap: participant.handicap !== null && participant.handicap !== undefined
                  ? participant.handicap
                  : foundParticipant.handicap,
                guest_handicap: participant.guest_handicap !== null && participant.guest_handicap !== undefined
                  ? participant.guest_handicap
                  : foundParticipant.guest_handicap,
                recent_avg_score: participant.recent_avg_score !== null && participant.recent_avg_score !== undefined
                  ? participant.recent_avg_score
                  : foundParticipant.recent_avg_score,
                gender: participant.gender || foundParticipant.gender,
                guest_gender: participant.guest_gender || foundParticipant.guest_gender,
              };
            }
          } else if (participant.id && participant.is_guest) {
            // 임시 게스트인 경우 id로 찾기
            const foundGuest = guests.find(g => g.id === participant.id);
            if (foundGuest) {
              fullParticipant = {
                ...participant,
                ...foundGuest,
              };
            }
          }
          
          // 팀에 추가되면 캐시에서 제거
          if (cachedMember) {
            setRemovedMembersCache(prev => {
              const newCache = new Map(prev);
              newCache.delete(cacheKey);
              return newCache;
            });
          }
          
          return {
            ...team,
            members: [...team.members, fullParticipant]
          };
        }
        return team;
      })
    );
  };

  // 핸디캡 자동 최적화 기능 제거됨

  // 변경사항 저장
  const handleSave = async () => {
    if (onSave) {
      // 미할당 게스트도 함께 전달
      await onSave(teams, guests);
    }
  };

  // 변경사항이 있는지 확인
  const hasChanges = () => {
    // 게스트가 추가되었는지 확인
    if (guests.length > 0) return true;
    
    // 게스트가 팀에 배치되었는지 확인
    const hasGuestInTeams = teams.some(team => 
      (team.members || []).some(member => member.is_guest === true)
    );
    if (hasGuestInTeams) return true;
    
    // 간단한 비교: 팀 수, 팀 이름, 멤버 수가 변경되었는지 확인
    if (teams.length !== initialTeams.length) return true;
    
    for (let i = 0; i < teams.length; i++) {
      const currentTeam = teams[i];
      const originalTeam = initialTeams.find(t => t.id === currentTeam.id);
      
      if (!originalTeam && !currentTeam.isNew) return true; // 새 팀
      if (currentTeam.isNew) return true; // 새로 추가된 팀
      
      if (currentTeam.name !== (originalTeam?.name || `팀 ${i + 1}`)) return true;
      
      // user_id 기준으로 멤버 비교 (member.id는 team_member_id일 수 있음)
      // 게스트는 id로 비교
      const currentMemberIds = new Set();
      (currentTeam.members || []).forEach(m => {
        if (m.is_guest) {
          currentMemberIds.add(`guest-${m.id}`);
        } else {
          const userId = String(m.user_id || m.id);
          if (userId) currentMemberIds.add(`user-${userId}`);
        }
      });
      
      const originalMemberIds = new Set();
      ((originalTeam?.members || originalTeam?.team_members) || []).forEach(m => {
        if (m.is_guest) {
          originalMemberIds.add(`guest-${m.id}`);
        } else {
          const userId = String(m.user_id || m.id);
          if (userId) originalMemberIds.add(`user-${userId}`);
        }
      });
      
      if (currentMemberIds.size !== originalMemberIds.size) return true;
      for (const memberId of currentMemberIds) {
        if (!originalMemberIds.has(memberId)) return true;
      }
    }
    
    return false;
  };

  // 모달 닫기 핸들러 (변경사항 확인)
  const handleClose = () => {
    if (hasChanges()) {
      setCloseConfirmModal(true);
    } else {
      onClose();
    }
  };

  // 변경사항 무시하고 닫기
  const handleCloseWithoutSave = () => {
    setCloseConfirmModal(false);
    onClose();
  };

  const unassignedParticipants = getUnassignedParticipants();

  // SortableMember 컴포넌트
  const SortableMember = ({ member, teamId, memberIndex, isMoving, onStartMove, onRemove, processing }) => {
    // 게스트는 id를 사용, 일반 참가자는 user_id를 사용
    const memberIdentifier = String(member.user_id || member.id);
    const memberId = `member-${teamId}-${memberIdentifier}`;
    
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: memberId,
      data: {
        member,
        teamId,
        index: memberIndex
      }
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const isGuest = member.is_guest === true;
    const userName = isGuest 
      ? (member.guest_name || member.user_name || member.name || '이름 없음')
      : (member.user_name || member.name || '이름 없음');
    const userNickname = member.user_nickname || member.nickname || '';
    
    // 성별 표시 (게스트인 경우 guest_gender를 우선 확인)
    const genderValue = isGuest 
      ? (member.guest_gender || member.gender)
      : (member.gender || member.guest_gender);
    const genderText = genderValue === 'MALE' ? '남' : genderValue === 'FEMALE' ? '여' : '';
    
    // 핸디캡: null/undefined가 아니면 표시 (0도 표시)
    // 게스트인 경우 guest_handicap을 우선 확인
    let handicapValue = null;
    if (isGuest) {
      handicapValue = member.guest_handicap !== null && member.guest_handicap !== undefined
        ? member.guest_handicap
        : (member.handicap_index !== null && member.handicap_index !== undefined
          ? member.handicap_index
          : (member.handicap !== null && member.handicap !== undefined ? member.handicap : null));
    } else {
      handicapValue = member.handicap_index !== null && member.handicap_index !== undefined
        ? member.handicap_index
        : (member.handicap !== null && member.handicap !== undefined ? member.handicap : null);
    }
    const handicapText = handicapValue !== null ? `핸디: ${handicapValue}` : '';
    
    // 직전대회성적: 게스트가 아닌 경우에만 표시 (게스트는 핸디캡 구성용 평균 타수만 입력)
    const scoreText = !isGuest && member.recent_avg_score !== null && member.recent_avg_score !== undefined
      ? `직전대회: ${member.recent_avg_score}타`
      : '';

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 rounded-lg border p-3 ${
          isMoving || isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-200 bg-white'
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 p-1"
          title="드래그하여 이동"
        >
          <FaGripVertical className="w-4 h-4" />
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white">
          <span className="text-sm font-semibold">
            {userName.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {userName}
          </p>
          {userNickname && userName !== userNickname && (
            <p className="text-xs text-neutral-500 truncate">
              {userNickname}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-neutral-600 mt-1">
            {isGuest && (
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold">
                게스트
              </span>
            )}
            {genderText && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {genderText}
              </span>
            )}
            {handicapText && (
              <span className="px-2 py-0.5 rounded bg-green-50 text-green-700">
                {handicapText}
              </span>
            )}
            {scoreText && (
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                {scoreText}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {!isMoving ? (
            <>
              <button
                onClick={() => onStartMove(member, teamId)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                disabled={processing}
                title="다른 팀으로 이동"
              >
                <FaArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemove(member, teamId)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                disabled={processing}
                title="팀에서 제거"
              >
                <FaTrash className="w-3 h-3" />
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-blue-600 font-semibold">이동 중</span>
              <button
                onClick={handleCancelMoveMember}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="이동 취소"
              >
                <FaCancel className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 드래그 중인 멤버 정보 가져오기
  const getDraggingMember = () => {
    if (!activeId || !movingMember) return null;
    return movingMember.member;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 sm:p-4 pb-2 sm:pb-3 border-b border-neutral-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              팀 편성 수정
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">
              팀을 추가, 삭제하거나 멤버를 이동할 수 있습니다.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 sm:p-2 flex-shrink-0"
            disabled={processing}
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 콘텐츠 영역 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {/* 미할당 참가자 섹션 */}
        <div className="mb-4 sm:mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-sm font-semibold text-amber-800">
              미할당 참가자 ({unassignedParticipants.length}명)
            </h3>
            <button
              type="button"
              onClick={() => setShowGuestForm(!showGuestForm)}
              className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg border border-green-300 transition-colors"
              disabled={processing}
            >
              <FaPlus className="w-3 h-3" />
              게스트 추가
            </button>
          </div>
          
          {/* 게스트 추가 폼 */}
          {showGuestForm && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-green-200 space-y-3">
              <h4 className="text-sm font-semibold text-neutral-700">게스트 정보</h4>
              
              {/* 이름 */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => {
                    setGuestForm(prev => ({ ...prev, name: e.target.value }));
                    if (guestFormErrors.name) {
                      setGuestFormErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    guestFormErrors.name ? 'border-red-300' : 'border-neutral-300'
                  }`}
                  placeholder="게스트 이름"
                  maxLength={255}
                />
                {guestFormErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.name}</p>
                )}
              </div>

              {/* 생년월일 */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  생년월일
                </label>
                <input
                  type="date"
                  value={guestForm.birthdate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    
                    if (selectedDate) {
                      const birth = new Date(selectedDate);
                      if (!isNaN(birth.getTime())) {
                        const today = new Date();
                        let age = today.getFullYear() - birth.getFullYear();
                        const m = today.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                        
                        if (age < 14) {
                          setGuestForm(prev => ({ ...prev, birthdate: '' }));
                          setGuestFormErrors(prev => ({ ...prev, birthdate: '만 14세 이상만 참가할 수 있습니다.' }));
                          return;
                        }
                        if (birth > today) {
                          setGuestForm(prev => ({ ...prev, birthdate: '' }));
                          setGuestFormErrors(prev => ({ ...prev, birthdate: '생년월일은 미래 날짜일 수 없습니다.' }));
                          return;
                        }
                      }
                    }
                    
                    setGuestForm(prev => ({ ...prev, birthdate: selectedDate }));
                    if (guestFormErrors.birthdate) {
                      setGuestFormErrors(prev => ({ ...prev, birthdate: '' }));
                    }
                  }}
                  max={(() => {
                    const today = new Date();
                    const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    guestFormErrors.birthdate ? 'border-red-300' : 'border-neutral-300'
                  }`}
                />
                {guestFormErrors.birthdate && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.birthdate}</p>
                )}
              </div>

              {/* 성별 */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  성별
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="guest_gender"
                      value="MALE"
                      checked={guestForm.gender === 'MALE'}
                      onChange={(e) => {
                        setGuestForm(prev => ({ ...prev, gender: e.target.value }));
                        if (guestFormErrors.gender) {
                          setGuestFormErrors(prev => ({ ...prev, gender: '' }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-neutral-700">남성</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="guest_gender"
                      value="FEMALE"
                      checked={guestForm.gender === 'FEMALE'}
                      onChange={(e) => {
                        setGuestForm(prev => ({ ...prev, gender: e.target.value }));
                        if (guestFormErrors.gender) {
                          setGuestFormErrors(prev => ({ ...prev, gender: '' }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-neutral-700">여성</span>
                  </label>
                </div>
                {guestFormErrors.gender && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.gender}</p>
                )}
              </div>

              {/* 평균 타수 */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  평균 타수 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="55"
                  max="144"
                  value={guestForm.average_score}
                  onChange={(e) => handleGuestNumberChange('average_score', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    guestFormErrors.average_score ? 'border-red-300' : 'border-neutral-300'
                  }`}
                  placeholder="55-144"
                />
                {guestFormErrors.average_score && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.average_score}</p>
                )}
              </div>

              {/* 핸디캡 */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  핸디캡
                  <span className="text-xs text-neutral-500 ml-2">(평균 타수로 자동 계산)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="72"
                  step="0.1"
                  value={
                    guestForm.average_score && !isNaN(guestForm.average_score) && guestForm.average_score >= 55 && guestForm.average_score <= 144
                      ? Math.max(0, Math.min(72, parseFloat(guestForm.average_score) - 72)).toFixed(1)
                      : (guestForm.handicap || '')
                  }
                  onChange={() => {}}
                  disabled={true}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-neutral-50 border-neutral-300"
                  placeholder="평균 타수 입력 시 자동 계산됩니다"
                />
                {guestFormErrors.handicap && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.handicap}</p>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGuestForm(false);
                    setGuestForm({
                      name: '',
                      birthdate: '',
                      gender: '',
                      handicap: '',
                      average_score: ''
                    });
                    setGuestFormErrors({});
                  }}
                  className="flex-1 px-4 py-2 bg-neutral-200 text-neutral-700 text-sm rounded-lg hover:bg-neutral-300"
                >
                  취소
                </button>
              </div>
            </div>
          )}
          
          {/* 미할당 참가자 목록 */}
          {unassignedParticipants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {unassignedParticipants.map((participant) => {
                const isGuest = participant.is_guest === true;
                const displayName = isGuest 
                  ? (participant.guest_name || participant.user_name || participant.name || '?')
                  : (participant.user_name || participant.name || '?');
                
                
                // 성별 표시 (게스트인 경우 guest_gender를 우선 확인)
                // 백엔드에서 gender 필드에도 guest_gender 값을 넣어주지만, 명시적으로 확인
                const genderValue = isGuest 
                  ? (participant.guest_gender || participant.gender)
                  : (participant.gender || participant.guest_gender);
                
                // 성별 값 정규화 (대소문자 무시, Enum 값 처리)
                // Enum의 경우 .value 속성이 있을 수 있으므로 처리
                let normalizedGender = '';
                if (genderValue) {
                  if (typeof genderValue === 'object' && genderValue.value) {
                    normalizedGender = String(genderValue.value).toUpperCase().trim();
                  } else {
                    normalizedGender = String(genderValue).toUpperCase().trim();
                  }
                }
                const genderText = normalizedGender === 'MALE' ? '남' 
                  : normalizedGender === 'FEMALE' ? '여' 
                  : '';
                
                // 핸디캡: null/undefined가 아니면 표시 (0도 표시)
                // 게스트인 경우 guest_handicap을 우선 확인
                // 백엔드에서 handicap_index와 handicap에도 guest_handicap 값을 넣어주지만, 명시적으로 확인
                let handicapValue = null;
                if (isGuest) {
                  // 게스트는 guest_handicap을 우선 사용
                  if (participant.guest_handicap !== null && participant.guest_handicap !== undefined) {
                    handicapValue = Number(participant.guest_handicap);
                  } else if (participant.handicap_index !== null && participant.handicap_index !== undefined) {
                    handicapValue = Number(participant.handicap_index);
                  } else if (participant.handicap !== null && participant.handicap !== undefined) {
                    handicapValue = Number(participant.handicap);
                  }
                } else {
                  // 일반 참가자는 handicap_index를 우선 사용
                  if (participant.handicap_index !== null && participant.handicap_index !== undefined) {
                    handicapValue = Number(participant.handicap_index);
                  } else if (participant.handicap !== null && participant.handicap !== undefined) {
                    handicapValue = Number(participant.handicap);
                  }
                }
                const handicapText = handicapValue !== null && handicapValue !== undefined && !isNaN(handicapValue) ? `핸디: ${handicapValue}` : '';
                
                return (
                  <div
                    key={participant.id || participant.user_id || `guest-${participant.id}`}
                    className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-semibold ${
                        isGuest 
                          ? 'bg-gradient-to-br from-orange-500 to-red-500'
                          : 'bg-gradient-to-br from-amber-500 to-orange-500'
                      }`}>
                        {displayName.charAt(0)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">
                          {displayName}
                        </span>
                        {isGuest && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-semibold">
                            게스트
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                      {genderText && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {genderText}
                        </span>
                      )}
                      {handicapText && (
                        <span className="px-2 py-0.5 rounded bg-green-50 text-green-700">
                          {handicapText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 py-2">미할당 참가자가 없습니다.</p>
          )}
        </div>

        {/* 팀 목록 */}
        <div className="space-y-4">
          {teams.map((team, index) => {
            const members = team.members || [];
            const totalHandicap = members.reduce((sum, member) => {
              const handicap = member.handicap_index || member.handicap || 0;
              return sum + (typeof handicap === 'number' ? handicap : parseFloat(handicap) || 0);
            }, 0);

            return (
              <div
                key={team.id}
                className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
              >
                {/* 팀 헤더 */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {editingTeamName === team.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={teamNameInput}
                          onChange={(e) => setTeamNameInput(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="팀 이름"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTeamName(team.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditTeamName();
                            }
                          }}
                        />
                        <button
                          onClick={() => handleSaveTeamName(team.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <FaCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEditTeamName}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FaCancel className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900">
                          {team.name || `팀 ${index + 1}`}
                        </h3>
                        <button
                          onClick={() => handleStartEditTeamName(team.id, team.name)}
                          className="p-1 text-neutral-400 hover:text-neutral-600"
                          disabled={processing}
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm text-neutral-500">
                      {members.length}명
                    </span>
                    {totalHandicap > 0 && (
                      <span className="text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">
                        총 핸디: {totalHandicap.toFixed(1)}
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      disabled={processing}
                      title="팀 삭제"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 멤버 목록 - 드롭 존 */}
                <div
                  id={team.id}
                  className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 min-h-[60px] p-2 rounded-lg border-2 border-dashed border-transparent transition-colors"
                  style={{
                    borderColor: movingMember && movingMember.teamId !== team.id ? '#3b82f6' : 'transparent',
                    backgroundColor: movingMember && movingMember.teamId !== team.id ? '#eff6ff' : 'transparent'
                  }}
                >
                  <SortableContext
                    items={members.map((m, idx) => {
                      const identifier = String(m.user_id || m.id);
                      return `member-${team.id}-${identifier}`;
                    })}
                    strategy={verticalListSortingStrategy}
                  >
                    {members.map((member, memberIndex) => {
                      const memberIdentifier = String(member.user_id || member.id);
                      const movingMemberIdentifier = movingMember?.member
                        ? String(movingMember.member.user_id || movingMember.member.id)
                        : null;
                      const isMoving = movingMemberIdentifier && memberIdentifier === movingMemberIdentifier;

                      // 고유 key 생성: team.id + memberIdentifier + memberIndex 조합
                      const uniqueKey = `${team.id}-${memberIdentifier}-${memberIndex}`;

                      return (
                        <SortableMember
                          key={uniqueKey}
                          member={member}
                          teamId={team.id}
                          memberIndex={memberIndex}
                          isMoving={isMoving}
                          onStartMove={handleStartMoveMember}
                          onRemove={handleRemoveMember}
                          processing={processing}
                        />
                      );
                    })}
                  </SortableContext>
                  
                  {/* 미할당 참가자 추가 버튼 */}
                  {unassignedParticipants.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-3">
                      <div className="text-xs font-semibold text-neutral-600 mb-1">미할당 참가자 추가</div>
                      <div className="flex flex-wrap gap-1">
                        {unassignedParticipants.map((participant) => (
                          <button
                            key={participant.id || participant.user_id}
                            onClick={() => handleAddParticipantToTeam(participant, team.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200"
                            disabled={processing}
                          >
                            <FaPlus className="w-2.5 h-2.5" />
                            <span>
                              {participant.is_guest 
                                ? (participant.guest_name || participant.user_name || participant.name)
                                : (participant.user_name || participant.name)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 이동 중인 멤버를 이 팀으로 이동하는 버튼 */}
                {movingMember && movingMember.teamId !== team.id && (
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <button
                      onClick={() => handleMoveMemberToTeam(team.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      disabled={processing}
                    >
                      <FaArrowRight className="w-4 h-4" />
                      여기로 이동
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 새 팀 추가 버튼 */}
        <div className="mb-6">
          <button
            onClick={handleAddTeam}
            className="w-full px-4 py-3 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
            disabled={processing}
          >
            <FaPlus className="w-4 h-4" />
            새 팀 추가
          </button>
        </div>

        </div>
        {/* 하단 버튼 - 고정 */}
        <div className="flex gap-1.5 sm:gap-2 p-3 sm:p-4 border-t border-neutral-200 bg-white rounded-b-xl flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 font-medium"
            disabled={processing}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 font-medium"
            disabled={processing || !hasChanges()}
          >
            {processing ? '저장 중...' : <><span className="hidden sm:inline">변경사항 저장</span><span className="sm:hidden">저장</span></>}
          </button>
        </div>
      </div>
      </div>
      
      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeId && movingMember ? (() => {
          const isGuest = movingMember.member.is_guest === true;
          const displayName = isGuest
            ? (movingMember.member.guest_name || movingMember.member.user_name || movingMember.member.name || '?')
            : (movingMember.member.user_name || movingMember.member.name || '?');
          
          return (
            <div className="flex items-center gap-3 rounded-lg border border-blue-500 bg-blue-50 p-3 shadow-lg">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                isGuest
                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
              }`}>
                <span className="text-sm font-semibold">
                  {displayName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  {displayName}
                </p>
              </div>
            </div>
          );
        })() : null}
      </DragOverlay>

      {/* 팀 삭제 확인 모달 */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-8 max-w-md mx-3 sm:mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100 mb-3 sm:mb-4">
                <FaExclamationTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                팀 삭제 확인
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                이 팀을 삭제하시겠습니까? 팀의 모든 멤버가 제거됩니다.
              </p>
              <div className="flex gap-2 sm:space-x-3">
                <button
                  onClick={() => setDeleteConfirmModal({ isOpen: false, teamId: null })}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDeleteTeam}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 변경사항 저장 확인 모달 */}
      {closeConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-8 max-w-md mx-3 sm:mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-amber-100 mb-3 sm:mb-4">
                <FaExclamationTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                변경사항이 저장되지 않았습니다
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 whitespace-pre-line">
                게스트 배치 등 변경사항이 있습니다.{'\n'}저장하지 않고 닫으시겠습니까?
              </p>
              <div className="flex gap-2 sm:space-x-3">
                <button
                  onClick={() => setCloseConfirmModal(false)}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleCloseWithoutSave}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

export default TeamEditorModal;
