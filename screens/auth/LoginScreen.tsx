import { useState } from 'react';
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
import {
  colors, fontSize, fontWeight, layout, radius, spacing,
} from '../../constants/theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập địa chỉ email')
    .email('Email không đúng định dạng'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [secureText, setSecureText] = useState(true);
  const { login, isLoading } = useAuthStore();

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Tiêu đề ứng dụng */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Ionicons name="fitness" size={44} color={colors.primaryDark} />
            </View>
            <Text style={styles.brandTitle}>FitLog</Text>
            <Text style={styles.brandSubtitle}>
              Theo dõi tập luyện & sức khỏe cá nhân
            </Text>
          </View>

          {/* Form đăng nhập */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Đăng nhập</Text>

            <View style={styles.fieldsContainer}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="ví dụ: fitlog@domain.com"
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
                    placeholder="Tối thiểu 6 ký tự"
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
              title={isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              icon="log-in-outline"
              size="lg"
              disabled={isLoading}
              onPress={handleSubmit(onSubmit)}
            />
          </Card>

          {/* Gợi ý tài khoản kiểm thử */}
          <Card style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.demoTitle}>Tài khoản thử nghiệm sẵn</Text>
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
              title="Điền nhanh tài khoản mẫu"
              variant="secondary"
              icon="flash-outline"
              onPress={fillDemoAccount}
            />
          </Card>

          {/* Chuyển sang màn hình Đăng ký */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Chưa có tài khoản?</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.linkText}>Đăng ký</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: layout.screenPadding,
    gap: spacing.xl,
  },
  brandHeader: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  brandTitle: {
    fontSize: fontSize.display - 16,
    fontWeight: fontWeight.bold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  formCard: {
    gap: spacing.lg,
  },
  formTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  fieldsContainer: {
    gap: spacing.md,
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
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  demoCard: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.info,
    borderWidth: 1,
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
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});
