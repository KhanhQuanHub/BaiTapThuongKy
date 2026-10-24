import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';
import {
  colors, fontSize, fontWeight, radius, spacing,
} from '../constants/theme';
import { calculateBmi } from '../domain/bmi';
import { useAuthStore } from '../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  // Dữ liệu người dùng mẫu mặc định nếu chưa đăng nhập qua form
  const profile = {
    fullName: user?.fullName ?? 'Nguyễn Văn Fit',
    email: user?.email ?? 'nguyenvanfit@fitlog.vn',
    gender: user?.gender ?? 'Nam',
    height: user?.height ?? 172,
    weight: user?.weight ?? 66,
    healthCondition: user?.healthCondition ?? 'Không có (Khỏe mạnh)',
    workoutsPerWeek: user?.workoutsPerWeek ?? 4,
    currentGoal: user?.currentGoal ?? 'Giảm cân & Sức bền Cardio',
  };

  // Tính BMI tự động bằng hàm thuần trong domain/bmi.ts
  const bmiInfo = calculateBmi(profile.weight, profile.height);

  // Ký tự viết tắt cho avatar tròn
  const nameParts = profile.fullName.trim().split(' ');
  const initial = nameParts.length > 0
    ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    : 'F';

  const handleLogoutPress = () => {
    Alert.alert(
      'Đăng xuất khỏi FitLog?',
      'Bạn có chắc chắn muốn đăng xuất phiên làm việc hiện tại?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
      { cancelable: true }
    );
  };

  const infoRows = [
    { label: 'Giới tính', value: profile.gender },
    { label: 'Chiều cao', value: `${profile.height} cm` },
    { label: 'Cân nặng', value: `${profile.weight} kg` },
    {
      label: 'Chỉ số BMI',
      value: `${bmiInfo.bmi}`,
      badge: {
        text: bmiInfo.label,
        color: bmiInfo.color,
        bgColor: bmiInfo.bgColor,
      },
    },
    { label: 'Tình trạng sức khỏe', value: profile.healthCondition },
    { label: 'Số buổi tập / tuần', value: `${profile.workoutsPerWeek} buổi` },
    { label: 'Mục tiêu hiện tại', value: profile.currentGoal, accent: true },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Hồ sơ cá nhân"
          subtitle="Thông tin thể trạng và mục tiêu rèn luyện"
        />

        {/* Thẻ Avatar & Họ tên */}
        <Card style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile.fullName}</Text>
            <Text style={styles.userEmail}>{profile.email}</Text>
          </View>
        </Card>

        {/* Thẻ Thông tin cơ bản */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Thông tin cơ bản</Text>

          <View style={styles.list}>
            {infoRows.map((row, index) => (
              <View
                key={row.label}
                style={[styles.row, index > 0 && styles.rowBorder]}
              >
                <Text style={styles.rowLabel}>{row.label}</Text>

                <View style={styles.valueWrap}>
                  <Text
                    style={[
                      styles.rowValue,
                      row.accent && { color: colors.primaryDark, fontWeight: fontWeight.bold },
                    ]}
                  >
                    {row.value}
                  </Text>

                  {row.badge ? (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: row.badge.bgColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: row.badge.color },
                        ]}
                      >
                        {row.badge.text}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Ghi chú thể trạng dựa trên BMI */}
        <Card style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>Đánh giá thể trạng</Text>
          <Text style={styles.adviceText}>{bmiInfo.advice}</Text>
        </Card>

        {/* Nút Đăng xuất */}
        <View style={styles.logoutWrapper}>
          <Button
            title="Đăng xuất"
            variant="danger"
            icon="log-out-outline"
            size="lg"
            onPress={handleLogoutPress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.headline,
    fontWeight: fontWeight.bold,
    color: colors.textOnPrimary,
  },
  userInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  userEmail: {
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  infoCard: {
    gap: spacing.md,
  },
  cardSectionTitle: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    flex: 1,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowValue: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
  },
  adviceCard: {
    backgroundColor: colors.primaryLight,
    gap: spacing.xs,
  },
  adviceTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.primaryDark,
  },
  adviceText: {
    fontSize: fontSize.body,
    color: colors.primaryDark,
    lineHeight: 22,
  },
  logoutWrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
