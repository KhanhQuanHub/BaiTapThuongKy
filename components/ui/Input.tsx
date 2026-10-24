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
  fontSize, fontWeight, layout, radius, shadow, spacing,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
};

const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  ...props
}, ref) => {
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
            borderColor: colors.border,
          },
          isFocused && { borderColor: colors.primary },
          Boolean(error) && { borderColor: colors.danger },
          isFocused && shadow.subtle,
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
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          {...props}
        />

        {rightIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nút chức năng nhập liệu"
            style={styles.rightIconWrap}
            onPress={onRightIconPress}
            hitSlop={{ top: spacing.sm, bottom: spacing.sm, left: spacing.sm, right: spacing.sm }}
          >
            <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hintText, { color: colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.body,
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
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.body,
    paddingVertical: spacing.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  errorText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
  },
  hintText: {
    fontSize: fontSize.caption - 1,
  },
});
