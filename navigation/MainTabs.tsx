import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import RunScreen from '../screens/RunScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {
  colors, fontSize, fontWeight, layout, spacing,
} from '../constants/theme';

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
  return (
    <SafeAreaView style={styles.placeholderContainer} edges={['top', 'left', 'right']}>
      <Text style={styles.placeholderText}>Hôm nay</Text>
    </SafeAreaView>
  );
}

function ScheduleScreen() {
  return (
    <SafeAreaView style={styles.placeholderContainer} edges={['top', 'left', 'right']}>
      <Text style={styles.placeholderText}>Lịch tập</Text>
    </SafeAreaView>
  );
}

function StatsScreen() {
  return (
    <SafeAreaView style={styles.placeholderContainer} edges={['top', 'left', 'right']}>
      <Text style={styles.placeholderText}>Thống kê</Text>
    </SafeAreaView>
  );
}

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Today"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: fontSize.caption,
          fontWeight: fontWeight.medium,
        },
        tabBarItemStyle: {
          minHeight: layout.minTouchSize,
          paddingVertical: spacing.xs,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: layout.minTouchSize + spacing.sm + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xs,
          paddingTop: spacing.xs,
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
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});
