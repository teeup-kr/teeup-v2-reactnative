import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { formatYmd, parseYmd } from '@/lib/util/meetingUtils';

export default function MeetingDateField({ value, onChange, styles }) {
  const [open, setOpen] = useState(false);
  const dateValue = useMemo(() => parseYmd(value) || new Date(), [value]);

  const handleOpen = () => setOpen(true);
  const handleChange = (event, selectedDate) => {
    setOpen(false);
    if (event?.type === 'dismissed') return;
    if (!selectedDate) return;
    onChange(formatYmd(selectedDate));
  };

  return (
    <View style={styles.dateField}>
      <Pressable onPress={handleOpen} style={styles.dateInput}>
        <Text style={[styles.dateInputText, !value && styles.dateInputPlaceholder]}>
          {value || 'YYYY-MM-DD'}
        </Text>
      </Pressable>
      {open && (
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
