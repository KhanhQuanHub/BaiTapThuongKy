import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, spacing } from '../../constants/theme';

type Props = { title: string; subtitle?: string };

export default function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  title: { fontSize: fontSize.headline, fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { fontSize: fontSize.body, color: colors.textMuted },
});
