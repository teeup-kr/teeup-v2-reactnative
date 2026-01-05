import { Redirect, useLocalSearchParams } from 'expo-router';

export default function MeetingLegacyScreen() {
  const { meetingId } = useLocalSearchParams();
  return <Redirect href={`/meetings/rounding/${meetingId}`} />;
}
