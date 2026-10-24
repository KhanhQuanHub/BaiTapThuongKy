// Bộ thiết kế chung của cả nhóm. Không ghi cứng màu/khoảng cách trong màn hình, chỉ lấy từ đây.
export const colors = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  accent: '#F97316', // calo, năng lượng
  accentLight: '#FFEDD5',
  info: '#0EA5E9',
  warning: '#F59E0B',
  danger: '#DC2626',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.5)', // nền mờ phía sau hộp thoại
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 };

export const fontSize = {
  caption: 12,
  body: 15,
  subtitle: 17,
  title: 22,
  headline: 28,
  display: 48, // đồng hồ chính
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
};

export const layout = {
  screenPadding: 16,
  buttonHeight: 48,
  minTouchSize: 44,
  iconSize: 24,
};
