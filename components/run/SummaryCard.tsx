import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../ui/Card';
import {
  fontSize, fontWeight, radius, spacing, ThemeColors,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';
import { formatDistance, formatDuration, formatInt, formatPace } from '../../utils/format';

export type RunSummary = {
  seconds: number;
  distanceKm: number;
  steps: number;
  paceMinPerKm: number | null;
  calories: number;
};

export type SummaryCardProps = {
  summary: RunSummary;
};

export default function SummaryCard({ summary }: SummaryCardProps) {
  const { colors, isDark } = useTheme();

  const rows = [
    {
      label: 'Thời gian vận động',
      value: formatDuration(summary.seconds),
      icon: 'time-outline' as const,
    },
    {
      label: 'Pace trung bình',
      value: `${formatPace(summary.paceMinPerKm)} /km`,
      hint: 'Thời gian chạy mỗi 1 km',
      icon: 'speedometer-outline' as const,
    },
    {
      label: 'Số bước chân',
      value: `${formatInt(summary.steps)} bước`,
      icon: 'footsteps-outline' as const,
    },
    {
      label: 'Năng lượng tiêu hao',
      value: `${formatInt(summary.calories)} kcal`,
      hint: 'Calo đốt cháy ước tính',
      accent: true,
      icon: 'flame-outline' as const,
    },
  ];

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <Card elevated style={styles.card}>
      {/* Huy hiệu hoàn thành */}
      <View style={styles.trophyRing}>
        <View style={styles.trophyIconWrap}>
          <Ionicons name="trophy" size={38} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Xuất sắc! Hoàn thành buổi chạy</Text>
      <Text style={styles.subtitle}>
        Bạn đã hoàn thành mục tiêu rèn luyện thể lực hôm nay.
      </Text>

      {/* Điểm nhấn chính: Quãng đường chạy */}
      <View style={styles.distanceBadge}>
        <Text style={styles.distanceValue}>{formatDistance(summary.distanceKm)}</Text>
        <Text style={styles.distanceUnit}>km</Text>
      </View>

      {/* Bảng chi tiết các chỉ số */}
      <View style={styles.list}>
        {rows.map((r, i) => (
          <View
            key={r.label}
            style={[styles.row, i > 0 && styles.rowBorder]}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.rowIconWrap, r.accent && styles.rowIconWrapAccent]}>
                <Ionicons
                  name={r.icon}
                  size={18}
                  color={r.accent ? colors.accent : colors.primary}
                />
              </View>
              <View>
                <Text style={styles.rowLabel}>{r.label}</Text>
                {r.hint ? <Text style={styles.rowHint}>{r.hint}</Text> : null}
              </View>
            </View>

            <Text style={[styles.rowValue, r.accent && styles.rowValueAccent]}>
              {r.value}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    trophyRing: {
      width: 80,
      height: 80,
      borderRadius: radius.pill,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    trophyIconWrap: {
      width: 60,
      height: 60,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.heavy,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: fontSize.body,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    distanceBadge: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.xl,
      marginVertical: spacing.xs,
    },
    distanceValue: {
      fontSize: fontSize.displayHero,
      fontWeight: fontWeight.heavy,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
      letterSpacing: -1.5,
    },
    distanceUnit: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.textMuted,
    },
    list: {
      alignSelf: 'stretch',
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    rowIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowIconWrapAccent: {
      backgroundColor: colors.accentLight,
    },
    rowLabel: {
      fontSize: fontSize.body,
      color: colors.textSecondary,
      fontWeight: fontWeight.medium,
    },
    rowHint: {
      fontSize: fontSize.micro,
      color: colors.textMuted,
    },
    rowValue: {
      fontSize: fontSize.subtitle,
      fontWeight: fontWeight.bold,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    rowValueAccent: {
      color: colors.accent,
    },
  });
