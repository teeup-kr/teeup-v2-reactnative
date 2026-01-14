import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';
const parseDateTimeValue = (value) => {
  if (!value) return new Date();
  const safeValue = value.includes(' ') ? value.replace(' ', 'T') : value;
  const date = new Date(safeValue);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
};

const formatDateTimeValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function DateTimeField({
  label,
  value,
  onChange,
  placeholder = '날짜/시간 선택',
  error,
  disabled = false,
  minimumDate,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const displayValue = useMemo(() => (value && value.trim() ? value : ''), [value]);

  const openAndroidPicker = () => {
    const currentValue = parseDateTimeValue(value);

    DateTimePickerAndroid.open({
      value: currentValue,
      mode: 'date',
      display: 'default',
      minimumDate,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) return;
        const baseDate = selectedDate;
        DateTimePickerAndroid.open({
          value: baseDate,
          mode: 'time',
          display: 'default',
          is24Hour: true,
          onChange: (timeEvent, selectedTime) => {
            if (timeEvent.type !== 'set' || !selectedTime) return;
            const finalDate = new Date(baseDate);
            finalDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
            onChange(formatDateTimeValue(finalDate));
          },
        });
      },
    });
  };

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS === 'android') {
      openAndroidPicker();
    } else {
      setShowPicker(true);
    }
  };

  const handleIOSChange = (event, selectedDate) => {
    if (event?.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      onChange(formatDateTimeValue(selectedDate));
    }
    setShowPicker(false);
  };

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      >
        <Text style={[styles.inputText, !displayValue && styles.placeholderText]}>
          {displayValue || placeholder}
        </Text>
      </Pressable>
      {showPicker && Platform.OS === 'ios' ? (
        <DateTimePicker
          value={parseDateTimeValue(value)}
          mode="datetime"
          display="spinner"
          onChange={handleIOSChange}
          minimumDate={minimumDate}
        />
      ) : null}
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
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
    backgroundColor: colors.white,
  },
  inputText: {
    fontSize: tokens.font.base,
    color: colors.neutral[900],
  },
  placeholderText: {
    color: colors.neutral[400],
  },
  inputError: {
    borderColor: colors.error[500],
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    marginTop: tokens.spacing.xxs,
    fontSize: tokens.font.sm,
    color: colors.error[600],
  },
});
