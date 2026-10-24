import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radius, spacing } from '../../constants/theme';

type Props = {
  label: string;
  tone?: 'primary' | 'warning';
  pulse?: boolean; // chấm nhấp nháy khi đang đo
};

const tones = {
  primary: { bg: colors.primaryLight, fg: colors.primaryDark, dot: colors.primary },
  warning: { bg: colors.accentLight, fg: colors.accent, dot: colors.warning },
};

export default function StatusBadge({ label, tone = 'primary', pulse }: Props) {
  const t = tones[tone];
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!pulse) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, opacity]);

  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
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
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  text: { fontSize: fontSize.caption, fontWeight: fontWeight.semibold },
});
