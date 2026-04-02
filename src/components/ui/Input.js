import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';
export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize = 'none',
  error,
  required,
}) {
  return (
    <View style={styles.field}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.neutral[400]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: tokens.spacing.sm2,
  },
  label: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xs,
  },
  required: {
    color: colors.error[500],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  errorText: {
    marginTop: tokens.spacing.xxs,
    fontSize: tokens.font.sm,
    color: colors.error[600],
  },
});
