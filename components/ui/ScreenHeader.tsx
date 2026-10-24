import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  fontSize, fontWeight, radius, spacing,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';
import ThemeToggle from './ThemeToggle';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  rightAction?: ReactNode;
  showThemeToggle?: boolean;
};

export default function ScreenHeader({
  title,
  subtitle,
  badge,
  rightAction,
  showThemeToggle = false,
}: ScreenHeaderProps) {
  const { colors } = useTheme();

  const effectiveRightAction = rightAction ?? (showThemeToggle ? <ThemeToggle size="sm" /> : null);

  return (
    <View style={styles.container}>
      <View style={styles.titleArea}>
        <View style={styles.titleRow}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.text }]}
          >
            {title}
          </Text>
          {badge ? (
            <View style={[styles.badgeWrap, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primaryDark }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {effectiveRightAction ? <View style={styles.actionWrap}>{effectiveRightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  titleArea: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.headline,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.5,
  },
  badgeWrap: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.body,
    lineHeight: 22,
  },
  actionWrap: {
    marginLeft: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
