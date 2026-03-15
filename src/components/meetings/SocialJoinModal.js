import RoundingJoinModal from './RoundingJoinModal';

export default function SocialJoinModal(props) {
  return (
    <RoundingJoinModal
      {...props}
      title="소셜 모임 참가 신청"
      showAverageScore={false}
      showHandicap={false}
      showGenderInReadonly
    />
  );
}
