import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, fontSize, fontWeight, radius, spacing } from '../../constants/theme';

type Tone = 'primary' | 'accent' | 'info';

type Props = {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  caption?: string; // dòng chú thích nhỏ, ví dụ "Mục tiêu 5 km"
  progress?: number; // 0..1, hiện thanh tiến độ nếu có
  large?: boolean; // chỉ số nổi bật
  style?: ViewStyle;
};

const tones: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: colors.primaryDark, bg: colors.primaryLight },
  accent: { fg: colors.accent, bg: colors.accentLight },
  info: { fg: colors.info, bg: colors.background },
};

export default function StatBox({
  label,
  value,
  unit,
  icon,
  tone = 'primary',
  caption,
  progress,
  large,
  style,
}: Props) {
  const t = tones[tone];
  return (
    <Card style={style}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
          <Ionicons name={icon} size={18} color={t.fg} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, large && styles.valueLarge]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>

      {typeof progress === 'number' && (
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { backgroundColor: t.fg, width: `${Math.min(Math.max(progress, 0), 1) * 100}%` },
            ]}
          />
        </View>
      )}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.caption, color: colors.textMuted, fontWeight: fontWeight.medium },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.sm },
  value: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  valueLarge: { fontSize: fontSize.headline + 8 },
  unit: { fontSize: fontSize.body, color: colors.textMuted },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  caption: { fontSize: fontSize.caption, color: colors.textMuted, marginTop: spacing.sm },
});
