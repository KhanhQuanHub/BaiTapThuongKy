import { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import {
  fontSize, fontWeight, radius, shadow, spacing, ThemeColors,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

export type ConfirmStopModalProps = {
  visible: boolean;
  onContinue: () => void; // "Tiếp tục chạy"
  onFinish: () => void;   // "Kết thúc buổi chạy"
};

export default function ConfirmStopModal({
  visible,
  onContinue,
  onFinish,
}: ConfirmStopModalProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
    >
      <View style={styles.overlay}>
        <View
          style={styles.dialog}
          accessible
          accessibilityRole="alert"
          accessibilityLabel="Xác nhận kết thúc buổi chạy"
        >
          <View style={styles.iconRing}>
            <View style={styles.iconWrap}>
              <Ionicons name="flag" size={28} color={colors.danger} />
            </View>
          </View>

          <Text style={styles.title}>Kết thúc buổi chạy này?</Text>
          <Text style={styles.message}>
            Toàn bộ số liệu về quãng đường, thời gian và lượng calo tiêu thụ sẽ được tổng hợp đầy đủ để bạn xem lại và lưu vào lịch sử.
          </Text>

          <View style={styles.actions}>
            <Button
              title="Tiếp tục chạy"
              variant="secondary"
              icon="play"
              size="lg"
              onPress={onContinue}
            />
            <Button
              title="Kết thúc & Xem tổng kết"
              variant="danger"
              icon="checkmark-circle"
              size="lg"
              onPress={onFinish}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    dialog: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: colors.surface,
      borderRadius: radius.xxl,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...(isDark ? shadow.card : shadow.cardElevated),
    },
    iconRing: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : colors.dangerLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.heavy,
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    message: {
      fontSize: fontSize.body,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
    actions: {
      alignSelf: 'stretch',
      gap: spacing.md,
      marginTop: spacing.md,
    },
  });
