// ============================================================================
// screens/RunSummaryScreen.js
// Màn hình Tóm tắt buổi chạy tối giản (Strava / Apple Fitness style):
// - Hiển thị lớn Quãng đường (km), Thời gian và Bước chân; gộp Pace, Vận tốc, Calo
//   vào một thẻ ngang 3 cột.
// - Ẩn các chi tiết kỹ thuật phụ (Sải chân, Nguồn đo, Cadence, MET, Splits...)
//   vào mục "Xem thêm" để giao diện thoáng, dễ nắm bắt.
// - Mỗi màn hình chỉ có 1 hành động chính nổi bật ("Hoàn tất").
// - Đồng bộ Sáng / Tối với hệ thống màu tối giản; chữ >= 14sp, vùng chạm >= 44px.
// ============================================================================

import React, { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from '../constants/theme';
import { useTheme } from '../store/themeStore';
import { formatPaceSec } from '../utils/runMath';
import { formatDistance, formatDuration, formatInt } from '../utils/format';

// Dòng split từng km bọc React.memo
const SplitRowItem = memo(function SplitRowItem({ km, sec, textColor, mutedColor, borderColor }) {
  return (
    <View style={[staticStyles.splitRow, { borderTopColor: borderColor }]}>
      <Text style={[staticStyles.splitKmText, { color: mutedColor }]}>Km {km}</Text>
      <Text style={[staticStyles.splitTimeText, { color: textColor }]}>{formatPaceSec(sec)} /km</Text>
    </View>
  );
});

export default function RunSummaryScreen({
  run,
  syncStatus = 'saved',
  onSyncNow,
  onOpenHistory,
  onDone,
  route,
  navigation,
}) {
  const { colors } = useTheme();
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const record = run || route?.params?.run || null;
  const effectiveStatus = record?._queued ? 'queued' : syncStatus;

  const handleBackOrDone = () => {
    if (typeof onDone === 'function') {
      onDone();
    } else if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  };

  if (!record) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Chưa có dữ liệu buổi chạy</Text>
        <Pressable style={styles.primaryButton} onPress={handleBackOrDone}>
          <Text style={styles.primaryButtonText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const isQueued = effectiveStatus === 'queued';
  const sourceLabel =
    record.source === 'manual'
      ? 'Nhập tay'
      : record.source === 'gps'
        ? 'GPS'
        : 'Cảm biến bước chân';
  const splits = Array.isArray(record.splits) ? record.splits : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ================= HEADER & TRẠNG THÁI LƯU ================= */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Kết quả chạy bộ</Text>
          <View style={[styles.badge, isQueued ? styles.badgeQueued : styles.badgeSaved]}>
            <Text style={[styles.badgeText, isQueued ? styles.badgeTextQueued : styles.badgeTextSaved]}>
              {isQueued ? 'Chờ đồng bộ' : 'Đã lưu'}
            </Text>
          </View>
        </View>

        {/* Banner đồng bộ 1 nút nếu đang chờ gửi */}
        {isQueued && typeof onSyncNow === 'function' ? (
          <View style={styles.syncBanner}>
            <Text style={styles.syncBannerText}>Đã lưu trên máy, chờ mạng để gửi</Text>
            <Pressable style={styles.syncMiniBtn} onPress={onSyncNow}>
              <Text style={styles.syncMiniBtnText}>Đồng bộ</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ================= THẺ KẾT QUẢ CHÍNH ================= */}
        <View style={styles.heroCard}>
          <Text style={styles.dateText}>{record.date || '--'}</Text>

          <View style={styles.distanceRow}>
            <Text style={styles.distanceHero}>{formatDistance(Number(record.distanceKm) || 0)}</Text>
            <Text style={styles.distanceUnit}>km</Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.colItem}>
              <Text style={styles.colValue}>{formatDuration(Number(record.durationSec) || 0)}</Text>
              <Text style={styles.colLabel}>Thời gian</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.colItem}>
              <Text style={styles.colValue}>{formatInt(Number(record.steps) || 0)}</Text>
              <Text style={styles.colLabel}>Bước chân</Text>
            </View>
          </View>
        </View>

        {/* ================= THẺ 3 CHỈ SỐ PHỤ ================= */}
        <View style={styles.threeColCard}>
          <View style={styles.colItem}>
            <Text style={styles.secondaryVal}>{formatPaceSec(record.paceSecPerKm)}</Text>
            <Text style={styles.colLabel}>Pace (/km)</Text>
          </View>

          <View style={styles.verticalDividerSmall} />

          <View style={styles.colItem}>
            <Text style={styles.secondaryVal}>{Number(record.avgSpeedKmh || 0).toFixed(1)}</Text>
            <Text style={styles.colLabel}>Vận tốc (km/h)</Text>
          </View>

          <View style={styles.verticalDividerSmall} />

          <View style={styles.colItem}>
            <Text style={styles.secondaryVal}>{formatInt(Number(record.calories) || 0)}</Text>
            <Text style={styles.colLabel}>Calo (kcal)</Text>
          </View>
        </View>

        {record.note ? (
          <View style={styles.noteCard}>
            <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
            <Text style={styles.noteText}>{record.note}</Text>
          </View>
        ) : null}

        {/* ================= MỤC "XEM THÊM" ẨN CHI TIẾT PHỤ ================= */}
        <View style={styles.moreCard}>
          <Pressable
            accessibilityRole="button"
            style={styles.moreToggleRow}
            onPress={() => setShowMoreDetails((prev) => !prev)}
          >
            <Text style={styles.moreToggleTitle}>Xem thêm chi tiết</Text>
            <Ionicons
              name={showMoreDetails ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>

          {showMoreDetails ? (
            <View style={styles.moreBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Nhịp bước</Text>
                <Text style={styles.detailVal}>
                  {record.cadenceSpm > 0 ? `${record.cadenceSpm} bước/phút` : '--'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Sải chân</Text>
                <Text style={styles.detailVal}>{record.strideM} m</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Nguồn dữ liệu</Text>
                <Text style={styles.detailVal}>{sourceLabel}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Thời gian tạm dừng</Text>
                <Text style={styles.detailVal}>{record.pausedSec || 0} giây</Text>
              </View>

              {splits.length > 0 ? (
                <View style={styles.splitsSection}>
                  <Text style={styles.splitsHeading}>Từng km (Splits)</Text>
                  {splits.map((item) => (
                    <SplitRowItem
                      key={`split_${item.km}`}
                      km={item.km}
                      sec={item.sec}
                      textColor={colors.text}
                      mutedColor={colors.textMuted}
                      borderColor={colors.border}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {typeof onOpenHistory === 'function' ? (
          <Pressable style={styles.historyLinkBtn} onPress={onOpenHistory}>
            <Text style={styles.historyLinkText}>Xem lịch sử chạy bộ</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* ================= ĐÁY MÀN HÌNH: 1 NÚT CHÍNH NỔI BẬT ================= */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.primaryButton} onPress={handleBackOrDone}>
          <Text style={styles.primaryButtonText}>Hoàn tất</Text>
        </Pressable>
      </View>
    </View>
  );
}

const staticStyles = StyleSheet.create({
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  splitKmText: {
    fontSize: fontSize.caption,
  },
  splitTimeText: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
});

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: layout.screenPadding,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    emptyTitle: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    screenTitle: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    badge: {
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    badgeSaved: {
      backgroundColor: colors.primaryLight,
    },
    badgeQueued: {
      backgroundColor: colors.warningLight,
    },
    badgeText: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
    },
    badgeTextSaved: {
      color: colors.primary,
    },
    badgeTextQueued: {
      color: colors.warning,
    },
    syncBanner: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.warningLight,
      borderWidth: 1,
      borderColor: colors.warning,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
    },
    syncBannerText: {
      fontSize: fontSize.caption,
      color: colors.text,
      flex: 1,
    },
    syncMiniBtn: {
      minHeight: 36,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.warning,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    syncMiniBtnText: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      color: '#FFFFFF',
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
    },
    dateText: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
    },
    distanceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: spacing.xs,
    },
    distanceHero: {
      fontSize: fontSize.displayHero,
      fontWeight: fontWeight.heavy,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    distanceUnit: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.textMuted,
      marginLeft: 6,
    },
    heroDivider: {
      width: '100%',
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.lg,
    },
    twoColRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    colItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    colValue: {
      fontSize: 28,
      fontWeight: fontWeight.bold,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    colLabel: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
    },
    verticalDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.border,
    },
    threeColCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
    },
    secondaryVal: {
      fontSize: fontSize.title,
      fontWeight: fontWeight.bold,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    verticalDividerSmall: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    noteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    noteText: {
      flex: 1,
      fontSize: fontSize.body,
      color: colors.text,
    },
    moreCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    moreToggleRow: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
    },
    moreToggleTitle: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.medium,
      color: colors.text,
    },
    moreBody: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailKey: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
    },
    detailVal: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    splitsSection: {
      marginTop: spacing.sm,
    },
    splitsHeading: {
      fontSize: fontSize.caption,
      fontWeight: fontWeight.bold,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    historyLinkBtn: {
      minHeight: layout.minTouchSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyLinkText: {
      fontSize: fontSize.body,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
    },
    bottomBar: {
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    primaryButton: {
      minHeight: layout.buttonHeight,
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontSize: fontSize.body,
      fontWeight: fontWeight.bold,
    },
  });
