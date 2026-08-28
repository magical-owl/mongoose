import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '@shared/components/Text';

interface SectionLabelProps {
  readonly children: string;
  readonly style?: StyleProp<TextStyle>;
  readonly testID?: string;
}

export function SectionLabel({ children, style, testID }: SectionLabelProps): React.JSX.Element {
  return (
    <Text
      preset="caption"
      color="textSecondary"
      style={[styles.label, style]}
      testID={testID}
    >
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
});
