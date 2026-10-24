import { useEffect, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { fontSize, fontWeight, layout, radius, shadow, spacing } from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type ThemeToggleProps = {
  variant?: 'button' | 'pill' | 'switch';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  showLabel?: boolean;
};

export default function ThemeToggle({
  variant = 'button',
  size = 'md',
  style,
  showLabel = false,
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  // Animation cho hiệu ứng xoay và phóng to thu nhỏ mượt mà
  const [rotateAnim] = useState(() => new Animated.Value(isDark ? 1 : 0));
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [switchSliderAnim] = useState(() => new Animated.Value(isDark ? 1 : 0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: isDark ? 1 : 0,
        useNativeDriver: true,
        friction: 6,
        tension: 50,
      }),
      Animated.spring(switchSliderAnim, {
        toValue: isDark ? 1 : 0,
        useNativeDriver: false,
        friction: 7,
        tension: 60,
      }),
    ]).start();
  }, [isDark, rotateAnim, switchSliderAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 18 : 22;

  // ================= PHIÊN BẢN SLIDER SWITCH (CÓ CẢ SUN VÀ MOON) =================
  if (variant === 'switch') {
    const switchWidth = isSmall ? 68 : 80;
    const switchHeight = isSmall ? 34 : 40;
    const thumbSize = switchHeight - 6;
    const translateX = switchSliderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [3, switchWidth - thumbSize - 3],
    });

    return (
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={isDark ? 'Chế độ tối đang bật. Chạm để chuyển sang sáng.' : 'Chế độ sáng đang bật. Chạm để chuyển sang tối.'}
        accessibilityState={{ checked: isDark }}
        onPress={toggleTheme}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.switchTrack,
          {
            width: switchWidth,
            height: switchHeight,
            backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
            borderColor: isDark ? '#334155' : '#CBD5E1',
          },
          style,
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', height: '100%' }}>
          {/* Biểu tượng mặt trời bên trái */}
          <View style={[styles.switchIconSlot, { left: 8 }]}>
            <Ionicons
              name="sunny"
              size={iconSize - 4}
              color={!isDark ? '#F59E0B' : '#64748B'}
            />
          </View>

          {/* Biểu tượng mặt trăng bên phải */}
          <View style={[styles.switchIconSlot, { right: 8 }]}>
            <Ionicons
              name="moon"
              size={iconSize - 4}
              color={isDark ? '#38BDF8' : '#94A3B8'}
            />
          </View>

          {/* Con trượt phát sáng tròn trượt qua lại */}
          <Animated.View
            style={[
              styles.switchThumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                transform: [{ translateX }],
                backgroundColor: isDark ? '#22C55E' : '#FFFFFF',
                shadowColor: isDark ? '#22C55E' : '#0F172A',
              },
            ]}
          >
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={thumbSize - 10}
              color={isDark ? '#FFFFFF' : '#D97706'}
            />
          </Animated.View>
        </Animated.View>
      </Pressable>
    );
  }

  // ================= PHIÊN BẢN PILL CÓ CHỮ KÈM ICON =================
  if (variant === 'pill') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          onPress={toggleTheme}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.pillButton,
            {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? '#334155' : '#E2E8F0',
              paddingVertical: isSmall ? spacing.xs : spacing.sm,
              paddingHorizontal: isSmall ? spacing.sm : spacing.md,
            },
            isDark ? shadow.subtle : shadow.card,
            style,
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={iconSize}
              color={isDark ? '#38BDF8' : '#F59E0B'}
            />
          </Animated.View>
          <Text
            style={[
              styles.pillText,
              {
                color: isDark ? '#F8FAFC' : '#0F172A',
                fontSize: isSmall ? fontSize.caption : fontSize.body,
              },
            ]}
          >
            {isDark ? 'Chế độ Tối' : 'Chế độ Sáng'}
          </Text>
        </Pressable>
      </Animated.View>
    );
  }

  // ================= PHIÊN BẢN NÚT TRÒN HEADER COMPACT (MẶC ĐỊNH) =================
  const buttonDimension = isSmall ? 36 : 42;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        onPress={toggleTheme}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.roundButton,
          {
            width: showLabel ? undefined : buttonDimension,
            height: buttonDimension,
            paddingHorizontal: showLabel ? spacing.md : 0,
            borderRadius: radius.pill,
            backgroundColor: isDark
              ? 'rgba(30, 41, 59, 0.85)'
              : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? '#334155' : '#E2E8F0',
          },
          isDark ? styles.darkGlow : styles.lightGlow,
          style,
        ]}
      >
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isDark
                ? 'rgba(56, 189, 248, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={iconSize}
            color={isDark ? '#38BDF8' : '#F59E0B'}
          />
        </Animated.View>

        {showLabel ? (
          <Text
            style={[
              styles.label,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
          >
            {isDark ? 'Tối' : 'Sáng'}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  roundButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: layout.minTouchSize,
    minWidth: layout.minTouchSize,
  },
  lightGlow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  darkGlow: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: spacing.xs,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillText: {
    fontWeight: fontWeight.semibold,
  },
  switchTrack: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  switchIconSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchThumb: {
    position: 'absolute',
    top: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
