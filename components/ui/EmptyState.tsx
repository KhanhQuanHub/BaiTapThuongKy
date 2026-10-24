import { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fontSize, fontWeight, radius, shadow, spacing, ThemeColors,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  tip?: string;
  children?: ReactNode;
};

export default function EmptyState({
  icon,
  title,
  message,
  tip,
  children,
}: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconOuterRing}>
        <View style={styles.iconInnerCircle}>
          <Ionicons name={icon} size={44} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {tip ? (
        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={16} color={colors.warning} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ) : null}

      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      gap: spacing.md,
    },
    iconOuterRing: {
      width: 104,
      height: 104,
      borderRadius: radius.pill,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : colors.primaryGlow,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      ...shadow.subtle,
    },
    iconInnerCircle: {
      width: 80,
      height: 80,
      borderRadius: radius.pill,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    message: {
      fontSize: fontSize.body,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 320,
    },
    tipBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : colors.warningLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      marginTop: spacing.xs,
    },
    tipText: {
      fontSize: fontSize.caption - 1,
      color: colors.warning,
      fontWeight: fontWeight.medium,
    },
    actions: {
      alignSelf: 'stretch',
      gap: spacing.md,
      marginTop: spacing.md,
    },
  });
