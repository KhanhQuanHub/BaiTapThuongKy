# FitLog – Ứng dụng quản lý luyện tập & sức khỏe cá nhân

Ứng dụng di động giúp người dùng quản lý hồ sơ sức khỏe, lập kế hoạch tập luyện, theo dõi calo tiêu hao và ghi nhận quãng đường chạy bộ. Dữ liệu lưu cục bộ trên máy (offline-first), không cần tài khoản đám mây.
## Chức năng chính

1. **Tài khoản & hồ sơ sức khỏe:** đăng ký/đăng nhập cục bộ, nhập chiều cao, cân nặng, tự tính BMI, khai báo bệnh nền, chọn số buổi tập mỗi tuần (2–6), lưu lịch sử cân nặng.
2. **8 mục tiêu tập luyện:** giảm cân, tăng cân, duy trì thể trạng, tăng cơ, sức bền Cardio, dẻo dai, sức khỏe tổng thể, kiểm soát stress.
3. **Onboarding & cây quyết định:** khảo sát 6 bước, lọc bài tập an toàn theo bệnh nền (ví dụ: bệnh khớp thì loại bài nhảy bật, bệnh tim thì giới hạn MET ≤ 5.0) và theo mục tiêu.
4. **Lịch tập, video & tính calo:** lịch tuần/tháng, thư viện bài tập kèm video YouTube, tính calo theo công thức `MET × cân nặng (kg) × thời gian (giờ)`.
5. **Thống kê tiến độ:** biểu đồ cột/đường theo tuần và tháng, tỷ lệ hoàn thành mục tiêu, chuỗi ngày tập liên tục (streak).
6. **Đo quãng đường chạy bộ không dùng GPS:** dùng cảm biến đếm bước chân, quy đổi quãng đường theo sải chân cá nhân hóa theo chiều cao, tiết kiệm pin và chạy được cả trên máy chạy bộ.

## Công nghệ sử dụng

| Mục đích | Thư viện |
| --- | --- |
| Nền tảng | React Native, Expo (Managed Workflow), TypeScript, Expo Router |
| Cơ sở dữ liệu | `expo-sqlite` |
| Bảo mật | `expo-crypto`, `expo-secure-store` |
| Cảm biến | `expo-sensors` (Pedometer, Accelerometer), `expo-keep-awake` |
| Video | `react-native-youtube-iframe`, `react-native-webview` |
| Lịch & biểu đồ | `react-native-calendars`, `react-native-gifted-charts`, `react-native-svg` |
| Biểu mẫu | `react-hook-form`, `zod` |
| State & tiện ích | `zustand`, `date-fns` |
| Thông báo | `expo-notifications` |

## Hướng dẫn cài đặt và chạy

Yêu cầu: Node.js bản LTS, Git, và ứng dụng **Expo Go** trên điện thoại (hoặc Android Emulator).

```bash
git clone https://github.com/KhanhQuanHub/BaiTapThuongKy.git
cd BaiTapThuongKy
npm install
npx expo start
```

Quét mã QR bằng Expo Go (điện thoại và máy tính cùng mạng Wi-Fi), hoặc nhấn `a` để mở Android Emulator.

## Cấu trúc thư mục (dự kiến)

FitLog/
├── App.tsx                       ✓ bọc SafeAreaProvider + NavigationContainer
├── navigation/
│   ├── RootNavigator.tsx         ✓ Luồng: đăng nhập → onboarding → tab chính
│   └── MainTabs.tsx              ✓ 5 tab: Hôm nay, Lịch tập, Chạy bộ, Thống kê, Hồ sơ
├── screens/
│   ├── auth/                     ✓ LoginScreen, RegisterScreen
│   ├── onboarding/               # Wizard 6 bước, màn hình kết quả gợi ý
│   ├── TodayScreen.tsx
│   ├── ScheduleScreen.tsx        # Weekly strip + lịch tháng
│   ├── RunScreen.tsx             ✓
│   ├── StatsScreen.tsx
│   ├── ProfileScreen.tsx          ✓
│   ├── ExerciseDetailScreen.tsx  # Chi tiết bài tập + video YouTube
│   └── GoalsScreen.tsx
├── components/
│   ├── ui/                       ✓ Button, Card, StatBox, EmptyState, ScreenHeader, Input
│   ├── run/                      ✓ StatusBadge, ConfirmStopModal, SummaryCard
│   ├── schedule/                 # WeeklyStrip, WorkoutItem
│   └── charts/                   # BarChartWeek, LineChartTrend
├── constants/
│   └── theme.ts                  ✓
├── utils/
│   └── format.ts                 ✓
├── domain/                       # Logic thuần, dễ viết test
│   ├── bmi.ts ✓, met.ts, stride.ts, achievement.ts, streak.ts
│   └── decisionTree/             # safetyGate.ts, goalFilter.ts, recommend.ts
├── db/                           # index.ts (mở DB), schema.ts, migrations.ts
├── services/                     # authService, profileService, scheduleService, runService
├── data/                         # exercises.seed.ts, goals.ts, metTable.ts
├── hooks/                        # useStepCounter.ts, useProfile.ts, useWeeklyStats.ts
├── store/                        # authStore.ts ✓, onboardingStore.ts
└── types/                        # Workout, Exercise, RunLog, Profile...

Quy ước: màn hình trong `app/` chỉ lo hiển thị; logic tính toán nằm ở `domain/`; chỉ `services/` mới truy cập trực tiếp `db/`.

## Quy trình làm việc nhóm

1. Cập nhật code mới nhất trước khi làm: `git pull`.
2. Mỗi người làm trên nhánh riêng, đặt tên theo chức năng: `git checkout -b feature/ten-chuc-nang`.
3. Commit với nội dung rõ ràng: `git commit -m "Thêm màn hình đăng nhập"`.
4. Push nhánh lên GitHub: `git push -u origin feature/ten-chuc-nang`.
5. Tạo **Pull Request** vào nhánh `main`, nhờ ít nhất một thành viên xem lại trước khi merge.

Lưu ý: không commit `node_modules/`, file `.env`, keystore hay API key lên repo.

## Tuyên bố trách nhiệm y tế

Ứng dụng chỉ là công cụ hỗ trợ tự quản lý lịch tập và tính năng lượng tiêu hao theo công thức tham chiếu. Ứng dụng **không** chẩn đoán bệnh, **không** đưa ra phác đồ điều trị và **không** thay thế lời khuyên của bác sĩ. Người có bệnh nền nên tham vấn chuyên gia y tế trước khi tập luyện cường độ cao.