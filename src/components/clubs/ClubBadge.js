import { Text, View } from 'react-native';

export default function ClubBadge({ text, backgroundColor, textColor, style, textStyle }) {
  return (
    <View style={[style, { backgroundColor }]}>
      <Text style={[textStyle, { color: textColor }]}>{text}</Text>
    </View>
  );
}
