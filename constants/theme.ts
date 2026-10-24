// ============================================================================
// FITLOG DESIGN SYSTEM THEME (Material Design 3 + iOS HIG Inspired)
// Bộ thiết kế quy chuẩn cho toàn bộ ứng dụng FitLog.
// KHÔNG ghi cứng mã màu, cỡ chữ, khoảng cách; mọi component đều tham chiếu tại đây.
// ============================================================================

export const colors = {
  // Thương hiệu chính: Xanh ngọc lục bảo (Emerald Green) biểu trưng cho sức sống, sức khỏe
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  primaryMuted: '#86EFAC',
  primaryGlow: 'rgba(22, 163, 74, 0.18)',

  // Điểm nhấn năng lượng & calo: Cam san hô (Coral Orange)
  accent: '#F97316',
  accentDark: '#C2410C',
  accentLight: '#FFEDD5',
  accentGlow: 'rgba(249, 115, 22, 0.18)',

  // Thông báo & Trạng thái (Đảm bảo độ tương phản WCAG AA >= 4.5:1)
  info: '#0284C7',
  infoLight: '#E0F2FE',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',

  // Nền & Bề mặt thị giác
  background: '#F8FAFC', // Slate 50 dịu mắt
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9', // Nền phụ cho thẻ con hoặc dải trạng thái
  border: '#E2E8F0',     // Đường viền tinh tế
  borderFocus: '#16A34A',

  // Hệ thống màu chữ & phân cấp thị giác
  text: '#0F172A',         // Slate 900 sắc nét, dễ đọc dưới ánh sáng mạnh
  textSecondary: '#334155', // Slate 700 cho nội dung bổ trợ
  textMuted: '#64748B',     // Slate 500 cho nhãn chú thích, đơn vị đo
  textOnPrimary: '#FFFFFF',

  // Lớp phủ nền mờ cho Modal / Bottom Sheet
  overlay: 'rgba(15, 23, 42, 0.6)',
};

export type ThemeColors = typeof colors;
export type ThemeMode = 'light' | 'dark' | 'system';

// Bảng màu hỗ trợ Chế độ tối (Dark Mode)
export const darkColors: ThemeColors = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: 'rgba(34, 197, 94, 0.15)',
  primaryMuted: '#15803D',
  primaryGlow: 'rgba(34, 197, 94, 0.25)',

  accent: '#FB923C',
  accentDark: '#EA580C',
  accentLight: 'rgba(251, 146, 60, 0.15)',
  accentGlow: 'rgba(251, 146, 60, 0.25)',

  info: '#38BDF8',
  infoLight: 'rgba(56, 189, 248, 0.15)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.15)',
  danger: '#F87171',
  dangerLight: 'rgba(248, 113, 113, 0.15)',

  background: '#0B0F19',
  surface: '#1E293B',
  surfaceAlt: '#0F172A',
  border: '#334155',
  borderFocus: '#22C55E',

  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  overlay: 'rgba(0, 0, 0, 0.75)',
};

// Thang khoảng cách theo quy chuẩn lưới 4/8pt
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// Bán kính bo góc thân thiện, mềm mại
export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

// Thang cỡ chữ chuẩn bị cho khả năng co giãn (Dynamic Type)
export const fontSize = {
  micro: 11,
  caption: 13,
  body: 15,
  subtitle: 17,
  title: 22,
  headline: 28,
  display: 48,      // Dành cho đồng hồ bấm giờ & quãng đường chính khi chạy
  displayHero: 56,  // Dành cho số liệu toàn màn hình
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Hiệu ứng bóng đổ phân lớp chiều sâu theo Material 3 Elevation
export const shadow = {
  subtle: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardElevated: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  glowPrimary: {
    shadowColor: '#16A34A',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

// Quy chuẩn bố cục chuẩn công thái học di động (Ergonomics)
export const layout = {
  screenPadding: 16,
  cardPadding: 18,
  buttonHeight: 50,
  minTouchSize: 44, // Tiêu chuẩn tiếp cận tối thiểu (44x44 pt) của Apple & W3C
  iconSize: 24,
  iconSizeLarge: 32,
  headerHeight: 56,
};
