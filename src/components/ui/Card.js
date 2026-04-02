import { View } from 'react-native';

import { base } from '@/styles/style';
export default function Card({ children, style }) {
  return <View style={[base.card, style]}>{children}</View>;
}
