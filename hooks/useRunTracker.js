// ============================================================================
// hooks/useRunTracker.js
// Hook quản lý máy trạng thái chạy bộ (State Machine), cảm biến Pedometer,
// bộ đếm thời gian chống lệch (Date.now() - mốc) và tối ưu hóa cho máy yếu:
// - Luồng trạng thái: idle -> ready -> running <-> paused -> finishing -> saved | queued
// - TUYỆT ĐỐI KHÔNG gọi setState trong callback Pedometer.watchStepCount;
//   chỉ cập nhật useRef và dùng DUY NHẤT một setInterval 1000 ms để render UI.
// - Tính cadence theo cửa sổ trượt 30 s trên mảng vòng kích thước cố định (32 phần tử).
// - Tự động lưu checkpoint mỗi 15 s hoặc mỗi 50 bước (< 2 KB).
// - Giữ màn hình sáng bằng expo-keep-awake khi đang chạy và tự tắt khi dừng/tạm dừng.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { subscribeUnauthorized } from '../services/api';
import {
  clearCheckpoint,
  finishAndSaveRun,
  generateClientId,
  getQueuedRuns,
  loadCalibratedStrideM,
  loadCheckpoint,
  saveCalibratedStrideM,
  saveCheckpoint,
  syncQueuedRuns,
} from '../services/runRepository';
import {
  CADENCE_RING_SIZE,
  CADENCE_WINDOW_MS,
  calibrateStride,
  calculateSlidingCadenceSpm,
  computeRunMetrics,
  resolveStride,
} from '../utils/runMath';
import { localDateString } from '../utils/dateLocal';

const KEEP_AWAKE_TAG = 'figlog-active-run-keep-awake';
const CHECKPOINT_INTERVAL_MS = 15000; // Lưu checkpoint mỗi 15 giây
const CHECKPOINT_STEP_DELTA = 50;     // Hoặc mỗi khi tăng thêm 50 bước
const MAX_SPLITS_COUNT = 50;          // Giới hạn mảng splits cố định để tránh phình RAM

const INITIAL_METRICS = {
  steps: 0,
  strideM: 0.726,
  strideSource: 'formula',
  distanceKm: 0,
  durationSec: 0,
  pausedSec: 0,
  avgSpeedKmh: 0,
  paceSecPerKm: null,
  paceFormatted: '--:--',
  cadenceSpm: 0,
  met: 0,
  weightKg: 60,
  calories: 0,
};

/**
 * Hook quản lý toàn bộ nghiệp vụ chạy bộ bằng Pedometer.
 *
 * @param {object} [userProfile] Thông tin hồ sơ người dùng { heightCm, height, weightKg, weight, gender, calibratedStrideM, id }
 */
export function useRunTracker(userProfile = {}) {
  const weightKg = Number(userProfile?.weightKg ?? userProfile?.weight ?? 60) || 60;
  const heightCm = Number(userProfile?.heightCm ?? userProfile?.height ?? 175) || 175;
  const gender = userProfile?.gender || 'male';
  const profileId = userProfile?.profileId ?? userProfile?.id ?? null;

  // Trạng thái máy trạng thái: 'idle' | 'ready' | 'running' | 'paused' | 'finishing' | 'saved' | 'queued'
  const [status, setStatus] = useState('idle');
  const [sensorStatus, setSensorStatus] = useState({
    checked: false,
    available: true,
    permissionGranted: false,
    canAskAgain: true,
    errorReason: null, // 'unavailable' | 'denied' | 'denied_permanent' | null
  });

  const [calibratedStrideM, setCalibratedStrideM] = useState(
    userProfile?.calibratedStrideM ?? null
  );

  // Chỉ số hiển thị trên UI (chỉ cập nhật tối đa 1 lần / giây khi đang chạy)
  const [metrics, setMetrics] = useState(() => {
    const strideInfo = resolveStride({ heightCm, gender, calibratedStrideM });
    return {
      ...INITIAL_METRICS,
      strideM: strideInfo.strideM,
      strideSource: strideInfo.strideSource,
      weightKg,
    };
  });

  // Buổi chạy vừa kết thúc (dùng cho RunSummaryScreen)
  const [completedRun, setCompletedRun] = useState(null);
  // Checkpoint dở dang phát hiện lúc mở app
  const [recoverableCheckpoint, setRecoverableCheckpoint] = useState(null);
  // Số bản ghi đang chờ đồng bộ trong hàng đợi
  const [queuedCount, setQueuedCount] = useState(0);
  // Cờ báo cần đăng nhập lại khi gặp lỗi 401 (hàng đợi vẫn giữ nguyên)
  const [authExpired, setAuthExpired] = useState(false);
  // Thông báo lỗi/trạng thái gần nhất
  const [statusMessage, setStatusMessage] = useState('');

  // ==================== CÁC REF NỘI BỘ (KHÔNG GÂY RE-RENDER) ====================
  // Khóa đảm bảo chỉ chạy 1 buổi duy nhất cùng lúc
  const activeRunLockRef = useRef(false);
  const pedometerSubRef = useRef(null);
  const intervalIdRef = useRef(null);

  // Định danh & mốc thời gian (dùng Date.now() trừ mốc, không cộng dồn mỗi giây)
  const clientIdRef = useRef(null);
  const startedAtMsRef = useRef(0);
  const segmentStartMsRef = useRef(0);
  const accumulatedActiveMsRef = useRef(0);
  const pauseStartedAtMsRef = useRef(0);
  const totalPausedMsRef = useRef(0);

  // Bộ đếm bước chân trong useRef (cảm biến ghi vào đây, KHÔNG gọi setState)
  const accumulatedStepsRef = useRef(0);
  const currentSubStepsRef = useRef(0);
  const totalStepsRef = useRef(0);

  // Mảng vòng kích thước cố định 32 phần tử để tính cadence cửa sổ trượt 30s
  const cadenceRingRef = useRef(new Array(CADENCE_RING_SIZE).fill(null));
  const cadenceRingCursorRef = useRef(0);

  // Mảng splits theo từng km và mốc thời gian km trước đó
  const splitsRef = useRef([]);
  const lastSplitKmRef = useRef(0);
  const lastSplitDurationSecRef = useRef(0);

  // Theo dõi mốc lưu checkpoint gần nhất (mỗi 15s hoặc mỗi 50 bước)
  const lastCheckpointTimeMsRef = useRef(0);
  const lastCheckpointStepsRef = useRef(0);

  // Bộ đếm phục vụ nghiệm thu mục #7 (chứng minh không setState theo từng bước chân)
  const sensorEventCountRef = useRef(0);
  const uiTickCountRef = useRef(0);

  // Tính sải chân hiện hành
  const currentStrideInfo = resolveStride({
    heightCm,
    gender,
    calibratedStrideM,
  });

  // Đồng bộ sải chân vào state hiển thị khi đang ở trạng thái nghỉ/chuẩn bị
  useEffect(() => {
    if (status === 'idle' || status === 'ready') {
      setMetrics((prev) => ({
        ...prev,
        strideM: currentStrideInfo.strideM,
        strideSource: currentStrideInfo.strideSource,
        weightKg,
      }));
    }
  }, [status, currentStrideInfo.strideM, currentStrideInfo.strideSource, weightKg]);

  // Làm mới số lượng bản ghi trong hàng đợi
  const refreshQueueCount = useCallback(async () => {
    const q = await getQueuedRuns();
    setQueuedCount(q.length);
    return q.length;
  }, []);

  // Khởi tạo khi mở màn hình: nạp sải chân hiệu chuẩn, kiểm tra checkpoint dở dang & đồng bộ hàng đợi
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const savedCal = await loadCalibratedStrideM();
      if (mounted && savedCal !== null) {
        setCalibratedStrideM(savedCal);
      }

      const cp = await loadCheckpoint();
      if (mounted && cp && cp.clientId) {
        setRecoverableCheckpoint(cp);
      }

      await refreshQueueCount();
      const syncRes = await syncQueuedRuns();
      if (mounted) {
        setQueuedCount(syncRes.remainingCount);
        if (syncRes.authRequired) {
          setAuthExpired(true);
        }
      }
    }

    bootstrap();

    const unsubAuth = subscribeUnauthorized(() => {
      if (mounted) {
        setAuthExpired(true);
        refreshQueueCount();
      }
    });

    return () => {
      mounted = false;
      unsubAuth();
    };
  }, [refreshQueueCount]);

  // Hàm dọn dẹp cảm biến, bộ đếm giây và KeepAwake
  const cleanupHardwareAndTimer = useCallback(() => {
    if (pedometerSubRef.current) {
      try {
        pedometerSubRef.current.remove();
      } catch {
        // Bỏ qua lỗi khi hủy listener
      }
      pedometerSubRef.current = null;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
  }, []);

  // Dọn dẹp khi unmount
  useEffect(() => {
    return () => {
      cleanupHardwareAndTimer();
    };
  }, [cleanupHardwareAndTimer]);

  // Ghi mẫu bước vào mảng vòng kích thước cố định (không cấp phát mảng mới)
  const recordCadenceSample = useCallback((nowMs, totalSteps) => {
    const idx = cadenceRingCursorRef.current % CADENCE_RING_SIZE;
    cadenceRingRef.current[idx] = { ts: nowMs, steps: totalSteps };
    cadenceRingCursorRef.current += 1;
  }, []);

  // Lưu checkpoint hiện tại xuống AsyncStorage (không gọi setState)
  const persistCurrentCheckpoint = useCallback(
    async (nowMs = Date.now()) => {
      if (!clientIdRef.current) return;
      const activeMs =
        accumulatedActiveMsRef.current +
        (segmentStartMsRef.current > 0 ? Math.max(0, nowMs - segmentStartMsRef.current) : 0);

      lastCheckpointTimeMsRef.current = nowMs;
      lastCheckpointStepsRef.current = totalStepsRef.current;

      await saveCheckpoint({
        clientId: clientIdRef.current,
        startedAtMs: startedAtMsRef.current,
        accumulatedActiveMs: activeMs,
        totalPausedMs: totalPausedMsRef.current,
        steps: totalStepsRef.current,
        strideM: currentStrideInfo.strideM,
        strideSource: currentStrideInfo.strideSource,
        weightKg,
        source: 'pedometer',
        splits: splitsRef.current,
      });
    },
    [currentStrideInfo.strideM, currentStrideInfo.strideSource, weightKg]
  );

  // Đăng ký lắng nghe Pedometer.watchStepCount (CHỈ ghi vào useRef, KHÔNG setState)
  const attachPedometerListener = useCallback(() => {
    if (pedometerSubRef.current) {
      try {
        pedometerSubRef.current.remove();
      } catch {
        // Bỏ qua
      }
      pedometerSubRef.current = null;
    }

    currentSubStepsRef.current = 0;

    try {
      pedometerSubRef.current = Pedometer.watchStepCount((result) => {
        sensorEventCountRef.current += 1;
        const deltaSteps = Math.max(0, Number(result?.steps) || 0);
        currentSubStepsRef.current = deltaSteps;
        const nextTotalSteps = accumulatedStepsRef.current + deltaSteps;
        totalStepsRef.current = nextTotalSteps;

        const nowMs = Date.now();
        recordCadenceSample(nowMs, nextTotalSteps);

        // Nếu tăng đủ 50 bước kể từ lần checkpoint trước -> ghi bất đồng bộ xuống AsyncStorage
        if (nextTotalSteps - lastCheckpointStepsRef.current >= CHECKPOINT_STEP_DELTA) {
          persistCurrentCheckpoint(nowMs).catch(() => {});
        }
      });
    } catch {
      // Nếu thiết bị báo lỗi khi gắn listener
    }
  }, [persistCurrentCheckpoint, recordCadenceSample]);

  // Hàm cập nhật giao diện mỗi 1000 ms duy nhất khi đang chạy
  const startUiTickInterval = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    intervalIdRef.current = setInterval(() => {
      const nowMs = Date.now();
      const activeMs =
        accumulatedActiveMsRef.current +
        (segmentStartMsRef.current > 0 ? Math.max(0, nowMs - segmentStartMsRef.current) : 0);
      const durationSec = Math.floor(activeMs / 1000);
      const pausedSec = Math.floor(totalPausedMsRef.current / 1000);
      const currentSteps = totalStepsRef.current;

      const computed = computeRunMetrics({
        steps: currentSteps,
        strideM: currentStrideInfo.strideM,
        durationSec,
        weightKg,
      });

      // Tính cadence cửa sổ trượt 30s; nếu chưa đủ mẫu trong 30s đầu thì dùng cadence trung bình
      const windowCadence = calculateSlidingCadenceSpm(
        cadenceRingRef.current,
        nowMs,
        CADENCE_WINDOW_MS
      );
      const displayCadence = windowCadence > 0 ? windowCadence : computed.cadenceSpm;

      // Ghi nhận split mới mỗi khi hoàn thành thêm 1 km chẵn
      const wholeKm = Math.floor(computed.distanceKm);
      if (wholeKm > lastSplitKmRef.current && splitsRef.current.length < MAX_SPLITS_COUNT) {
        for (let km = lastSplitKmRef.current + 1; km <= wholeKm; km += 1) {
          const splitSec = Math.max(1, durationSec - lastSplitDurationSecRef.current);
          splitsRef.current.push({ km, sec: splitSec });
          lastSplitDurationSecRef.current = durationSec;
          lastSplitKmRef.current = km;
        }
      }

      // Lưu checkpoint định kỳ mỗi 15 giây
      if (nowMs - lastCheckpointTimeMsRef.current >= CHECKPOINT_INTERVAL_MS) {
        persistCurrentCheckpoint(nowMs).catch(() => {});
      }

      uiTickCountRef.current += 1;

      setMetrics({
        ...computed,
        strideSource: currentStrideInfo.strideSource,
        pausedSec,
        cadenceSpm: displayCadence,
      });
    }, 1000);
  }, [currentStrideInfo.strideM, currentStrideInfo.strideSource, persistCurrentCheckpoint, weightKg]);

  // ==================== CÁC HÀNH ĐỘNG CỦA MÁY TRẠNG THÁI ====================

  /**
   * Bước 1: Kiểm tra cảm biến Pedometer và xin quyền ACTIVITY_RECOGNITION / Motion.
   * Chuyển từ 'idle' -> 'ready' nếu hợp lệ.
   */
  const prepareSensor = useCallback(async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) {
        setSensorStatus({
          checked: true,
          available: false,
          permissionGranted: false,
          canAskAgain: false,
          errorReason: 'unavailable',
        });
        setStatusMessage(
          'Thiết bị không có cảm biến đếm bước chân phần cứng. Bạn có thể nhập tay buổi chạy.'
        );
        return { ok: false, reason: 'unavailable' };
      }

      let perm = await Pedometer.getPermissionsAsync();
      if (!perm.granted && perm.canAskAgain !== false) {
        perm = await Pedometer.requestPermissionsAsync();
      }

      if (!perm.granted) {
        const reason = perm.canAskAgain === false ? 'denied_permanent' : 'denied';
        setSensorStatus({
          checked: true,
          available: true,
          permissionGranted: false,
          canAskAgain: Boolean(perm.canAskAgain),
          errorReason: reason,
        });
        setStatusMessage(
          'Chưa được cấp quyền Theo dõi vận động. Hãy mở Cài đặt hệ thống hoặc nhập tay buổi chạy.'
        );
        return { ok: false, reason };
      }

      setSensorStatus({
        checked: true,
        available: true,
        permissionGranted: true,
        canAskAgain: true,
        errorReason: null,
      });
      setStatusMessage('');
      setStatus('ready');
      return { ok: true, reason: null };
    } catch {
      setSensorStatus({
        checked: true,
        available: false,
        permissionGranted: false,
        canAskAgain: false,
        errorReason: 'unavailable',
      });
      setStatusMessage(
        'Không thể truy cập cảm biến bước chân trên thiết bị này. Bạn có thể nhập tay buổi chạy.'
      );
      return { ok: false, reason: 'unavailable' };
    }
  }, []);

  /**
   * Bước 2: Bắt đầu buổi chạy mới ('idle' | 'ready' -> 'running').
   * Chỉ cho phép chạy MỘT buổi cùng lúc.
   */
  const startRun = useCallback(async () => {
    if (activeRunLockRef.current) {
      return false;
    }

    // Nếu chưa kiểm tra quyền thì kiểm tra trước
    if (!sensorStatus.permissionGranted || !sensorStatus.available) {
      const check = await prepareSensor();
      if (!check.ok) {
        return false;
      }
    }

    activeRunLockRef.current = true;
    const nowMs = Date.now();

    clientIdRef.current = generateClientId(nowMs);
    startedAtMsRef.current = nowMs;
    segmentStartMsRef.current = nowMs;
    accumulatedActiveMsRef.current = 0;
    pauseStartedAtMsRef.current = 0;
    totalPausedMsRef.current = 0;

    accumulatedStepsRef.current = 0;
    currentSubStepsRef.current = 0;
    totalStepsRef.current = 0;

    cadenceRingRef.current = new Array(CADENCE_RING_SIZE).fill(null);
    cadenceRingCursorRef.current = 0;
    recordCadenceSample(nowMs, 0);

    splitsRef.current = [];
    lastSplitKmRef.current = 0;
    lastSplitDurationSecRef.current = 0;

    lastCheckpointTimeMsRef.current = nowMs;
    lastCheckpointStepsRef.current = 0;
    sensorEventCountRef.current = 0;
    uiTickCountRef.current = 0;

    setCompletedRun(null);
    setStatusMessage('');
    setMetrics({
      ...INITIAL_METRICS,
      strideM: currentStrideInfo.strideM,
      strideSource: currentStrideInfo.strideSource,
      weightKg,
    });

    await activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    attachPedometerListener();
    startUiTickInterval();
    await persistCurrentCheckpoint(nowMs);
    setStatus('running');
    return true;
  }, [
    attachPedometerListener,
    currentStrideInfo.strideM,
    currentStrideInfo.strideSource,
    persistCurrentCheckpoint,
    prepareSensor,
    recordCadenceSample,
    sensorStatus.available,
    sensorStatus.permissionGranted,
    startUiTickInterval,
    weightKg,
  ]);

  /**
   * Bước 3: Tạm dừng buổi chạy ('running' -> 'paused').
   * Ngắt listener cảm biến ngay để bỏ qua mọi bước chân trong lúc tạm dừng,
   * đồng thời chốt thời gian di chuyển thực tế.
   */
  const pauseRun = useCallback(async () => {
    if (status !== 'running') return;
    const nowMs = Date.now();

    // Chốt số bước đã đi được trước khi tạm dừng
    accumulatedStepsRef.current = totalStepsRef.current;
    currentSubStepsRef.current = 0;

    // Chốt thời gian di chuyển của chặng vừa chạy
    if (segmentStartMsRef.current > 0) {
      accumulatedActiveMsRef.current += Math.max(0, nowMs - segmentStartMsRef.current);
      segmentStartMsRef.current = 0;
    }
    pauseStartedAtMsRef.current = nowMs;

    cleanupHardwareAndTimer();
    await persistCurrentCheckpoint(nowMs);
    setStatus('paused');
  }, [cleanupHardwareAndTimer, persistCurrentCheckpoint, status]);

  /**
   * Bước 4: Tiếp tục buổi chạy ('paused' -> 'running').
   */
  const resumeRun = useCallback(async () => {
    if (status !== 'paused') return;
    const nowMs = Date.now();

    if (pauseStartedAtMsRef.current > 0) {
      totalPausedMsRef.current += Math.max(0, nowMs - pauseStartedAtMsRef.current);
      pauseStartedAtMsRef.current = 0;
    }
    segmentStartMsRef.current = nowMs;
    recordCadenceSample(nowMs, totalStepsRef.current);

    await activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    attachPedometerListener();
    startUiTickInterval();
    setStatus('running');
  }, [attachPedometerListener, recordCadenceSample, startUiTickInterval, status]);

  /**
   * Bước 5: Dừng hẳn và lưu buổi chạy ('running' | 'paused' -> 'finishing' -> 'saved' | 'queued').
   */
  const stopRun = useCallback(
    async (note = '') => {
      if (status !== 'running' && status !== 'paused') {
        return null;
      }

      const nowMs = Date.now();
      if (status === 'running' && segmentStartMsRef.current > 0) {
        accumulatedActiveMsRef.current += Math.max(0, nowMs - segmentStartMsRef.current);
        segmentStartMsRef.current = 0;
      }
      if (status === 'paused' && pauseStartedAtMsRef.current > 0) {
        totalPausedMsRef.current += Math.max(0, nowMs - pauseStartedAtMsRef.current);
        pauseStartedAtMsRef.current = 0;
      }

      cleanupHardwareAndTimer();

      // Server yêu cầu durationSec từ 10 đến 21600 giây
      const rawDurationSec = Math.floor(accumulatedActiveMsRef.current / 1000);
      const finalDurationSec = Math.min(21600, Math.max(10, rawDurationSec));
      const finalPausedSec = Math.floor(totalPausedMsRef.current / 1000);
      const finalSteps = Math.min(100000, Math.max(0, totalStepsRef.current));

      const finalComputed = computeRunMetrics({
        steps: finalSteps,
        strideM: currentStrideInfo.strideM,
        durationSec: finalDurationSec,
        weightKg,
      });

      const startedDateObj = new Date(startedAtMsRef.current || nowMs);
      const runRecord = {
        clientId: clientIdRef.current || generateClientId(nowMs),
        date: localDateString(startedDateObj), // Ngày theo GIỜ ĐỊA PHƯƠNG
        startedAt: startedDateObj.toISOString(),
        endedAt: new Date(nowMs).toISOString(),
        source: 'pedometer',
        steps: finalComputed.steps,
        strideM: finalComputed.strideM,
        strideSource: currentStrideInfo.strideSource,
        distanceKm: finalComputed.distanceKm,
        durationSec: finalComputed.durationSec,
        pausedSec: finalPausedSec,
        avgSpeedKmh: finalComputed.avgSpeedKmh,
        paceSecPerKm: finalComputed.paceSecPerKm,
        cadenceSpm: finalComputed.cadenceSpm,
        met: finalComputed.met,
        weightKg: finalComputed.weightKg,
        calories: finalComputed.calories,
        splits:
          splitsRef.current.length > 0
            ? [...splitsRef.current]
            : finalComputed.paceSecPerKm
              ? [{ km: 1, sec: finalComputed.paceSecPerKm }]
              : [],
        note: typeof note === 'string' ? note.trim() : '',
      };

      setStatus('finishing');
      setStatusMessage('Đang lưu buổi chạy...');

      const saveResult = await finishAndSaveRun(runRecord, {
        onRetry: (retryAttempt, delayMs) => {
          setStatusMessage(
            `Mạng chậm, đang thử gửi lại lần ${retryAttempt} (sau ${delayMs / 1000}s)...`
          );
        },
      });

      activeRunLockRef.current = false;
      await refreshQueueCount();

      if (saveResult.status === 'saved') {
        setCompletedRun(saveResult.run);
        setStatusMessage('Đã lưu buổi chạy lên máy chủ thành công.');
        setStatus('saved');
      } else {
        if (saveResult.reason === 'unauthorized') {
          setAuthExpired(true);
          setStatusMessage(
            'Token hết hạn. Buổi chạy đã được giữ an toàn trong hàng đợi, vui lòng đăng nhập lại để đồng bộ.'
          );
        } else {
          setStatusMessage(
            'Đang ngoại tuyến. Buổi chạy đã lưu vào hàng đợi trên máy và sẽ tự gửi khi có mạng.'
          );
        }
        setCompletedRun({ ...runRecord, _queued: true });
        setStatus('queued');
      }

      return saveResult;
    },
    [
      cleanupHardwareAndTimer,
      currentStrideInfo.strideM,
      currentStrideInfo.strideSource,
      refreshQueueCount,
      status,
      weightKg,
    ]
  );

  /**
   * Hủy buổi chạy hiện tại không lưu.
   */
  const cancelRun = useCallback(async () => {
    cleanupHardwareAndTimer();
    activeRunLockRef.current = false;
    clientIdRef.current = null;
    await clearCheckpoint();
    setCompletedRun(null);
    setStatusMessage('');
    setStatus('idle');
  }, [cleanupHardwareAndTimer]);

  /**
   * Đặt lại về trạng thái 'idle' sau khi xem xong màn hình tóm tắt.
   */
  const resetToIdle = useCallback(() => {
    activeRunLockRef.current = false;
    setCompletedRun(null);
    setStatusMessage('');
    setMetrics({
      ...INITIAL_METRICS,
      strideM: currentStrideInfo.strideM,
      strideSource: currentStrideInfo.strideSource,
      weightKg,
    });
    setStatus('idle');
  }, [currentStrideInfo.strideM, currentStrideInfo.strideSource, weightKg]);

  // ==================== KHÔI PHỤC TỪ CHECKPOINT KHI MỞ LẠI APP ====================

  const restoreCheckpointSession = useCallback(async () => {
    if (!recoverableCheckpoint) return;
    const cp = recoverableCheckpoint;
    const nowMs = Date.now();

    activeRunLockRef.current = true;
    clientIdRef.current = cp.clientId;
    startedAtMsRef.current = cp.startedAtMs || nowMs;
    accumulatedActiveMsRef.current = Number(cp.accumulatedActiveMs) || 0;
    segmentStartMsRef.current = 0;

    // Thời gian từ lúc lưu checkpoint đến lúc mở lại app được tính là thời gian tạm dừng
    const offlineGapMs = cp.savedAtMs ? Math.max(0, nowMs - cp.savedAtMs) : 0;
    totalPausedMsRef.current = (Number(cp.totalPausedMs) || 0) + offlineGapMs;
    pauseStartedAtMsRef.current = nowMs;

    const restoredSteps = Math.max(0, Number(cp.steps) || 0);
    accumulatedStepsRef.current = restoredSteps;
    currentSubStepsRef.current = 0;
    totalStepsRef.current = restoredSteps;

    splitsRef.current = Array.isArray(cp.splits) ? [...cp.splits] : [];
    lastSplitKmRef.current = splitsRef.current.length;

    const durationSec = Math.floor(accumulatedActiveMsRef.current / 1000);
    const restoredMetrics = computeRunMetrics({
      steps: restoredSteps,
      strideM: cp.strideM || currentStrideInfo.strideM,
      durationSec,
      weightKg: cp.weightKg || weightKg,
    });

    setMetrics({
      ...restoredMetrics,
      strideSource: cp.strideSource || currentStrideInfo.strideSource,
      pausedSec: Math.floor(totalPausedMsRef.current / 1000),
    });

    setRecoverableCheckpoint(null);
    setStatusMessage('Đã khôi phục buổi chạy dở dang (đang tạm dừng). Bấm Tiếp tục để chạy tiếp.');
    setStatus('paused');
  }, [currentStrideInfo.strideM, currentStrideInfo.strideSource, recoverableCheckpoint, weightKg]);

  const discardCheckpointSession = useCallback(async () => {
    setRecoverableCheckpoint(null);
    await clearCheckpoint();
  }, []);

  // ==================== NHẬP TAY BUỔI CHẠY (SOURCE = "manual") ====================

  /**
   * Cho phép người dùng nhập tay buổi chạy khi máy không có cảm biến hoặc từ chối quyền.
   *
   * @param {{ steps: number, durationMin: number, note?: string }} manualInput
   */
  const submitManualRun = useCallback(
    async ({ steps, durationMin, note = '' }) => {
      const numericSteps = Math.round(Number(steps));
      const numericDurationSec = Math.round(Number(durationMin) * 60);

      if (!Number.isFinite(numericSteps) || numericSteps <= 0 || numericSteps > 100000) {
        return { ok: false, error: 'Số bước nhập tay phải từ 1 đến 100.000 bước.' };
      }
      if (
        !Number.isFinite(numericDurationSec) ||
        numericDurationSec < 10 ||
        numericDurationSec > 21600
      ) {
        return { ok: false, error: 'Thời gian chạy phải từ 1 phút đến 360 phút (6 giờ).' };
      }

      const computed = computeRunMetrics({
        steps: numericSteps,
        strideM: currentStrideInfo.strideM,
        durationSec: numericDurationSec,
        weightKg,
      });

      if (computed.avgSpeedKmh > 25) {
        return {
          ok: false,
          error: `Vận tốc tính được (${computed.avgSpeedKmh} km/h) vượt quá ngưỡng 25 km/h. Vui lòng kiểm tra lại số bước và thời gian.`,
        };
      }
      if (computed.calories > 3000) {
        return {
          ok: false,
          error: `Lượng calo (${computed.calories} kcal) vượt ngưỡng 3000 kcal.`,
        };
      }

      const nowMs = Date.now();
      const startedDate = new Date(nowMs - numericDurationSec * 1000);
      const manualRecord = {
        clientId: generateClientId(nowMs),
        date: localDateString(startedDate),
        startedAt: startedDate.toISOString(),
        endedAt: new Date(nowMs).toISOString(),
        source: 'manual',
        steps: computed.steps,
        strideM: computed.strideM,
        strideSource: currentStrideInfo.strideSource,
        distanceKm: computed.distanceKm,
        durationSec: computed.durationSec,
        pausedSec: 0,
        avgSpeedKmh: computed.avgSpeedKmh,
        paceSecPerKm: computed.paceSecPerKm,
        cadenceSpm: computed.cadenceSpm,
        met: computed.met,
        weightKg: computed.weightKg,
        calories: computed.calories,
        splits: computed.paceSecPerKm ? [{ km: 1, sec: computed.paceSecPerKm }] : [],
        note: typeof note === 'string' ? note.trim() : 'Nhập tay buổi chạy',
      };

      setStatus('finishing');
      setStatusMessage('Đang lưu buổi chạy nhập tay...');

      const result = await finishAndSaveRun(manualRecord);
      await refreshQueueCount();

      if (result.status === 'saved') {
        setCompletedRun(result.run);
        setStatusMessage('Đã lưu buổi chạy nhập tay thành công.');
        setStatus('saved');
      } else {
        setCompletedRun({ ...manualRecord, _queued: true });
        setStatusMessage('Buổi chạy nhập tay đã được xếp vào hàng đợi chờ đồng bộ.');
        setStatus('queued');
      }

      return { ok: true, result };
    },
    [currentStrideInfo.strideM, currentStrideInfo.strideSource, refreshQueueCount, weightKg]
  );

  // ==================== HIỆU CHUẨN SẢI CHÂN (0.4 m – 1.6 m) ====================

  const applyCalibration = useCallback(
    async (knownDistanceM, countedSteps) => {
      const check = calibrateStride(knownDistanceM, countedSteps);
      if (!check.valid) {
        return check;
      }
      setCalibratedStrideM(check.strideM);
      await saveCalibratedStrideM(check.strideM, profileId);
      return check;
    },
    [profileId]
  );

  const resetCalibrationToFormula = useCallback(async () => {
    setCalibratedStrideM(null);
    await saveCalibratedStrideM(null, profileId);
  }, [profileId]);

  // ==================== ĐỒNG BỘ HÀNG ĐỢI THỦ CÔNG ====================

  const triggerManualSync = useCallback(async () => {
    setStatusMessage('Đang đồng bộ hàng đợi với máy chủ...');
    const res = await syncQueuedRuns();
    setQueuedCount(res.remainingCount);
    if (res.authRequired) {
      setAuthExpired(true);
      setStatusMessage('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại để gửi hàng đợi.');
    } else if (res.remainingCount === 0) {
      setAuthExpired(false);
      setStatusMessage(
        res.syncedCount > 0
          ? `Đã đồng bộ thành công ${res.syncedCount} buổi chạy.`
          : 'Tất cả buổi chạy đã được đồng bộ.'
      );
      if (status === 'queued' && completedRun) {
        setCompletedRun((prev) => (prev ? { ...prev, _queued: false } : prev));
        setStatus('saved');
      }
    } else {
      setStatusMessage(`Còn ${res.remainingCount} buổi chạy trong hàng đợi (chưa có mạng).`);
    }
    return res;
  }, [completedRun, status]);

  const openSystemSettings = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  // Trả về các bộ đếm hiệu năng để hiển thị/kiểm chứng trên máy yếu
  const getPerformanceCounters = useCallback(
    () => ({
      sensorEvents: sensorEventCountRef.current,
      uiRenderTicks: uiTickCountRef.current,
    }),
    []
  );

  return {
    status,
    sensorStatus,
    metrics,
    completedRun,
    recoverableCheckpoint,
    queuedCount,
    authExpired,
    setAuthExpired,
    statusMessage,
    calibratedStrideM,
    prepareSensor,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    cancelRun,
    resetToIdle,
    restoreCheckpointSession,
    discardCheckpointSession,
    submitManualRun,
    applyCalibration,
    resetCalibrationToFormula,
    triggerManualSync,
    openSystemSettings,
    getPerformanceCounters,
  };
}
