
import {
    FontAwesome5
} from '@expo/vector-icons';
import {
    useEffect,
    useState
} from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable, StyleSheet, Text,
    TextInput,
    View
} from 'react-native';

import { authApi } from '@/lib/authApi';
import { base, tokens } from '@/styles/style';
import { colors } from '@/theme/colors';
export const ChangePasswordModal = ({ isOpen, onClose, onLogout }) => {
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
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setValidationErrors({});
            setError(null);
            setSuccess(false);
        }
    }, [isOpen]);

    /* =========================
       Validation
    ========================= */
    const validateForm = () => {
        const errors = {};

        if (!formData.currentPassword) {
            errors.currentPassword = '현재 비밀번호를 입력해주세요.';
        }

        if (!formData.newPassword) {
            errors.newPassword = '새 비밀번호를 입력해주세요.';
        } else if (
            formData.newPassword.length < 6 ||
            formData.newPassword.length > 32
        ) {
            errors.newPassword = '비밀번호는 6~32자여야 합니다.';
        } else {
            const rules = [
                /[A-Z]/.test(formData.newPassword),
                /[a-z]/.test(formData.newPassword),
                /[0-9]/.test(formData.newPassword),
                /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword),
            ];
            if (rules.filter(Boolean).length < 2) {
                errors.newPassword =
                    '영문 대/소문자, 숫자, 특수문자 중 2개 이상 포함해야 합니다.';
            }
            if (formData.newPassword === formData.currentPassword) {
                errors.newPassword = '현재 비밀번호와 달라야 합니다.';
            }
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
        } else if (formData.newPassword !== formData.confirmPassword) {
            errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /* =========================
       Submit
    ========================= */
    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            setError(null);

            await authApi.changePassword({
                current_password: formData.currentPassword,
                new_password: formData.newPassword,
                confirm_password: formData.confirmPassword,
            });

            setSuccess(true);

            // 3초 후 로그아웃 요청
            setTimeout(() => {
                onClose();
                onLogout?.();
            }, 3000);
        } catch (e) {
            setError(
                e?.response?.data?.message || '비밀번호 변경에 실패했습니다.'
            );
        } finally {
            setLoading(false);
        }
    };

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
                                <Field label="현재 비밀번호 *">
                                    <TextInput
                                        secureTextEntry
                                        style={styles.input}
                                        value={formData.currentPassword}
                                        onChangeText={(v) =>
                                            setFormData({ ...formData, currentPassword: v })
                                        }
                                    />
                                    {validationErrors.currentPassword && (
                                        <Text style={styles.error}>
                                            {validationErrors.currentPassword}
                                        </Text>
                                    )}
                                </Field>

                                <Field label="새 비밀번호 *">
                                    <TextInput
                                        secureTextEntry
                                        style={styles.input}
                                        value={formData.newPassword}
                                        onChangeText={(v) =>
                                            setFormData({ ...formData, newPassword: v })
                                        }
                                    />
                                    {validationErrors.newPassword && (
                                        <Text style={styles.error}>
                                            {validationErrors.newPassword}
                                        </Text>
                                    )}
                                </Field>

                                <Field label="새 비밀번호 확인 *">
                                    <TextInput
                                        secureTextEntry
                                        style={styles.input}
                                        value={formData.confirmPassword}
                                        onChangeText={(v) =>
                                            setFormData({ ...formData, confirmPassword: v })
                                        }
                                    />
                                    {validationErrors.confirmPassword && (
                                        <Text style={styles.error}>
                                            {validationErrors.confirmPassword}
                                        </Text>
                                    )}
                                </Field>

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
};

/* =========================
   UI Helpers
========================= */
const Field = ({ label, children }) => (
    <View style={{ marginBottom: tokens.spacing.sm2 }}>
        <Text style={styles.label}>{label}</Text>
        {children}
    </View>
);

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