import { colors as defaultColors, ThemeColors } from '../constants/theme';

export type BmiClassification = {
  bmi: number;
  label: 'Gầy' | 'Bình thường' | 'Thừa cân' | 'Béo phì';
  color: string;
  bgColor: string;
  advice: string;
};

/**
 * Tính chỉ số BMI và phân loại theo tiêu chuẩn:
 * - Gầy: BMI < 18.5
 * - Bình thường: 18.5 <= BMI <= 24.9
 * - Thừa cân: 25.0 <= BMI <= 29.9
 * - Béo phì: BMI >= 30.0
 *
 * @param weightKg Cân nặng (kg)
 * @param heightCm Chiều cao (cm)
 * @param themeColors Bảng màu chủ đề tùy chọn (mặc định theo colors)
 */
export function calculateBmi(
  weightKg: number,
  heightCm: number,
  themeColors?: ThemeColors
): BmiClassification {
  const c = themeColors ?? defaultColors;

  if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
    return {
      bmi: 0,
      label: 'Bình thường',
      color: c.textMuted,
      bgColor: c.border,
      advice: 'Chưa có đủ số đo để tính toán BMI.',
    };
  }

  const heightM = heightCm / 100;
  const bmiRaw = weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      label: 'Gầy',
      color: c.info,
      bgColor: c.infoLight,
      advice: 'Thể trạng gầy, nên bổ sung dinh dưỡng và tập luyện tăng cơ.',
    };
  }

  if (bmi <= 24.9) {
    return {
      bmi,
      label: 'Bình thường',
      color: c.primary,
      bgColor: c.primaryLight,
      advice: 'Cân đối lý tưởng, duy trì chế độ sinh hoạt và bài tập hiện tại.',
    };
  }

  if (bmi <= 29.9) {
    return {
      bmi,
      label: 'Thừa cân',
      color: c.accent,
      bgColor: c.accentLight,
      advice: 'Hơi thừa cân, nên kết hợp bài tập Cardio đốt mỡ và kiểm soát calo.',
    };
  }

  return {
    bmi,
    label: 'Béo phì',
    color: c.danger,
    bgColor: c.dangerLight,
    advice: 'Cần chú ý giảm cân, ưu tiên bài tập an toàn cho xương khớp.',
  };
}
