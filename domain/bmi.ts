import { colors } from '../constants/theme';

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
 */
export function calculateBmi(weightKg: number, heightCm: number): BmiClassification {
  if (!heightCm || heightCm <= 0 || !weightKg || weightKg <= 0) {
    return {
      bmi: 0,
      label: 'Bình thường',
      color: colors.textMuted,
      bgColor: colors.border,
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
      color: colors.info,
      bgColor: colors.background,
      advice: 'Thể trạng gầy, nên bổ sung dinh dưỡng và tập luyện tăng cơ.',
    };
  }

  if (bmi <= 24.9) {
    return {
      bmi,
      label: 'Bình thường',
      color: colors.primaryDark,
      bgColor: colors.primaryLight,
      advice: 'Cân đối lý tưởng, duy trì chế độ sinh hoạt và bài tập hiện tại.',
    };
  }

  if (bmi <= 29.9) {
    return {
      bmi,
      label: 'Thừa cân',
      color: colors.accent,
      bgColor: colors.accentLight,
      advice: 'Hơi thừa cân, nên kết hợp bài tập Cardio đốt mỡ và kiểm soát calo.',
    };
  }

  return {
    bmi,
    label: 'Béo phì',
    color: colors.danger,
    bgColor: '#FEE2E2',
    advice: 'Cần chú ý giảm cân, ưu tiên bài tập an toàn cho xương khớp.',
  };
}
