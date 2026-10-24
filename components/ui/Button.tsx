import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fontSize, fontWeight, layout, radius, shadow, spacing,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  subtext?: string;
  loading?: boolean;
  accessibilityLabel?: string;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  size = 'md',
  disabled,
  style,
  subtext,
  loading = false,
  accessibilityLabel,
}: ButtonProps) {
  const { colors } = useTheme();

  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: colors.textOnPrimary, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.border },
    danger: { bg: colors.danger, fg: colors.textOnPrimary, border: colors.danger },
    ghost: { bg: 'transparent', fg: colors.textMuted, border: 'transparent' },
  };

  const p = palette[variant];
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const isLarge = size === 'lg';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: disabled || loading }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: p.bg,
            borderColor: p.border,
            minHeight: isLarge ? layout.buttonHeight + 4 : layout.buttonHeight,
            opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
          },
          variant === 'primary' && !disabled && shadow.glowPrimary,
          variant === 'secondary' && shadow.subtle,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={p.fg} />
        ) : (
          <>
            {icon ? (
              <Ionicons
                name={icon}
                size={isLarge ? 22 : 18}
                color={p.fg}
                style={styles.iconStyle}
              />
            ) : null}
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.text,
                  {
                    color: p.fg,
                    fontSize: isLarge ? fontSize.subtitle : fontSize.body,
                  },
                ]}
              >
                {title}
              </Text>
              {subtext ? (
                <Text style={[styles.subtext, { color: p.fg }]}>{subtext}</Text>
              ) : null}
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    minWidth: layout.minTouchSize,
  },
  iconStyle: {
    marginRight: spacing.sm,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  subtext: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.medium,
    opacity: 0.85,
    marginTop: 1,
  },
});
