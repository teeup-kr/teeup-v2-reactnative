import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LOG_METHODS = ['log', 'info', 'warn', 'error', 'debug'];
const MAX_LOG_COUNT = 250;

function formatArg(value) {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }

  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function toLogLine(args) {
  return args.map(formatArg).join(' ');
}

function getMethodColor(method) {
  if (method === 'error') return '#ff9aa2';
  if (method === 'warn') return '#ffd166';
  if (method === 'info') return '#8ecae6';
  if (method === 'debug') return '#cdb4db';
  return '#bde0fe';
}

export default function DebugConsoleOverlay() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const nextIdRef = useRef(1);

  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const originalConsole = {};

    LOG_METHODS.forEach((method) => {
      originalConsole[method] = console[method].bind(console);
      console[method] = (...args) => {
        originalConsole[method](...args);
        setLogs((prev) => {
          const next = [
            ...prev,
            {
              id: nextIdRef.current,
              method,
              message: toLogLine(args),
              timestamp: Date.now(),
            },
          ];
          nextIdRef.current += 1;
          if (next.length <= MAX_LOG_COUNT) return next;
          return next.slice(next.length - MAX_LOG_COUNT);
        });
      };
    });

    return () => {
      LOG_METHODS.forEach((method) => {
        console[method] = originalConsole[method];
      });
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [isOpen, logs]);

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.toggleButton, { top: insets.top + 8 }]}
      >
        <Text style={styles.toggleText}>{isOpen ? 'CLOSE' : 'DBG'}</Text>
      </Pressable>

      {isOpen ? (
        <View style={[styles.panel, { top: insets.top + 52 }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Console</Text>
            <Pressable onPress={() => setLogs([])} style={styles.clearButton}>
              <Text style={styles.clearText}>CLEAR</Text>
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>No logs yet.</Text>
            ) : (
              logs.map((entry) => (
                <View key={entry.id} style={styles.logRow}>
                  <Text style={[styles.methodText, { color: getMethodColor(entry.method) }]}>
                    {entry.method.toUpperCase()}
                  </Text>
                  <Text style={styles.messageText}>
                    {formatTime(entry.timestamp)} {entry.message}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  toggleButton: {
    position: 'absolute',
    right: 12,
    minWidth: 56,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  toggleText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  header: {
    height: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  clearButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1f2937',
  },
  clearText: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: {
    maxHeight: 300,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 8,
  },
  methodText: {
    width: 48,
    fontSize: 11,
    fontWeight: '700',
  },
  messageText: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 11,
    lineHeight: 16,
  },
});
