import { Text, View } from 'react-native';

import { base } from '@/styles/style';

export default function StatusBadge({ text, backgroundColor, textColor, style, textStyle }) {
  return (
    <View style={[base.badgeBase, style, backgroundColor && { backgroundColor }]}>
      <Text style={[base.badgeBaseText, textStyle, textColor && { color: textColor }]}>{text}</Text>
    </View>
  );
}
