import { StyleSheet } from 'react-native';

import { base, components, layouts } from '../style';

export const notificationStyles = StyleSheet.create({
    safeArea: layouts.safeArea,
    container: layouts.container,

    notiCard: {
        ...base.card,
        flexDirection: 'row',
        gap: 12,
    },

    badge: components.badge,
    title: base.label,
});
