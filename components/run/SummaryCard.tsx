import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import { colors, fontSize, fontWeight, radius, spacing } from '../../constants/theme';
import { formatDistance, formatDuration, formatInt, formatPace } from '../../utils/format';

export type RunSummary = {
  seconds: number;
  distanceKm: number;
  steps: number;
  paceMinPerKm: number | null;
  calories: number;
};

type Props = { summary: RunSummary };

export default function SummaryCard({ summary }: Props) {
  const rows = [
    { label: 'Thời gian', value: formatDuration(summary.seconds) },
    { label: 'Pace trung bình', value: `${formatPace(summary.paceMinPerKm)} /km` },
    { label: 'Số bước', value: `${formatInt(summary.steps)} bước` },
    { label: 'Calo tiêu hao', value: `${formatInt(summary.calories)} kcal`, accent: true },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="trophy" size={36} color={colors.primaryDark} />
      </View>
      <Text style={styles.title}>Hoàn thành buổi chạy!</Text>

      <View style={styles.distanceRow}>
        <Text style={styles.distance}>{formatDistance(summary.distanceKm)}</Text>
        <Text style={styles.distanceUnit}>km</Text>
      </View>

      <View style={styles.list}>
        {rows.map((r, i) => (
          <View key={r.label} style={[styles.row, i > 0 && styles.rowBorder]}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={[styles.rowValue, r.accent && { color: colors.accent }]}>{r.value}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.text },
  distanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  distance: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  distanceUnit: { fontSize: fontSize.subtitle, color: colors.textMuted },
  list: { alignSelf: 'stretch', marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { fontSize: fontSize.body, color: colors.textMuted },
  rowValue: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
