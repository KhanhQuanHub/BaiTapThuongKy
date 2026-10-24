import { create } from 'zustand';

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  height: number; // cm
  weight: number; // kg
  healthCondition: string; // bệnh nền
  workoutsPerWeek: number; // số buổi tập mỗi tuần (2-6)
  currentGoal: string; // mục tiêu hiện tại
};

export type AuthState = {
  isLoggedIn: boolean;
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Dữ liệu mẫu hồ sơ người dùng ban đầu
const DEFAULT_USER: UserProfile = {
  id: 'usr_default',
  fullName: 'Nguyễn Văn Fit',
  email: 'nguyenvanfit@fitlog.vn',
  gender: 'Nam',
  height: 172,
  weight: 66,
  healthCondition: 'Không có (Khỏe mạnh)',
  workoutsPerWeek: 4,
  currentGoal: 'Giảm cân & Sức bền Cardio',
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  isLoading: false,

  login: async (email: string) => {
    set({ isLoading: true });
    // Giả lập độ trễ mạng/truy vấn CSDL
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Giả lập đăng nhập thành công với thông tin người dùng
    set({
      isLoggedIn: true,
      user: {
        ...DEFAULT_USER,
        email: email.trim().toLowerCase(),
      },
      isLoading: false,
    });
    return true;
  },

  register: async (fullName: string, email: string) => {
    set({ isLoading: true });
    // Giả lập độ trễ mạng/truy vấn CSDL
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Giả lập đăng ký tài khoản mới thành công
    set({
      isLoggedIn: true,
      user: {
        ...DEFAULT_USER,
        id: `usr_${Date.now()}`,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
      },
      isLoading: false,
    });
    return true;
  },

  logout: () => {
    set({
      isLoggedIn: false,
      user: null,
      isLoading: false,
    });
  },
}));
