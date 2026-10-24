import { Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../ui/Button';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';

type Props = {
  visible: boolean;
  onContinue: () => void; // "Tiếp tục chạy"
  onFinish: () => void; // "Kết thúc"
};

export default function ConfirmStopModal({ visible, onContinue, onFinish }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.iconWrap}>
            <Ionicons name="flag" size={28} color={colors.danger} />
          </View>
          <Text style={styles.title}>Kết thúc buổi chạy?</Text>
          <Text style={styles.message}>
            Số liệu hiện tại sẽ được tổng hợp. Bạn có thể lưu hoặc bỏ qua ở bước sau.
          </Text>
          <View style={styles.actions}>
            <Button title="Tiếp tục chạy" variant="secondary" onPress={onContinue} />
            <Button title="Kết thúc" variant="danger" onPress={onFinish} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.card,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.bold, color: colors.text },
  message: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.md },
});
