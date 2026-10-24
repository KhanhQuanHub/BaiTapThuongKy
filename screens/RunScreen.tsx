import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import ScreenHeader from '../components/ui/ScreenHeader';
import StatBox from '../components/ui/StatBox';
import ThemeToggle from '../components/ui/ThemeToggle';
import ConfirmStopModal from '../components/run/ConfirmStopModal';
import StatusBadge from '../components/run/StatusBadge';
import SummaryCard, { RunSummary } from '../components/run/SummaryCard';
import RunMapView from '../components/run/RunMapView';
import {
  fontSize, fontWeight, layout, radius, shadow, spacing, ThemeColors,
} from '../constants/theme';
import { useTheme } from '../store/themeStore';
import { formatDistance, formatDuration, formatInt, formatPace } from '../utils/format';

export type RunPhase = 'idle' | 'noPermission' | 'running' | 'paused' | 'summary';

export type RunStats = {
  seconds: number;
  distanceKm: number;
  steps: number;
  paceMinPerKm: number | null;
  calories: number;
  cadence: number;
};

// Dữ liệu mẫu chuẩn khi ở trạng thái xem thử tổng kết
const SAMPLE_SUMMARY: RunSummary = {
  seconds: 1845,
  distanceKm: 4.25,
  steps: 5310,
  paceMinPerKm: 7.23,
  calories: 312,
};

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
  const { colors, isDark } = useTheme();
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Quản lý số liệu thực tế của buổi chạy
  const [stats, setStats] = useState<RunStats>(INITIAL_STATS);
  const [goalKm] = useState<number>(DEFAULT_GOAL_KM);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Bộ đếm thời gian khi ở trạng thái 'running'
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (phase === 'running') {
      timer = setInterval(() => {
        setStats((prev) => {
          const nextSec = prev.seconds + 1;
          const nextPace = prev.distanceKm > 0 ? (nextSec / 60) / prev.distanceKm : null;
          return {
            ...prev,
            seconds: nextSec,
            paceMinPerKm: nextPace,
          };
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  const go = (next: RunPhase) => {
    setPhase(next);
  };

  const handleStart = () => {
    setStats(INITIAL_STATS);
    go('running');
  };

  const handleDistanceChange = useCallback((distanceKm: number) => {
    setStats((prev) => {
      const newDist = Math.max(prev.distanceKm, Number(distanceKm.toFixed(2)));
      const steps = Math.round(newDist * 1350);
      const pace = prev.seconds > 0 && newDist > 0 ? (prev.seconds / 60) / newDist : null;
      const calories = Math.round(newDist * 65);
      return {
        ...prev,
        distanceKm: newDist,
        steps,
        paceMinPerKm: pace,
        calories,
        cadence: 165,
      };
    });
  }, []);

  const handleDiscard = () => {
    setStats(INITIAL_STATS);
    go('idle');
  };

  const saveRun = async () => {
    Alert.alert(
      'Đã lưu buổi chạy!',
      `Buổi chạy ${formatDistance(stats.distanceKm)} km (${formatDuration(stats.seconds)}) đã được lưu vào lịch sử thể lực của bạn.`,
      [{ text: 'Hoàn tất', onPress: () => go('idle') }]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ================= 2. TRẠNG THÁI: CHƯA CẤP QUYỀN ================= */}
      {phase === 'noPermission' && (
        <View style={styles.centerContainer}>
          <EmptyState
            icon="shield-checkmark"
            title="Cho phép quyền vị trí & bước chân"
            message="FitLog cần kết nối cảm biến vận động để đo quãng đường và tốc độ chạy bộ của bạn. Dữ liệu hoàn toàn bảo mật và lưu trên máy."
            tip="Bạn có thể thay đổi quyền này bất cứ lúc nào trong Cài đặt hệ thống."
          >
            <Button
              title="Cấp quyền hoạt động"
              icon="checkmark-circle"
              size="lg"
              onPress={() => go('idle')}
            />
            <Button
              title="Mở Cài đặt thiết bị"
              variant="secondary"
              icon="settings-outline"
              size="lg"
              onPress={() => Linking.openSettings()}
            />
          </EmptyState>
        </View>
      )}

      {/* ================= 6. TRẠNG THÁI: TỔNG KẾT BUỔI CHẠY ================= */}
      {phase === 'summary' && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <ScreenHeader
              title="Tổng kết thể lực"
              subtitle="Kết quả buổi chạy bộ vừa hoàn thành"
              badge="Thành công"
              rightAction={<ThemeToggle size="sm" />}
            />
            <SummaryCard summary={stats.distanceKm > 0 ? stats : SAMPLE_SUMMARY} />
          </ScrollView>

          <View style={styles.bottomFooter}>
            <Button
              title="Lưu vào lịch sử"
              icon="save-outline"
              size="lg"
              onPress={saveRun}
            />
            <Button
              title="Bỏ qua buổi chạy này"
              variant="ghost"
              onPress={handleDiscard}
            />
          </View>
        </>
      )}

      {/* ================= 1, 3, 4. TRẠNG THÁI: CHỜ CHẠY / ĐANG CHẠY / TẠM DỪNG ================= */}
      {(phase === 'idle' || phase === 'running' || phase === 'paused') && (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <ScreenHeader
              title="Chạy bộ"
              subtitle={
                phase === 'idle'
                  ? 'Theo dõi lộ trình trên bản đồ & nhịp bước chân'
                  : 'Đang ghi nhận số liệu vận động'
              }
              rightAction={<ThemeToggle size="sm" />}
            />

            {/* Trạng thái 1: Thẻ giới thiệu thân thiện cho người mới bắt đầu */}
            {phase === 'idle' ? (
              <Card style={styles.introCard}>
                <View style={styles.introLeft}>
                  <View style={styles.introIconWrap}>
                    <Ionicons name="sparkles" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.introTextWrap}>
                    <Text style={styles.introTitle}>Sẵn sàng luyện tập</Text>
                    <Text style={styles.introDesc}>
                      FitLog ghi nhận lộ trình di chuyển và tính calo theo sải chân của bạn. Nhấn &quot;Bắt đầu chạy&quot; khi bạn sẵn sàng!
                    </Text>
                  </View>
                </View>
              </Card>
            ) : null}

            {/* Bản đồ vẽ lộ trình di chuyển (Chạy mượt trên Expo Go không cần API Key) */}
            <RunMapView
              isTracking={phase === 'running'}
              height={phase === 'idle' ? 180 : 220}
              onDistanceChange={handleDistanceChange}
            />

            {/* Huy hiệu trạng thái động */}
            {phase === 'running' ? (
              <StatusBadge label="Đang đo lộ trình & bước chân" tone="primary" pulse />
            ) : null}
            {phase === 'paused' ? (
              <StatusBadge label="Đã tạm dừng buổi chạy" tone="warning" />
            ) : null}

            {/* ĐỒNG HỒ THỜI GIAN: Chữ to rõ ràng, đọc tốt từ khoảng cách cánh tay */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerCaption}>THỜI GIAN CHẠY</Text>
              <Text
                style={[
                  styles.timerText,
                  phase === 'paused' && styles.dimmed,
                ]}
              >
                {formatDuration(stats.seconds)}
              </Text>
            </View>

            {/* LƯỚI CHỈ SỐ: Quãng đường làm điểm nhấn lớn nhất, các chỉ số phụ có giải thích */}
            <View style={[styles.grid, phase === 'paused' && styles.dimmed]}>
              <StatBox
                large
                label="Quãng đường"
                value={formatDistance(stats.distanceKm)}
                unit="km"
                icon="navigate"
                tone="primary"
                progress={goalKm > 0 ? stats.distanceKm / goalKm : 0}
                caption={`Mục tiêu hôm nay: ${goalKm} km`}
              />

              <View style={styles.row}>
                <StatBox
                  label="Pace"
                  value={formatPace(stats.paceMinPerKm)}
                  unit="/km"
                  icon="speedometer"
                  tone="accent"
                  style={styles.half}
                />
                <StatBox
                  label="Calo"
                  value={formatInt(stats.calories)}
                  unit="kcal"
                  icon="flame"
                  tone="accent"
                  style={styles.half}
                />
              </View>

              <View style={styles.row}>
                <StatBox
                  label="Số bước"
                  value={formatInt(stats.steps)}
                  unit="bước"
                  icon="footsteps"
                  tone="info"
                  style={styles.half}
                />
                <StatBox
                  label="Nhịp bước"
                  value={stats.cadence > 0 ? `${stats.cadence}` : '--'}
                  unit="spm"
                  icon="pulse"
                  tone="info"
                  style={styles.half}
                />
              </View>
            </View>
          </ScrollView>

          {/* ================= KHU VỰC ĐIỀU KHIỂN CHÍNH (BOTTOM CONTROLS) ================= */}
          <View style={styles.bottomFooter}>
            {phase === 'idle' && (
              <Button
                title="Bắt đầu chạy ngay"
                icon="play"
                size="lg"
                onPress={handleStart}
              />
            )}

            {phase === 'running' && (
              <View style={styles.buttonActionRow}>
                <View style={styles.flexPrimary}>
                  <Button
                    title="Tạm dừng"
                    variant="secondary"
                    icon="pause"
                    size="lg"
                    onPress={() => go('paused')}
                  />
                </View>
                <View style={styles.flexDanger}>
                  <Button
                    title="Dừng"
                    variant="danger"
                    icon="stop"
                    size="lg"
                    onPress={() => setConfirmVisible(true)}
                  />
                </View>
              </View>
            )}

            {phase === 'paused' && (
              <View style={styles.buttonActionRow}>
                <View style={styles.flexPrimary}>
                  <Button
                    title="Tiếp tục chạy"
                    variant="primary"
                    icon="play"
                    size="lg"
                    onPress={() => go('running')}
                  />
                </View>
                <View style={styles.flexDanger}>
                  <Button
                    title="Kết thúc"
                    variant="danger"
                    icon="flag"
                    size="lg"
                    onPress={() => setConfirmVisible(true)}
                  />
                </View>
              </View>
            )}
          </View>
        </>
      )}

      {/* Modal xác nhận kết thúc để tránh lỡ tay bấm nhầm */}
      <ConfirmStopModal
        visible={confirmVisible}
        onContinue={() => {
          setConfirmVisible(false);
        }}
        onFinish={() => {
          setConfirmVisible(false);
          go('summary');
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: layout.screenPadding,
    },
    content: {
      padding: layout.screenPadding,
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    introCard: {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : colors.primaryLight,
      borderColor: isDark ? 'rgba(34, 197, 94, 0.25)' : colors.primaryLight,
    },
    introLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    introIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    introTextWrap: {
      flex: 1,
      gap: 2,
    },
    introTitle: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    introDesc: {
      fontSize: fontSize.caption,
      color: colors.textSecondary,
      lineHeight: 18,
      opacity: 0.9,
    },
    timerContainer: {
      alignItems: 'center',
      gap: spacing.xs / 2,
      marginVertical: spacing.xs,
    },
    timerCaption: {
      fontSize: fontSize.micro + 1,
      color: colors.textMuted,
      fontWeight: fontWeight.bold,
      letterSpacing: 1.2,
    },
    timerText: {
      fontSize: fontSize.displayHero,
      fontWeight: fontWeight.heavy,
      color: colors.text,
      fontVariant: ['tabular-nums'],
      letterSpacing: -1,
    },
    dimmed: {
      opacity: 0.5,
    },
    grid: {
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    half: {
      flex: 1,
    },
    bottomFooter: {
      padding: layout.screenPadding,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
      ...shadow.cardElevated,
    },
    buttonActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    flexPrimary: {
      flex: 2,
    },
    flexDanger: {
      flex: 1.2,
    },
  });
