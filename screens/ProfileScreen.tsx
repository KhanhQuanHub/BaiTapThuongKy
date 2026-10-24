import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ThemeSelectorCard from '../components/ui/ThemeSelectorCard';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  fontSize,
  fontWeight,
  layout,
  radius,
  shadow,
  spacing,
  ThemeColors,
} from '../constants/theme';
import { calculateBmi } from '../domain/bmi';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../store/themeStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [reminderEnabled, setReminderEnabled] = useState(true);

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
  const bmiInfo = calculateBmi(profile.weight, profile.height, colors);

  // Sải chân ước tính theo chiều cao (chuẩn FitLog: height * 0.415)
  const strideCm = Math.round(profile.height * 0.415 * 10) / 10;

  // Ký tự viết tắt cho avatar tròn
  const nameParts = profile.fullName.trim().split(' ');
  const initial = nameParts.length > 0
    ? nameParts[nameParts.length - 1].charAt(0).toUpperCase()
    : 'F';

  // Tính vị trí phần trăm con trỏ trên dải đo BMI (15 đến 35)
  const bmiGaugePercent = Math.min(
    Math.max(((bmiInfo.bmi - 15) / (35 - 15)) * 100, 5),
    95
  );

  const handleLogoutPress = () => {
    Alert.alert(
      'Đăng xuất khỏi FitLog?',
      'Bạn có chắc chắn muốn kết thúc phiên đăng nhập trên thiết bị này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
      ],
      { cancelable: true }
    );
  };

  const showMedicalDisclaimer = () => {
    Alert.alert(
      'Tuyên bố y tế FitLog',
      'Ứng dụng FitLog hỗ trợ tự quản lý lịch tập và tính năng lượng tiêu hao theo công thức tham chiếu. Ứng dụng không chẩn đoán bệnh, không đưa ra phác đồ điều trị và không thay thế lời khuyên y khoa từ bác sĩ.'
    );
  };

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const activeDaysCount = profile.workoutsPerWeek;

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HERO HEADER HIỆN ĐẠI ================= */}
        <LinearGradient
          colors={
            isDark
              ? ['#064e3b', '#0f766e']
              : [colors.primaryDark, colors.primary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          {/* Hàng trên cùng: Tiêu đề & Cụm nút chuyển Theme + Chỉnh sửa */}
          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>Hồ sơ cá nhân</Text>
            <View style={styles.heroActionsRow}>
              {/* Nút chuyển đổi nhanh Light / Dark siêu mượt */}
              <ThemeToggle size="sm" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa hồ sơ cá nhân"
                style={styles.editBtn}
                onPress={() => Alert.alert('Thông báo', 'Tính năng chỉnh sửa hồ sơ chi tiết sẽ sớm ra mắt.')}
              >
                <Ionicons name="create-outline" size={20} color={colors.textOnPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Avatar & Thông tin tên người dùng */}
          <View style={styles.heroUserSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
              <View style={styles.badgePro}>
                <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.heroMeta}>
              <Text style={styles.userName}>{profile.fullName}</Text>
              <Text style={styles.userEmail}>{profile.email}</Text>
              <View style={styles.tierPill}>
                <Text style={styles.tierPillText}>Hội viên FitLog Pro</Text>
              </View>
            </View>
          </View>

          {/* Thẻ vắn tắt 3 chỉ số nhanh trên nền Header */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>5</Text>
              <Text style={styles.heroStatLabel}>Ngày streak</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>{profile.workoutsPerWeek}</Text>
              <Text style={styles.heroStatLabel}>Buổi/tuần</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatNumber}>{bmiInfo.bmi}</Text>
              <Text style={styles.heroStatLabel}>Chỉ số BMI</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.bodyContent}>
          {/* ================= THẺ BMI TỰ ĐỘNG THÔNG MINH ================= */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Ionicons name="pulse" size={20} color={colors.primary} />
                <Text style={styles.cardTitle}>Thể trạng & Chỉ số BMI</Text>
              </View>
              <View style={[styles.bmiStatusBadge, { backgroundColor: bmiInfo.bgColor }]}>
                <Text style={[styles.bmiStatusText, { color: bmiInfo.color }]}>
                  {bmiInfo.label}
                </Text>
              </View>
            </View>

            <View style={styles.bmiValueRow}>
              <Text style={styles.bmiLargeNumber}>{bmiInfo.bmi}</Text>
              <Text style={styles.bmiUnit}>kg/m²</Text>
              <Text style={styles.bmiFormulaLabel}>(WHO Tiêu chuẩn Châu Á)</Text>
            </View>

            {/* Dải đo phân đoạn BMI */}
            <View style={styles.gaugeTrackContainer}>
              <View style={styles.gaugeTrack}>
                <View style={[styles.gaugeSegment, { backgroundColor: colors.info, flex: 3.5 }]} />
                <View style={[styles.gaugeSegment, { backgroundColor: colors.primary, flex: 6.5 }]} />
                <View style={[styles.gaugeSegment, { backgroundColor: colors.accent, flex: 5 }]} />
                <View style={[styles.gaugeSegment, { backgroundColor: colors.danger, flex: 5 }]} />
              </View>

              {/* Con trỏ định vị giá trị BMI hiện tại */}
              <View style={[styles.gaugePointer, { left: `${bmiGaugePercent}%` }]}>
                <View style={[styles.pointerPin, { borderColor: bmiInfo.color }]} />
              </View>
            </View>

            {/* Nhãn 4 mốc phân loại */}
            <View style={styles.gaugeLabelsRow}>
              <Text style={styles.gaugeLabelText}>Gầy (&lt;18.5)</Text>
              <Text style={styles.gaugeLabelText}>Chuẩn (18.5-24.9)</Text>
              <Text style={styles.gaugeLabelText}>Thừa (25-29.9)</Text>
              <Text style={styles.gaugeLabelText}>Béo (≥30)</Text>
            </View>

            {/* Lời khuyên sức khỏe */}
            <View style={[styles.adviceBox, { backgroundColor: bmiInfo.bgColor }]}>
              <Ionicons name="medkit-outline" size={18} color={bmiInfo.color} />
              <Text style={[styles.adviceText, { color: bmiInfo.color }]}>
                {bmiInfo.advice}
              </Text>
            </View>
          </Card>

          {/* ================= LƯỚI 3 CHỈ SỐ HÌNH THỂ ================= */}
          <View style={styles.metricGrid}>
            <Card style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="scale-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.metricValue}>{profile.weight} kg</Text>
              <Text style={styles.metricLabel}>Cân nặng</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="resize-outline" size={22} color={colors.accent} />
              </View>
              <Text style={styles.metricValue}>{profile.height} cm</Text>
              <Text style={styles.metricLabel}>Chiều cao</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="footsteps-outline" size={22} color={colors.info} />
              </View>
              <Text style={styles.metricValue}>{strideCm} cm</Text>
              <Text style={styles.metricLabel}>Sải chân chạy</Text>
            </Card>
          </View>

          {/* ================= MỤC TIÊU & LỊCH TRÌNH ================= */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleWrap}>
                <Ionicons name="flame" size={20} color={colors.accent} />
                <Text style={styles.cardTitle}>Kế hoạch & Mục tiêu tập luyện</Text>
              </View>
            </View>

            {/* Thẻ mục tiêu chính */}
            <View style={styles.goalBanner}>
              <View style={styles.goalIcon}>
                <Ionicons name="trophy" size={24} color={colors.accent} />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalSubtitle}>Mục tiêu rèn luyện</Text>
                <Text style={styles.goalTitle}>{profile.currentGoal}</Text>
              </View>
            </View>

            {/* Tần suất tập luyện tuần */}
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleLabel}>Lịch tập hàng tuần</Text>
                <Text style={styles.scheduleValue}>{profile.workoutsPerWeek} buổi / tuần</Text>
              </View>
              <View style={styles.daysStrip}>
                {daysOfWeek.map((day, idx) => {
                  const isActive = idx < activeDaysCount;
                  return (
                    <View
                      key={day}
                      style={[
                        styles.dayChip,
                        isActive && styles.dayChipActive,
                      ]}
                    >
                      <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* An toàn thể trạng & bệnh nền */}
            <View style={styles.safetyBox}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <View style={styles.safetyInfo}>
                <Text style={styles.safetyTitle}>Tình trạng bệnh nền</Text>
                <Text style={styles.safetyDesc}>{profile.healthCondition}</Text>
              </View>
            </View>
          </Card>

          {/* ================= GIAO DIỆN THEME LIGHT / DARK CAO CẤP ================= */}
          <ThemeSelectorCard />

          {/* ================= CÀI ĐẶT & TIỆN ÍCH ================= */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Cài đặt & Tiện ích</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                <View>
                  <Text style={styles.settingTitle}>Nhắc nhở giờ tập hàng ngày</Text>
                  <Text style={styles.settingDesc}>Nhận thông báo động viên vào 06:30 sáng</Text>
                </View>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              style={styles.settingItemPressable}
              onPress={showMedicalDisclaimer}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="document-text-outline" size={22} color={colors.textMuted} />
                <View>
                  <Text style={styles.settingTitle}>Tuyên bố trách nhiệm y tế</Text>
                  <Text style={styles.settingDesc}>Quy chuẩn an toàn sức khỏe cá nhân</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Card>

          {/* ================= NÚT ĐĂNG XUẤT ================= */}
          <View style={styles.logoutSection}>
            <Button
              title="Đăng xuất khỏi FitLog"
              variant="danger"
              icon="log-out-outline"
              size="lg"
              onPress={handleLogoutPress}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: isDark ? '#064e3b' : colors.primaryDark,
    },
    scrollContent: {
      backgroundColor: colors.background,
    },
    heroHeader: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      borderBottomLeftRadius: radius.lg * 2,
      borderBottomRightRadius: radius.lg * 2,
      gap: spacing.lg,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    heroTitle: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.textOnPrimary,
    },
    editBtn: {
      width: layout.minTouchSize,
      height: layout.minTouchSize,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroUserSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatarWrap: {
      position: 'relative',
    },
    avatarCircle: {
      width: 76,
      height: 76,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: 'rgba(255, 255, 255, 0.8)',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
    avatarInitial: {
      fontSize: fontSize.headline,
      fontWeight: fontWeight.bold,
      color: colors.primaryDark,
    },
    badgePro: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.accent,
      width: 22,
      height: 22,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    heroMeta: {
      flex: 1,
      gap: spacing.xs / 2,
    },
    userName: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.textOnPrimary,
    },
    userEmail: {
      fontSize: fontSize.caption,
      color: 'rgba(255, 255, 255, 0.85)',
    },
    tierPill: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
      borderRadius: radius.pill,
      marginTop: spacing.xs,
    },
    tierPillText: {
      fontSize: fontSize.caption - 1,
      fontWeight: fontWeight.semibold,
      color: colors.textOnPrimary,
    },
    heroStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    heroStatItem: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs / 2,
    },
    heroStatNumber: {
      fontSize: fontSize.subtitle,
      fontWeight: fontWeight.bold,
      color: colors.textOnPrimary,
    },
    heroStatLabel: {
      fontSize: fontSize.caption - 1,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    heroStatDivider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    bodyContent: {
      padding: layout.screenPadding,
      gap: spacing.lg,
      marginTop: -spacing.md,
    },
    card: {
      gap: spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    cardTitle: {
      fontSize: fontSize.subtitle,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    bmiStatusBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
    },
    bmiStatusText: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    bmiValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    bmiLargeNumber: {
      fontSize: fontSize.headline + 4,
      fontWeight: fontWeight.bold,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    bmiUnit: {
      fontSize: fontSize.body,
      color: colors.textMuted,
      fontWeight: fontWeight.medium,
    },
    bmiFormulaLabel: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
      marginLeft: spacing.sm,
    },
    gaugeTrackContainer: {
      position: 'relative',
      height: 14,
      justifyContent: 'center',
      marginVertical: spacing.xs,
    },
    gaugeTrack: {
      flexDirection: 'row',
      height: 8,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    gaugeSegment: {
      height: '100%',
    },
    gaugePointer: {
      position: 'absolute',
      marginLeft: -6,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pointerPin: {
      width: 14,
      height: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 3,
      ...shadow.card,
    },
    gaugeLabelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    gaugeLabelText: {
      fontSize: fontSize.caption - 2,
      color: colors.textMuted,
    },
    adviceBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    adviceText: {
      flex: 1,
      fontSize: fontSize.body - 1,
      lineHeight: 20,
      fontWeight: fontWeight.medium,
    },
    metricGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    metricCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xs,
      gap: spacing.xs,
    },
    metricIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    metricValue: {
      fontSize: fontSize.subtitle,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    metricLabel: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
    },
    goalBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: isDark ? 'rgba(251, 146, 60, 0.15)' : colors.accentLight,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    goalIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    goalInfo: {
      flex: 1,
      gap: spacing.xs / 2,
    },
    goalSubtitle: {
      fontSize: fontSize.caption,
      color: colors.accent,
      fontWeight: fontWeight.medium,
    },
    goalTitle: {
      fontSize: fontSize.subtitle,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    scheduleRow: {
      gap: spacing.sm,
    },
    scheduleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    scheduleLabel: {
      fontSize: fontSize.body,
      color: colors.textMuted,
    },
    scheduleValue: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    daysStrip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    dayChip: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayText: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.semibold,
      color: colors.textMuted,
    },
    dayTextActive: {
      color: colors.textOnPrimary,
    },
    safetyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : colors.primaryLight,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    safetyInfo: {
      flex: 1,
      gap: spacing.xs / 2,
    },
    safetyTitle: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    safetyDesc: {
      fontSize: fontSize.body,
      color: colors.primary,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    settingItemPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    settingTitle: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      color: colors.text,
    },
    settingDesc: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
    },
    logoutSection: {
      marginTop: spacing.xs,
      marginBottom: spacing.xxl,
    },
  });
