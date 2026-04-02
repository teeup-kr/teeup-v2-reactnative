import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { openWebDateTimeInput } from '@/lib/handler/mypage';
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

const formatDisplayValue = (val) => {
  if (!val || !val.trim()) return '';
  const v = val.trim().slice(0, 16);
  if (v.length < 10) return v;
  return `${v.slice(0, 10)} ${v.slice(11, 16)}`;
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
  const displayValue = useMemo(() => formatDisplayValue(value), [value]);

  if (Platform.OS === 'web') {
    const handleWebPress = (e) => {
      if (e) {
        e.preventDefault?.();
        e.stopPropagation?.();
      }
      if (disabled) return;
      const target = e?.nativeEvent?.target;
      const anchorRect = target && typeof target.getBoundingClientRect === 'function' ? target.getBoundingClientRect() : null;
      const inputValue = value ? value.slice(0, 16) : '';
      const min = minimumDate ? minimumDate.toISOString().slice(0, 16) : undefined;
      const didOpen = openWebDateTimeInput({
        value: inputValue,
        min,
        anchorRect,
        onChange: (nextValue) => {
          if (nextValue) onChange(nextValue);
        },
      });
      if (!didOpen) console.warn('웹 날짜/시간 선택기를 열 수 없습니다.');
    };
    return (
      <View style={styles.field}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <Pressable
          onPress={handleWebPress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.inputLike,
            error && styles.inputError,
            disabled && styles.inputDisabled,
            pressed && !disabled && { opacity: 0.9 },
          ]}
        >
          <Text style={[styles.inputLikeText, !displayValue && styles.placeholderText]} numberOfLines={1}>
            {displayValue || placeholder}
          </Text>
          <FontAwesome5 name="calendar-alt" size={16} color={colors.neutral[500]} style={styles.inputIcon} />
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

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
        style={({ pressed }) => [
          styles.inputLike,
          error && styles.inputError,
          disabled && styles.inputDisabled,
          pressed && !disabled && { opacity: 0.9 },
        ]}
      >
        <Text style={[styles.inputLikeText, !displayValue && styles.placeholderText]} numberOfLines={1}>
          {displayValue || placeholder}
        </Text>
        <FontAwesome5 name="calendar-alt" size={16} color={colors.neutral[500]} style={styles.inputIcon} />
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
  inputLike: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.white,
  },
  inputLikeText: {
    flex: 1,
    marginRight: tokens.spacing.xs,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
  },
  placeholderText: {
    color: colors.neutral[400],
  },
  inputIcon: {
    marginLeft: tokens.spacing.xs,
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
