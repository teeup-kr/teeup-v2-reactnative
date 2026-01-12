import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { authApi } from '@/lib/authApi';

const ChangePasswordModal = ({ isOpen, onClose, onLogout }) => {
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
                                <FontAwesome5 name="check" size={28} color="#16a34a" />
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

export default ChangePasswordModal;

/* =========================
   UI Helpers
========================= */
const Field = ({ label, children }) => (
    <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        {children}
    </View>
);

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
