// ============================================================================
// constants/theme.ts
// Hệ thống thiết kế tối giản chuẩn Material 3 & iOS HIG cho FitLog:
// - Bảng màu giới hạn: 1 màu chủ đạo (Xanh lá), 1 màu cảnh báo (Cam/Đỏ), còn lại trung tính.
// - Hỗ trợ đồng bộ Sáng (Light) và Tối (Dark) bằng cùng một hệ thống token.
// - Chuẩn dễ đọc: Cỡ chữ tối thiểu 14sp, vùng chạm tối thiểu 44px, độ tương phản WCAG AA.
// ============================================================================

export const colors = {
  // 1. Màu chủ đạo duy nhất: Xanh lá thể thao (Emerald Green)
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  primaryMuted: '#86EFAC',
  primaryGlow: 'rgba(22, 163, 74, 0.14)',

  // Đồng bộ các khóa màu phụ về màu chủ đạo/cảnh báo để tránh loạn màu nhấn
  accent: '#D97706',
  accentDark: '#B45309',
  accentLight: '#FEF3C7',
  accentGlow: 'rgba(217, 119, 6, 0.14)',

  // 2. Màu cảnh báo & trạng thái
  info: '#475569',
  infoLight: '#F1F5F9',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',

  // 3. Hệ màu trung tính (Neutral Slate - Sáng)
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  borderFocus: '#16A34A',

  // Phân cấp chữ (Độ tương phản cao >= 4.5:1)
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',

  // Lớp phủ Modal
  overlay: 'rgba(15, 23, 42, 0.55)',
};

export type ThemeColors = typeof colors;
export type ThemeMode = 'light' | 'dark' | 'system';

// Bảng màu Chế độ Tối (Dark Mode) dùng chung hệ thống token
export const darkColors: ThemeColors = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: 'rgba(34, 197, 94, 0.16)',
  primaryMuted: '#15803D',
  primaryGlow: 'rgba(34, 197, 94, 0.22)',

  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: 'rgba(245, 158, 11, 0.16)',
  accentGlow: 'rgba(245, 158, 11, 0.22)',

  info: '#94A3B8',
  infoLight: 'rgba(148, 163, 184, 0.16)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.16)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.16)',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#0B1120',
  border: '#334155',
  borderFocus: '#22C55E',

  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  overlay: 'rgba(0, 0, 0, 0.72)',
};

// Khoảng cách theo lưới 4/8pt
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// Bo góc nhất quán (chuẩn Material 3 / iOS)
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
};

// Hệ thống cỡ chữ tối giản (tối thiểu 14sp để dễ đọc)
export const fontSize = {
  micro: 14,       // Giữ tối thiểu 14sp theo chuẩn dễ đọc
  caption: 14,     // Nhãn phụ, chú thích ngắn (14sp)
  body: 16,        // Cỡ chữ nội dung chuẩn (16sp)
  subtitle: 18,    // Tiêu đề phụ / chỉ số vừa (18sp)
  title: 20,       // Cỡ chữ tiêu đề chuẩn (20sp)
  headline: 28,    // Số liệu lớn phụ (28sp)
  display: 44,     // Quãng đường / Bước chân lớn (44sp)
  displayHero: 56, // Đồng hồ bấm giờ trung tâm (56sp)
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Bóng đổ phẳng nhẹ (tối ưu cho máy yếu, ưu tiên viền mảnh 1px)
export const shadow = {
  subtle: {
    elevation: 0,
  },
  card: {
    elevation: 0,
  },
  cardElevated: {
    elevation: 0,
  },
  glowPrimary: {
    elevation: 0,
  },
};

// Quy chuẩn công thái học di động
export const layout = {
  screenPadding: 16,
  cardPadding: 16,
  buttonHeight: 52,
  minTouchSize: 44, // Vùng chạm tối thiểu 44x44px
  iconSize: 22,
  iconSizeLarge: 28,
  headerHeight: 56,
};
