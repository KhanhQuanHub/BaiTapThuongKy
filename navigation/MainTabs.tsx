import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import RunScreen from '../screens/RunScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ThemeToggle from '../components/ui/ThemeToggle';
import {
  fontSize, fontWeight, layout, radius, shadow, spacing,
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
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView
      style={[styles.placeholderContainer, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.todayHeader}>
        <View style={styles.todayTitleWrap}>
          <Text style={[styles.placeholderText, { color: colors.text }]}>Hôm nay</Text>
          <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
            Kế hoạch rèn luyện thể lực và lịch trình trong ngày
          </Text>
        </View>
        <ThemeToggle size="sm" />
      </View>

      <View
        style={[
          styles.todayBanner,
          {
            backgroundColor: isDark ? '#1E293B' : '#DCFCE7',
            borderColor: isDark ? '#334155' : '#86EFAC',
          },
        ]}
      >
        <Ionicons
          name="fitness"
          size={28}
          color={colors.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.todayBannerTitle, { color: colors.text }]}>
            Sẵn sàng bứt phá hôm nay!
          </Text>
          <Text style={[styles.todayBannerSub, { color: colors.textMuted }]}>
            Mục tiêu chạy 5 km đang chờ bạn hoàn thành.
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
      <Text style={[styles.placeholderText, { color: colors.text }]}>Lịch tập</Text>
      <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
        Lịch theo dõi buổi tập tuần & danh sách bài tập gợi ý
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
      <Text style={[styles.placeholderText, { color: colors.text }]}>Thống kê</Text>
      <Text style={[styles.placeholderSub, { color: colors.textMuted }]}>
        Biểu đồ tiến độ calo, quãng đường và chuỗi ngày rèn luyện
      </Text>
    </SafeAreaView>
  );
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Today"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: fontSize.micro + 1,
          fontWeight: fontWeight.bold,
          marginTop: -2,
        },
        tabBarItemStyle: {
          minHeight: layout.minTouchSize,
          paddingVertical: spacing.xs,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: layout.minTouchSize + spacing.sm + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xs,
          paddingTop: spacing.xs,
          ...(isDark ? shadow.card : shadow.cardElevated),
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconConfig = TAB_ICONS[route.name];
          const iconName = focused ? iconConfig.active : iconConfig.inactive;
          return <Ionicons name={iconName} size={size ?? layout.iconSize} color={color} />;
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
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  todayTitleWrap: {
    flex: 1,
  },
  placeholderText: {
    fontSize: fontSize.headline,
    fontWeight: fontWeight.heavy,
  },
  placeholderSub: {
    fontSize: fontSize.body,
    marginTop: 4,
  },
  todayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  todayBannerTitle: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.bold,
  },
  todayBannerSub: {
    fontSize: fontSize.caption,
    marginTop: 2,
  },
});
