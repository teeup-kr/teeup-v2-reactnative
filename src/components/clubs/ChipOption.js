import { Pressable, Text } from 'react-native';

export default function ChipOption({ label, selected, onPress, styles }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.chipActive,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}
