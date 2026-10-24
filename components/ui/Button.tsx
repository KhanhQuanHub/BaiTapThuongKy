import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, layout, radius, spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
};

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.textOnPrimary, border: colors.primary },
  secondary: { bg: colors.surface, fg: colors.primaryDark, border: colors.primary },
  danger: { bg: colors.danger, fg: colors.textOnPrimary, border: colors.danger },
  ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  size = 'md',
  disabled,
  style,
}: Props) {
  const p = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          minHeight: size === 'lg' ? layout.buttonHeight + spacing.sm : layout.buttonHeight,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={layout.iconSize} color={p.fg} />}
      <Text style={[styles.text, { color: p.fg }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  text: { fontSize: fontSize.subtitle, fontWeight: fontWeight.semibold },
});
