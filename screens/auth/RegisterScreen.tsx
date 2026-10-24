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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenHeader from '../../components/ui/ScreenHeader';
import {
  colors, fontSize, fontWeight, layout, spacing,
} from '../../constants/theme';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { useAuthStore } from '../../store/authStore';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(50, 'Họ tên quá dài'),
    email: z
      .string()
      .min(1, 'Vui lòng nhập email')
      .email('Email không đúng định dạng'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có tối thiểu 6 ký tự'),
    confirmPassword: z
      .string()
      .min(1, 'Vui lòng xác nhận lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const { register: registerUser, isLoading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser(data.fullName, data.email, data.password);
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
          <ScreenHeader
            title="Tạo tài khoản"
            subtitle="Đăng ký hồ sơ để bắt đầu lộ trình luyện tập"
          />

          <Card style={styles.formCard}>
            <View style={styles.fieldsContainer}>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Họ và tên"
                    placeholder="ví dụ: Nguyễn Văn An"
                    autoCapitalize="words"
                    leftIcon="person-outline"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.fullName?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="ví dụ: an.nguyen@fitlog.vn"
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
                    secureTextEntry={securePassword}
                    autoCapitalize="none"
                    leftIcon="lock-closed-outline"
                    rightIcon={securePassword ? 'eye-outline' : 'eye-off-outline'}
                    onRightIconPress={() => setSecurePassword((prev) => !prev)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nhập lại mật khẩu"
                    placeholder="Nhập lại chính xác mật khẩu trên"
                    secureTextEntry={secureConfirm}
                    autoCapitalize="none"
                    leftIcon="shield-checkmark-outline"
                    rightIcon={secureConfirm ? 'eye-outline' : 'eye-off-outline'}
                    onRightIconPress={() => setSecureConfirm((prev) => !prev)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />
            </View>

            <Button
              title={isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              icon="checkmark-circle-outline"
              size="lg"
              disabled={isLoading}
              onPress={handleSubmit(onSubmit)}
            />
          </Card>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Đã có tài khoản?</Text>
            <Pressable
              accessibilityRole="button"
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>Đăng nhập</Text>
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
    padding: layout.screenPadding,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  formCard: {
    gap: spacing.lg,
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
});
