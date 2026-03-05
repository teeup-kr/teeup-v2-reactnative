import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { openWebDateInput } from '@/lib/handler/mypage';
import { formatYmd, parseYmd } from '@/lib/util/meetingUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

const dateInputStyles = StyleSheet.create({
  inputLike: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.white,
  },
  inputLikeText: {
    fontSize: tokens.font.lg,
    color: colors.text,
  },
  inputPlaceholder: {
    color: colors.textMuted,
  },
});

export default function MeetingDateField({ value, onChange, styles }) {
  const [open, setOpen] = useState(false);
  const dateValue = useMemo(() => parseYmd(value) || new Date(), [value]);

  const handleWebDatePress = (e) => {
    if (e) {
      e.preventDefault?.();
      e.stopPropagation?.();
    }
    const target = e?.nativeEvent?.target;
    const anchorRect = target && typeof target.getBoundingClientRect === 'function' ? target.getBoundingClientRect() : null;
    const didOpen = openWebDateInput({
      value: value || '',
      anchorRect,
      onChange: (nextValue) => {
        if (nextValue) onChange(nextValue);
      },
    });
    if (!didOpen) {
      console.warn('웹 날짜 선택기를 열 수 없습니다.');
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.dateField}>
        <Pressable
          onPress={handleWebDatePress}
          style={({ pressed }) => [
            dateInputStyles.inputLike,
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={[dateInputStyles.inputLikeText, !value && dateInputStyles.inputPlaceholder]}>
            {value || '날짜를 선택하세요'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const handleOpen = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: 'date',
        display: 'default',
        onChange: (event, selectedDate) => {
          if (event?.type === 'dismissed') return;
          if (selectedDate) onChange(formatYmd(selectedDate));
        },
      });
    } else {
      setOpen(true);
    }
  };

  const handleChange = (event, selectedDate) => {
    setOpen(false);
    if (event?.type === 'dismissed') return;
    if (!selectedDate) return;
    onChange(formatYmd(selectedDate));
  };

  return (
    <View style={styles.dateField}>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          dateInputStyles.inputLike,
          pressed && { opacity: 0.9 },
        ]}
      >
        <Text style={[dateInputStyles.inputLikeText, !value && dateInputStyles.inputPlaceholder]}>
          {value || '날짜를 선택하세요'}
        </Text>
      </Pressable>
      {open && Platform.OS === 'ios' && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}
