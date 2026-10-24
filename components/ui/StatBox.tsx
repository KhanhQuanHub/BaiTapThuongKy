import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import {
  fontSize, fontWeight, radius, spacing,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type StatTone = 'primary' | 'accent' | 'info';

export type StatBoxProps = {
  label: string;
  value: string;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: StatTone;
  caption?: string;   // Dòng trạng thái nhỏ, ví dụ "Mục tiêu 5 km"
  progress?: number;  // 0..1, thanh tiến độ
  large?: boolean;    // Số lớn nổi bật cho màn hình chạy bộ
  style?: ViewStyle;
  hint?: string;      // Giải thích ngắn 1 dòng cho người mới (ví dụ Pace: thời gian/1km)
};

// Chú thích tự động cho người mới nếu màn hình chưa truyền hint
const DEFAULT_HINTS: Record<string, string> = {
  Pace: 'Thời gian hoàn thành 1 km',
  'Nhịp bước': 'Số bước chân mỗi phút',
  Calo: 'Năng lượng ước tính tiêu thụ',
  'Số bước': 'Đo bằng cảm biến bước chân',
  'Quãng đường': 'Đo theo thời gian thực',
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
  hint,
}: StatBoxProps) {
  const { colors } = useTheme();

  const tones: Record<StatTone, { fg: string; bg: string }> = {
    primary: { fg: colors.primary, bg: colors.primaryLight },
    accent: { fg: colors.accent, bg: colors.accentLight },
    info: { fg: colors.info, bg: colors.infoLight },
  };

  const t = tones[tone];
  const autoHint = hint ?? DEFAULT_HINTS[label];

  return (
    <Card style={style}>
      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${label}: ${value} ${unit ?? ''}. ${caption ?? ''}`}
      >
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
            <Ionicons name={icon} size={large ? 20 : 16} color={t.fg} />
          </View>
          <View style={styles.labelCol}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            {autoHint && !large ? (
              <Text style={[styles.hintText, { color: colors.textMuted }]}>{autoHint}</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.valueRow, large && styles.valueRowLarge]}>
          <Text style={[styles.value, { color: colors.text }, large && styles.valueLarge]}>{value}</Text>
          {unit ? <Text style={[styles.unit, { color: colors.textMuted }, large && styles.unitLarge]}>{unit}</Text> : null}
        </View>

        {typeof progress === 'number' && (
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: t.fg,
                  width: `${Math.min(Math.max(progress, 0), 1) * 100}%`,
                },
              ]}
            />
          </View>
        )}

        {caption ? (
          <Text style={[styles.caption, { color: colors.textMuted }]}>{caption}</Text>
        ) : autoHint && large ? (
          <Text style={[styles.caption, { color: colors.textMuted }]}>{autoHint}</Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelCol: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
  hintText: {
    fontSize: fontSize.micro,
    marginTop: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  valueRowLarge: {
    marginTop: spacing.md,
  },
  value: {
    fontSize: fontSize.title + 2,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  valueLarge: {
    fontSize: fontSize.display,
    letterSpacing: -1,
  },
  unit: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },
  unitLarge: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.semibold,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  caption: {
    fontSize: fontSize.caption - 1,
    marginTop: spacing.sm,
    fontWeight: fontWeight.medium,
  },
});
