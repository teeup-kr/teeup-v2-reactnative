import { Pressable, Text } from 'react-native';

import { base } from '@/styles/style';

export default function SelectableChip({
  label,
  selected,
  onPress,
  styles,
  variant = 'default',
  chipStyle,
  chipActiveStyle,
  chipPressedStyle,
  chipTextStyle,
  chipTextActiveStyle,
}) {
  const defaults = variant === 'soft'
    ? { chip: base.chipSoft, chipActive: base.chipSoftActive, chipPressed: base.chipSoftPressed, chipText: base.chipSoftText, chipTextActive: base.chipSoftTextActive }
    : { chip: base.chipBase, chipActive: base.chipBaseActive, chipPressed: undefined, chipText: base.chipBaseText, chipTextActive: base.chipBaseTextActive };

  const resolvedChipStyle = chipStyle || styles?.chip || defaults.chip;
  const resolvedChipActiveStyle = chipActiveStyle || styles?.chipActive || defaults.chipActive;
  const resolvedChipPressedStyle = chipPressedStyle || styles?.chipPressed || defaults.chipPressed;
  const resolvedChipTextStyle = chipTextStyle || styles?.chipText || defaults.chipText;
  const resolvedChipTextActiveStyle = chipTextActiveStyle || styles?.chipTextActive || defaults.chipTextActive;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        resolvedChipStyle,
        selected && resolvedChipActiveStyle,
        pressed && (resolvedChipPressedStyle || { opacity: 0.9 }),
      ]}
    >
      <Text style={[resolvedChipTextStyle, selected && resolvedChipTextActiveStyle]}>{label}</Text>
    </Pressable>
  );
}
