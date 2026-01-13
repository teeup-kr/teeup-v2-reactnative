import { StyleSheet } from 'react-native';

import { base, layouts } from '../style';

export const mypageStyles = StyleSheet.create({
    safeArea: layouts.safeArea,
    container: layouts.container,
    card: base.card,
    label: base.label,
    input: base.input,
    saveBtn: base.buttonPrimary,
    saveText: base.buttonPrimaryText,
});
