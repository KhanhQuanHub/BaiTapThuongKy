// ============================================================================
// components/ui/Input.tsx
// Ô nhập liệu chuẩn công thái học (Material 3 / iOS):
// - Nhãn nằm phía trên, placeholder gợi ý rõ ràng, nút mắt ẩn/hiện mật khẩu.
// - Chuyển tiếp đầy đủ sự kiện onBlur / onFocus cho react-hook-form để chỉ báo lỗi
//   sau khi người dùng rời ô (onBlur) hoặc nhấn nút gửi.
// - Khi có lỗi: viền ô đổi sang màu báo lỗi (colors.danger) và hiển thị lỗi ngay bên dưới.
// - Chữ tối thiểu 14sp, vùng chạm tối thiểu 44px.
// ============================================================================

import { ComponentRef, forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  rightIconLabel?: string;
  containerStyle?: ViewStyle;
};

const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      rightIconLabel = 'Hiện hoặc ẩn mật khẩu',
      containerStyle,
      secureTextEntry,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surface,
              borderColor: error
                ? colors.danger
                : isFocused
                  ? colors.primary
                  : colors.border,
            },
          ]}
        >
          {leftIcon ? (
            <View style={styles.leftIconWrap}>
              <Ionicons
                name={leftIcon}
                size={20}
                color={error ? colors.danger : isFocused ? colors.primary : colors.textMuted}
              />
            </View>
          ) : null}

          <TextInput
            ref={ref}
            style={[styles.textInput, { color: colors.text }]}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={secureTextEntry}
            accessibilityLabel={label}
            {...props}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
          />

          {rightIcon ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rightIconLabel}
              style={styles.rightIconWrap}
              onPress={onRightIconPress}
              hitSlop={8}
            >
              <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : hint ? (
          <Text style={[styles.hintText, { color: colors.textMuted }]}>{hint}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: layout.buttonHeight,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  leftIconWrap: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrap: {
    minWidth: layout.minTouchSize,
    minHeight: layout.minTouchSize,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.body,
    paddingVertical: spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  hintText: {
    fontSize: fontSize.caption,
  },
});
