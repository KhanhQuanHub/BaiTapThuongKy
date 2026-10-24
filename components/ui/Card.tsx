import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { radius, shadow, spacing } from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type CardProps = {
  children: ReactNode;
  style?: ViewStyle | (ViewStyle | undefined)[];
  elevated?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export default function Card({
  children,
  style,
  elevated = false,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const { colors, isDark } = useTheme();

  const dynamicCardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };

  const cardStyle = [
    styles.card,
    dynamicCardStyle,
    elevated ? (isDark ? shadow.card : shadow.cardElevated) : shadow.card,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
