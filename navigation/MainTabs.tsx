// ============================================================================
// navigation/MainTabs.tsx
// Thanh điều hướng 5 tab dưới đáy theo chuẩn Material 3 / iOS:
// - 5 tab với nhãn ngắn gọn: Hôm nay, Lịch tập, Chạy bộ, Thống kê, Hồ sơ.
// - Trạng thái đang chọn rõ ràng (nền pill nhẹ + icon đặc + màu xanh chủ đạo).
// - Đảm bảo vùng chạm >= 44px, đồng bộ hoàn toàn Sáng / Tối.
// ============================================================================

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import RunScreen from '../screens/RunScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../constants/theme';
import { useTheme } from '../store/themeStore';

export type MainTabParamList = {
  Today: undefined;
  Schedule: undefined;
  Run: undefined;
  Stats: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconConfig = {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
};

const TAB_ICONS: Record<keyof MainTabParamList, TabIconConfig> = {
  Today: { active: 'home', inactive: 'home-outline' },
  Schedule: { active: 'calendar', inactive: 'calendar-outline' },
  Run: { active: 'footsteps', inactive: 'footsteps-outline' },
  Stats: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function TodayScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.placeholderContainer, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Text style={[styles.screenTitle, { color: colors.text }]}>Hôm nay</Text>

      <View
        style={[
          styles.todayCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="fitness-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.todayTextCol}>
          <Text style={[styles.todayBannerTitle, { color: colors.text }]}>
            Mục tiêu hôm nay: 5.0 km
          </Text>
          <Text style={[styles.todayBannerSub, { color: colors.textMuted }]}>
            Chuyển sang tab Chạy bộ để bắt đầu buổi tập
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ScheduleScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.placeholderContainer, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Text style={[styles.screenTitle, { color: colors.text }]}>Lịch tập</Text>
      <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
        Lịch tập luyện trong tuần
      </Text>
    </SafeAreaView>
  );
}

function StatsScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.placeholderContainer, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Text style={[styles.screenTitle, { color: colors.text }]}>Thống kê</Text>
      <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
        Tổng hợp quãng đường và năng lượng tiêu hao
      </Text>
    </SafeAreaView>
  );
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Today"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: fontWeight.semibold,
          marginTop: 2,
        },
        tabBarItemStyle: {
          minHeight: layout.minTouchSize,
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarIcon: ({ focused, color }) => {
          const iconConfig = TAB_ICONS[route.name];
          const iconName = focused ? iconConfig.active : iconConfig.inactive;
          return (
            <View
              style={[
                styles.iconPill,
                focused && { backgroundColor: colors.primaryLight },
              ]}
            >
              <Ionicons name={iconName} size={20} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarLabel: 'Hôm nay' }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ tabBarLabel: 'Lịch tập' }}
      />
      <Tab.Screen
        name="Run"
        component={RunScreen}
        options={{ tabBarLabel: 'Chạy bộ' }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: 'Thống kê' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Hồ sơ' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  screenTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  placeholderSub: {
    fontSize: fontSize.body,
  },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayTextCol: {
    flex: 1,
    gap: 2,
  },
  todayBannerTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  todayBannerSub: {
    fontSize: fontSize.caption,
  },
  iconPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
