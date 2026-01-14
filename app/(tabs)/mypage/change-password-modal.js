
import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import FormField from '@/components/mypage/FormField';
import { changePassword } from '@/lib/api/mypage';
import {
    createPasswordFieldChangeHandler,
    createResetPasswordModalHandler,
    createSubmitPasswordModalHandler,
    createValidatePasswordModalHandler,
} from '@/lib/render/mypage/changePasswordModal';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';
export default function ChangePasswordModal({ isOpen, onClose, onLogout }) {
    /* =========================
       State
    ========================= */
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    /* =========================
       Reset on close
    ========================= */
    const resetForm = useMemo(
        () =>
            createResetPasswordModalHandler({
                setFormData,
                setValidationErrors,
                setError,
                setSuccess,
            }),
        [setFormData, setValidationErrors, setError, setSuccess],
    );

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    /* =========================
       Validation
    ========================= */
    const validateForm = useMemo(
        () => createValidatePasswordModalHandler({ formData, setValidationErrors }),
        [formData, setValidationErrors],
    );

    /* =========================
       Submit
    ========================= */
    const handleSubmit = useMemo(
        () =>
            createSubmitPasswordModalHandler({
                formData,
                validateForm,
                changePassword,
                setLoading,
                setError,
                setSuccess,
                onClose,
                onLogout,
            }),
        [formData, onClose, onLogout, setError, setLoading, setSuccess, validateForm],
    );

    const handleCurrentPasswordChange = useMemo(
        () => createPasswordFieldChangeHandler(setFormData, 'currentPassword'),
        [setFormData],
    );

    const handleNewPasswordChange = useMemo(
        () => createPasswordFieldChangeHandler(setFormData, 'newPassword'),
        [setFormData],
    );

    const handleConfirmPasswordChange = useMemo(
        () => createPasswordFieldChangeHandler(setFormData, 'confirmPassword'),
        [setFormData],
    );

    /* =========================
       Render
    ========================= */
    return (
        <Modal visible={isOpen} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {success ? (
                        <View style={styles.center}>
                            <View style={styles.successIcon}>
                                <FontAwesome5 name="check" size={28} color={colors.green[600]} />
                            </View>
                            <Text style={styles.successTitle}>비밀번호 변경 완료</Text>
                            <Text style={styles.successText}>
                                보안을 위해 다시 로그인해주세요.
                            </Text>
                            <ActivityIndicator />
                        </View>
                    ) : (
                        <>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>비밀번호 변경</Text>
                                <Pressable onPress={onClose}>
                                    <FontAwesome5 name="times" size={18} />
                                </Pressable>
                            </View>

                            {/* Form */}
                            <View style={styles.body}>
                                <FormField label="현재 비밀번호 *">
                                    <TextInput
                                        secureTextEntry
                                        style={styles.input}
                                        value={formData.currentPassword}
                                        onChangeText={handleCurrentPasswordChange}
                                    />
                                    {validationErrors.currentPassword && (
                                        <Text style={styles.error}>
                                            {validationErrors.currentPassword}
                                        </Text>
                                    )}
                                </FormField>

                                <FormField label="새 비밀번호 *">
                                    <TextInput
                                        secureTextEntry
                                        style={styles.input}
                                        value={formData.newPassword}
                                        onChangeText={handleNewPasswordChange}
                                    />
                                    {validationErrors.newPassword && (
                                        <Text style={styles.error}>
                                            {validationErrors.newPassword}
                                        </Text>
                                    )}
                                </FormField>

                                <FormField label="새 비밀번호 확인 *">
                                    <TextInput
                                        secureTextEntry
                                        style={styles.input}
                                        value={formData.confirmPassword}
                                        onChangeText={handleConfirmPasswordChange}
                                    />
                                    {validationErrors.confirmPassword && (
                                        <Text style={styles.error}>
                                            {validationErrors.confirmPassword}
                                        </Text>
                                    )}
                                </FormField>

                                {error && <Text style={styles.errorBox}>{error}</Text>}

                                <View style={styles.buttonRow}>
                                    <Pressable style={styles.cancelBtn} onPress={onClose}>
                                        <Text>취소</Text>
                                    </Pressable>
                                    <Pressable
                                        style={styles.submitBtn}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                    >
                                        <Text style={styles.submitText}>
                                            {loading ? '처리 중...' : '비밀번호 변경'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

/* =========================
   UI Helpers
========================= */
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: tokens.padding.md,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
    },
    header: {
        ...base.rowBetween,
        padding: tokens.padding.md,
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    title: { fontSize: tokens.font.xl, fontWeight: tokens.fontWeight.bold },
    body: { padding: tokens.padding.md },
    label: { marginBottom: tokens.spacing.xs, fontWeight: tokens.fontWeight.semibold },
    input: {
        ...base.input,
        borderRadius: tokens.radius.sm,
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.sm,
    },
    error: { color: colors.red[600], fontSize: tokens.font.sm, marginTop: tokens.spacing.xxs },
    errorBox: {
        backgroundColor: colors.red[100],
        padding: tokens.padding.base,
        borderRadius: tokens.radius.sm,
        color: colors.red[800],
        marginBottom: tokens.spacing.xs2,
    },
    buttonRow: { ...base.row, gap: tokens.spacing.xs2, marginTop: tokens.spacing.xs2 },
    cancelBtn: {
        ...base.btnOutline,
        flex: 1,
        borderRadius: tokens.radius.sm,
    },
    submitBtn: {
        ...base.btnPrimary,
        flex: 1,
        borderRadius: tokens.radius.sm,
        backgroundColor: colors.blue[600],
    },
    submitText: { color: colors.white, fontWeight: tokens.fontWeight.semibold },

    center: { alignItems: 'center', padding: tokens.padding.xxl },
    successIcon: {
        width: 56,
        height: 56,
        borderRadius: tokens.radius.xxl,
        backgroundColor: colors.green[100],
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: tokens.spacing.sm2,
    },
    successTitle: { fontSize: tokens.font.xl, fontWeight: tokens.fontWeight.bold },
    successText: { fontSize: tokens.font.md, color: colors.textSubtle, marginVertical: tokens.spacing.xs2 },
});
