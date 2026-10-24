import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ScreenHeader from '../components/ui/ScreenHeader';
import StatBox from '../components/ui/StatBox';
import ConfirmStopModal from '../components/run/ConfirmStopModal';
import StatusBadge from '../components/run/StatusBadge';
import SummaryCard from '../components/run/SummaryCard';
import {
  colors, fontSize, fontWeight, layout, radius, spacing,
} from '../constants/theme';
import { formatDistance, formatDuration, formatInt, formatPace } from '../utils/format';

type Phase = 'idle' | 'noPermission' | 'running' | 'paused' | 'summary';

type RunStats = {
  seconds: number;
  distanceKm: number;
  steps: number;
  paceMinPerKm: number | null;
  calories: number;
  cadence: number;
};

// [DATABASE / DEFAULTS]: Dữ liệu khởi tạo mặc định ban đầu
const INITIAL_STATS: RunStats = {
  seconds: 0,
  distanceKm: 0,
  steps: 0,
  paceMinPerKm: null,
  calories: 0,
  cadence: 0,
};

const DEFAULT_GOAL_KM = 5;

export default function RunScreen() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [confirmVisible, setConfirmVisible] = useState(false);

  // [DATABASE - GET]: Trạng thái số liệu buổi chạy thực tế (khởi tạo 0, chuẩn bị đón dữ liệu từ cảm biến & DB)
  const [stats, setStats] = useState<RunStats>(INITIAL_STATS);

  // [DATABASE - GET]: Mục tiêu quãng đường (km). Cần query từ bảng `user_profiles` hoặc `goals` trong SQLite.
  // Ví dụ: const { profile } = useProfile(); -> goalKm = profile?.dailyRunGoalKm ?? DEFAULT_GOAL_KM;
  const [goalKm] = useState<number>(DEFAULT_GOAL_KM);

  /*
   * =========================================================================
   * [DATABASE / SENSORS - CHUẨN BỊ KẾT NỐI]:
   * 1. Lấy thông tin người dùng từ SQLite (chiều cao, cân nặng):
   *    - Chiều cao (height) -> tính sải chân: stride = height * 0.415
   *    - Cân nặng (weight) -> tính calo: MET * weight * (seconds / 3600)
   * 2. Hook cảm biến đếm bước (Pedometer từ `expo-sensors`):
   *    - Khi `phase === 'running'`, lắng nghe bước chân thời gian thực
   *    - Cập nhật `stats.steps`, `stats.distanceKm = (steps * stride) / 100000`, v.v.
   * =========================================================================
   */

  const go = (next: Phase) => {
    setPhase(next);
  };

  const handleStart = () => {
    // Reset số liệu về mặc định khi bắt đầu buổi chạy mới
    setStats(INITIAL_STATS);
    go('running');
  };

  const handleDiscard = () => {
    // Hủy bỏ buổi chạy và reset số liệu về mặc định
    setStats(INITIAL_STATS);
    go('idle');
  };

  const saveRun = async () => {
    /*
     * [DATABASE - INSERT]: Lưu thông tin buổi chạy vào SQLite
     * Bảng: `run_logs`
     * Dữ liệu cần lưu:
     * - id: UUID v4 (hoặc tự tăng)
     * - date: new Date().toISOString()
     * - duration_seconds: stats.seconds
     * - distance_km: stats.distanceKm
     * - steps: stats.steps
     * - avg_pace: stats.paceMinPerKm
     * - calories: stats.calories
     * - avg_cadence: stats.cadence
     *
     * Ví dụ thực tế:
     * await runService.createRunLog({ ...stats, createdAt: new Date() });
     */
    Alert.alert('Đã lưu', 'Buổi chạy đã được lưu vào lịch sử cơ sở dữ liệu.');
    setStats(INITIAL_STATS);
    go('idle');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {phase === 'noPermission' && (
        <View style={styles.centerWrap}>
          <EmptyState
            icon="shield-checkmark"
            title="Cần quyền nhận dạng hoạt động"
            message="FitLog dùng cảm biến bước chân để đếm bước và tính quãng đường. Dữ liệu chỉ nằm trên máy của bạn, không dùng GPS."
          >
            <Button title="Cấp quyền" icon="checkmark-circle" size="lg" onPress={() => go('idle')} />
            <Button title="Mở Cài đặt" variant="secondary" icon="settings" onPress={() => Linking.openSettings()} />
          </EmptyState>
        </View>
      )}

      {phase === 'summary' && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <ScreenHeader title="Chạy bộ" subtitle="Kết quả buổi chạy hôm nay" />
            <SummaryCard summary={stats} />
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Lưu buổi chạy" icon="save" size="lg" onPress={saveRun} />
            <Button title="Bỏ qua" variant="ghost" onPress={handleDiscard} />
          </View>
        </>
      )}

      {(phase === 'idle' || phase === 'running' || phase === 'paused') && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <ScreenHeader
              title="Chạy bộ"
              subtitle={phase === 'idle' ? 'Đo bằng cảm biến bước chân' : undefined}
            />

            {phase === 'idle' && (
              <Card style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <Ionicons name="footsteps" size={layout.iconSize} color={colors.primaryDark} />
                </View>
                <Text style={styles.infoText}>
                  Không cần GPS, không cần mạng. FitLog đếm bước chính xác bằng cảm biến trên điện thoại và tiết kiệm pin.
                </Text>
              </Card>
            )}

            {phase === 'running' && <StatusBadge label="Đang đo bằng cảm biến" tone="primary" pulse />}
            {phase === 'paused' && <StatusBadge label="Đã tạm dừng" tone="warning" />}

            <View style={styles.timerWrap}>
              <Text style={styles.timerLabel}>Thời gian</Text>
              <Text style={[styles.timer, phase === 'paused' && styles.dim]}>
                {formatDuration(stats.seconds)}
              </Text>
            </View>

            <View style={[styles.grid, phase === 'paused' && styles.dim]}>
              <StatBox
                large
                label="Quãng đường"
                value={formatDistance(stats.distanceKm)}
                unit="km"
                icon="navigate"
                tone="primary"
                progress={goalKm > 0 ? stats.distanceKm / goalKm : 0}
                caption={`Mục tiêu ${goalKm} km`}
              />
              <View style={styles.row}>
                <StatBox style={styles.half} label="Số bước" value={formatInt(stats.steps)} unit="bước" icon="footsteps" tone="info" />
                <StatBox style={styles.half} label="Pace" value={formatPace(stats.paceMinPerKm)} unit="/km" icon="speedometer" tone="primary" />
              </View>
              <View style={styles.row}>
                <StatBox style={styles.half} label="Calo" value={formatInt(stats.calories)} unit="kcal" icon="flame" tone="accent" />
                <StatBox style={styles.half} label="Nhịp bước" value={formatInt(stats.cadence)} unit="bước/phút" icon="pulse" tone="info" />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {phase === 'idle' && (
              <Button title="Bắt đầu" icon="play" size="lg" onPress={handleStart} />
            )}
            {phase === 'running' && (
              <View style={styles.actionRow}>
                <Button style={styles.flex} title="Tạm dừng" variant="secondary" icon="pause" size="lg" onPress={() => go('paused')} />
                <Button style={styles.flex} title="Dừng" variant="danger" icon="stop" size="lg" onPress={() => setConfirmVisible(true)} />
              </View>
            )}
            {phase === 'paused' && (
              <View style={styles.actionRow}>
                <Button style={styles.flex} title="Tiếp tục" icon="play" size="lg" onPress={() => go('running')} />
                <Button style={styles.flex} title="Kết thúc" variant="danger" icon="flag" size="lg" onPress={() => go('summary')} />
              </View>
            )}
          </View>
        </>
      )}

      <ConfirmStopModal
        visible={confirmVisible}
        onContinue={() => {
          setConfirmVisible(false);
          setPhase('running');
        }}
        onFinish={() => {
          setConfirmVisible(false);
          go('summary');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centerWrap: { flex: 1, justifyContent: 'center', padding: layout.screenPadding },
  content: { padding: layout.screenPadding, gap: spacing.lg },
  footer: { padding: layout.screenPadding, gap: spacing.sm },
  actionRow: { flexDirection: 'row', gap: spacing.lg },
  flex: { flex: 1 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: {
    width: layout.minTouchSize,
    height: layout.minTouchSize,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, fontSize: fontSize.body, color: colors.textMuted, lineHeight: 22 },
  timerWrap: { alignItems: 'center', gap: spacing.xs },
  timerLabel: { fontSize: fontSize.caption, color: colors.textMuted },
  timer: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  dim: { opacity: 0.45 },
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
});
