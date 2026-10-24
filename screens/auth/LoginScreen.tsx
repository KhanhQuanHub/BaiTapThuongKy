import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ThemeToggle from '../../components/ui/ThemeToggle';
import {
  fontSize,
  fontWeight,
  layout,
  radius,
  shadow,
  spacing,
  ThemeColors,
} from '../../constants/theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../store/themeStore';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Email không đúng định dạng (ví dụ: ten@fitlog.vn)'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [secureText, setSecureText] = useState(true);
  const { login, isLoading } = useAuthStore();
  const { colors, isDark } = useTheme();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'test@fitlog.vn',
      password: '123456',
    },
  });

  const fillDemoAccount = () => {
    setValue('email', 'test@fitlog.vn', { shouldValidate: true });
    setValue('password', '123456', { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    await login(data.email, data.password);
  };

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Thanh trên cùng chứa nút Theme Switcher */}
          <View style={styles.topBar}>
            <View />
            <ThemeToggle size="sm" />
          </View>

          {/* Logo & Tiêu đề ứng dụng */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Ionicons name="fitness" size={44} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>FitLog</Text>
            <Text style={styles.brandSubtitle}>
              Quản lý luyện tập & sức khỏe cá nhân dễ dàng
            </Text>
          </View>

          {/* Form đăng nhập */}
          <Card elevated style={styles.formCard}>
            <Text style={styles.formTitle}>Chào mừng bạn trở lại</Text>
            <Text style={styles.formDesc}>Đăng nhập để tiếp tục lộ trình rèn luyện hôm nay</Text>

            <View style={styles.fieldsContainer}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Địa chỉ email"
                    placeholder="ví dụ: ten@fitlog.vn"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    leftIcon="mail-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Mật khẩu"
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    secureTextEntry={secureText}
                    autoCapitalize="none"
                    leftIcon="lock-closed-outline"
                    rightIcon={secureText ? 'eye-outline' : 'eye-off-outline'}
                    onRightIconPress={() => setSecureText((prev) => !prev)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />
            </View>

            <Button
              title="Đăng nhập ngay"
              icon="log-in-outline"
              size="lg"
              loading={isLoading}
              onPress={handleSubmit(onSubmit)}
            />
          </Card>

          {/* Thẻ tài khoản thử nghiệm nhanh */}
          <Card style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="flash-outline" size={18} color={colors.info} />
              <Text style={styles.demoTitle}>Tài khoản thử nghiệm sẵn có</Text>
            </View>
            <View style={styles.demoContent}>
              <View style={styles.demoRow}>
                <Text style={styles.demoLabel}>Email:</Text>
                <Text style={styles.demoValue}>test@fitlog.vn</Text>
              </View>
              <View style={styles.demoRow}>
                <Text style={styles.demoLabel}>Mật khẩu:</Text>
                <Text style={styles.demoValue}>123456</Text>
              </View>
            </View>
            <Button
              title="Điền sẵn tài khoản mẫu"
              variant="secondary"
              size="md"
              icon="copy-outline"
              onPress={fillDemoAccount}
            />
          </Card>

          {/* Liên kết điều hướng sang Đăng ký */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Chưa có tài khoản FitLog?</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chuyển đến màn hình đăng ký tài khoản"
              onPress={() => navigation.navigate('Register')}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Đăng ký ngay</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.xs,
    },
    brandHeader: {
      alignItems: 'center',
      gap: spacing.xs / 2,
    },
    logoBadge: {
      width: 84,
      height: 84,
      borderRadius: radius.pill,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
      borderWidth: 2,
      borderColor: colors.surface,
      ...shadow.card,
    },
    brandTitle: {
      fontSize: fontSize.display - 14,
      fontWeight: fontWeight.heavy,
      color: colors.primary,
      letterSpacing: -0.5,
    },
    brandSubtitle: {
      fontSize: fontSize.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    formCard: {
      gap: spacing.md,
    },
    formTitle: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.text,
      letterSpacing: -0.3,
    },
    formDesc: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
      marginTop: -spacing.xs / 2,
    },
    fieldsContainer: {
      gap: spacing.md,
      marginVertical: spacing.xs,
    },
    demoCard: {
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderColor: isDark ? '#334155' : colors.infoLight,
      borderWidth: 1.5,
    },
    demoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    demoTitle: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      color: colors.info,
    },
    demoContent: {
      gap: spacing.xs,
    },
    demoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    demoLabel: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
    },
    demoValue: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
    },
    footerText: {
      fontSize: fontSize.body,
      color: colors.textMuted,
    },
    linkButton: {
      minHeight: layout.minTouchSize,
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    linkText: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
  });
