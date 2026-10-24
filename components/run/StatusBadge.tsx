import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { fontSize, fontWeight, radius, spacing } from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type StatusBadgeProps = {
  label: string;
  tone?: 'primary' | 'warning' | 'info';
  pulse?: boolean;
};

export default function StatusBadge({ label, tone = 'primary', pulse }: StatusBadgeProps) {
  const { colors } = useTheme();

  const tones = {
    primary: { bg: colors.primaryLight, fg: colors.primary, dot: colors.primary },
    warning: { bg: colors.warningLight, fg: colors.warning, dot: colors.warning },
    info: { bg: colors.infoLight, fg: colors.info, dot: colors.info },
  };

  const t = tones[tone];
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!pulse) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, opacity]);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Trạng thái: ${label}`}
      style={[styles.badge, { backgroundColor: t.bg }]}
    >
      <Animated.View style={[styles.dot, { backgroundColor: t.dot, opacity }]} />
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
});
