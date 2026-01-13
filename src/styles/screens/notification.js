import { StyleSheet } from 'react-native';

import { base } from '../style';

export const notificationStyles = StyleSheet.create({
    safeArea: base.safeArea,
    container: base.container,

    notiCard: {
        ...base.card,
        flexDirection: 'row',
        gap: 12,
    },

    badge: base.badge,
    title: base.label,
});
