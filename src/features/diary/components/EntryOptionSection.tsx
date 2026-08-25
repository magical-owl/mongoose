import type { ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@providers/ThemeProvider';
import { Text } from '@shared/components/Text';

interface EntryOptionSectionProps {
  readonly title: string;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}

export function EntryOptionSection({ title, expanded, onToggle, children }: EntryOptionSectionProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
      >
        <Text preset="caption" color="textSecondary" style={styles.label}>{title}</Text>
        <Ionicons name={expanded ? 'chevron-down' : 'chevron-forward'} size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 4, marginBottom: 12 },
  header: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontWeight: '800', letterSpacing: 0.8 },
  content: { marginTop: 6 },
});
