import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from './Card';
import ThemeToggle from './ThemeToggle';
import {
  fontSize,
  fontWeight,
  radius,
  shadow,
  spacing,
  ThemeMode,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

type OptionConfig = {
  mode: ThemeMode;
  label: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  previewBg: string;
  previewCardBg: string;
  previewHeaderBg: string;
  previewLineBg: string;
};

const THEME_OPTIONS: OptionConfig[] = [
  {
    mode: 'light',
    label: 'Sáng',
    tag: 'Rõ nét ngoài trời',
    icon: 'sunny',
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
    previewBg: '#F8FAFC',
    previewCardBg: '#FFFFFF',
    previewHeaderBg: '#16A34A',
    previewLineBg: '#CBD5E1',
  },
  {
    mode: 'dark',
    label: 'Tối',
    tag: 'Dịu mắt ban đêm',
    icon: 'moon',
    iconColor: '#38BDF8',
    iconBg: 'rgba(56, 189, 248, 0.15)',
    previewBg: '#0B0F19',
    previewCardBg: '#1E293B',
    previewHeaderBg: '#22C55E',
    previewLineBg: '#475569',
  },
  {
    mode: 'system',
    label: 'Tự động',
    tag: 'Theo thiết bị',
    icon: 'phone-portrait-outline',
    iconColor: '#818CF8',
    iconBg: 'rgba(129, 140, 248, 0.15)',
    previewBg: '#1E293B',
    previewCardBg: '#334155',
    previewHeaderBg: '#10B981',
    previewLineBg: '#94A3B8',
  },
];

export default function ThemeSelectorCard() {
  const { themeMode, setThemeMode, isDark, colors } = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* ================= TIÊU ĐỀ THẺ ================= */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <View
            style={[
              styles.headerIconWrap,
              { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7' },
            ]}
          >
            <Ionicons
              name="contrast-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Giao diện hiển thị
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {themeMode === 'system'
                ? 'Đang đồng bộ tự động theo cài đặt máy'
                : isDark
                ? 'Đang bật chế độ tối (Dark Mode)'
                : 'Đang bật chế độ sáng (Light Mode)'}
            </Text>
          </View>
        </View>

        {/* Nút switch trượt micro-interaction nhanh */}
        <ThemeToggle variant="switch" size="sm" />
      </View>

      {/* ================= 3 LỰA CHỌN GIAO DIỆN TRỰC QUAN ================= */}
      <View style={styles.optionsRow}>
        {THEME_OPTIONS.map((opt) => {
          const isSelected = themeMode === opt.mode;

          return (
            <Pressable
              key={opt.mode}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`Chọn giao diện ${opt.label}: ${opt.tag}`}
              onPress={() => setThemeMode(opt.mode)}
              style={({ pressed }) => [
                styles.optionItem,
                {
                  backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                isSelected && (isDark ? styles.selectedDarkBorder : styles.selectedLightBorder),
                pressed && styles.optionPressed,
              ]}
            >
              {/* Vòng checkmark góc trên khi được chọn */}
              {isSelected ? (
                <View
                  style={[
                    styles.selectedBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              ) : null}

              {/* Mẫu Demo Mini Preview Giao Diện */}
              <View
                style={[
                  styles.previewBox,
                  {
                    backgroundColor: opt.previewBg,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.previewTopBar, { backgroundColor: opt.previewHeaderBg }]} />
                <View style={[styles.previewContent, { backgroundColor: opt.previewCardBg }]}>
                  <View style={[styles.previewLineShort, { backgroundColor: opt.previewLineBg }]} />
                  <View style={[styles.previewLineLong, { backgroundColor: opt.previewLineBg }]} />
                </View>
              </View>

              {/* Biểu tượng kèm nhãn */}
              <View style={[styles.optIconWrap, { backgroundColor: opt.iconBg }]}>
                <Ionicons name={opt.icon} size={18} color={opt.iconColor} />
              </View>

              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: isSelected ? colors.primary : colors.text,
                    fontWeight: isSelected ? fontWeight.bold : fontWeight.semibold,
                  },
                ]}
              >
                {opt.label}
              </Text>

              <Text
                style={[
                  styles.optionTag,
                  { color: colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {opt.tag}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ================= HỘP GỢI Ý LỢI ÍCH SỨC KHỎE / PIN ================= */}
      <View
        style={[
          styles.tipBox,
          {
            backgroundColor: isDark
              ? 'rgba(34, 197, 94, 0.12)'
              : '#F0FDF4',
            borderColor: isDark
              ? 'rgba(34, 197, 94, 0.25)'
              : '#BBF7D0',
          },
        ]}
      >
        <Ionicons
          name="sparkles-outline"
          size={18}
          color={colors.primary}
          style={styles.tipIcon}
        />
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          Chế độ Tối chuẩn FitLog tối ưu độ tương phản, giúp bảo vệ mắt khi chạy vào sáng sớm hoặc đêm muộn và tiết kiệm pin màn hình OLED.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.lg,
    borderRadius: radius.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.subtitle,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionItem: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    position: 'relative',
    ...shadow.subtle,
  },
  selectedLightBorder: {
    borderWidth: 2,
    shadowColor: '#16A34A',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedDarkBorder: {
    borderWidth: 2,
    shadowColor: '#22C55E',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  optionPressed: {
    transform: [{ scale: 0.97 }],
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewBox: {
    width: '84%',
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  previewTopBar: {
    height: 10,
    width: '100%',
  },
  previewContent: {
    flex: 1,
    margin: 4,
    borderRadius: 4,
    padding: 4,
    gap: 4,
    justifyContent: 'center',
  },
  previewLineShort: {
    height: 4,
    width: '50%',
    borderRadius: 2,
  },
  previewLineLong: {
    height: 4,
    width: '85%',
    borderRadius: 2,
  },
  optIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  optionLabel: {
    fontSize: fontSize.body,
  },
  optionTag: {
    fontSize: fontSize.micro,
    marginTop: 2,
    textAlign: 'center',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  tipIcon: {
    marginTop: 1,
  },
  tipText: {
    fontSize: fontSize.caption,
    lineHeight: 18,
    flex: 1,
  },
});
