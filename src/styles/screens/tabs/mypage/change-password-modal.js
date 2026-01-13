import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    title: { fontSize: 18, fontWeight: '700' },
    body: { padding: 16 },
    label: { marginBottom: 6, fontWeight: '600' },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
    },
    error: { color: '#dc2626', fontSize: 12, marginTop: 4 },
    errorBox: {
        backgroundColor: '#fee2e2',
        padding: 10,
        borderRadius: 8,
        color: '#991b1b',
        marginBottom: 8,
    },
    buttonRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    cancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    submitBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#2563eb',
        alignItems: 'center',
    },
    submitText: { color: '#fff', fontWeight: '600' },

    center: { alignItems: 'center', padding: 32 },
    successIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    successTitle: { fontSize: 18, fontWeight: '700' },
    successText: { fontSize: 13, color: '#6b7280', marginVertical: 8 },
});

export default styles;
