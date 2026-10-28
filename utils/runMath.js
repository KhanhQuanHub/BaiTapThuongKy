// ============================================================================
// utils/runMath.js
// Tập hợp các hàm thuần (pure functions) tính toán chỉ số chạy bộ từ Pedometer:
// - Sải chân theo công thức giới tính/chiều cao hoặc sải chân hiệu chuẩn
// - Hiệu chuẩn sải chân (0.4 m – 1.6 m)
// - Quãng đường (km), Vận tốc (km/h), Pace (s/km & chuỗi mm:ss)
// - Cadence (bước/phút - trung bình buổi hoặc cửa sổ trượt 30 s)
// - Nội suy tuyến tính MET theo vận tốc và tính Calo tiêu hao
// ============================================================================

// BẢNG HẰNG SỐ MET THEO VẬN TỐC (CHỈNH SỬA TẠI MỘT CHỖ DUY NHẤT)
// GHI CHÚ QUAN TRỌNG: Đây là các mốc tham khảo theo tài liệu đề xuất của nhóm
// (4 km/h -> 3.0; 8 km/h -> 8.0; 10 km/h -> 11.5; 12 km/h -> 12.5).
// Khi đưa vào sử dụng y khoa / báo cáo chính thức, cần đối chiếu lại với nguồn
// Compendium of Physical Activities (Ainsworth et al.).
export const MET_SPEED_TABLE = [
  { speedKmh: 4.0, met: 3.0 },   // Mốc đi bộ
  { speedKmh: 8.0, met: 8.0 },   // Chạy bộ tốc độ vừa
  { speedKmh: 10.0, met: 11.5 }, // Chạy bộ nhanh
  { speedKmh: 12.0, met: 12.5 }, // Chạy bộ tốc độ cao
];

// Hệ số ước tính sải chân theo chiều cao
export const STRIDE_HEIGHT_FACTOR = {
  male: 0.415,
  female: 0.413,
};

// Ngưỡng hợp lệ của sải chân hiệu chuẩn (m)
export const MIN_CALIBRATED_STRIDE_M = 0.4;
export const MAX_CALIBRATED_STRIDE_M = 1.6;

// Ngưỡng quãng đường tối thiểu để tính Pace (10 m = 0.01 km)
export const MIN_DISTANCE_KM_FOR_PACE = 0.01;

// Kích thước cố định cho mảng vòng (ring buffer) tính cadence cửa sổ trượt 30 s
export const CADENCE_WINDOW_MS = 30000;
export const CADENCE_RING_SIZE = 32;

const roundTo = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + 1e-12) * factor) / factor;
};

/**
 * Chuẩn hóa giới tính từ hồ sơ người dùng ('male' | 'female' | 'Nam' | 'Nữ').
 *
 * @param {string} [gender]
 * @returns {'male' | 'female'}
 */
export function normalizeGender(gender) {
  if (!gender || typeof gender !== 'string') return 'male';
  const normalized = gender.trim().toLowerCase();
  if (normalized === 'female' || normalized === 'nữ' || normalized === 'nu') {
    return 'female';
  }
  return 'male';
}

/**
 * Tính sải chân công thức theo chiều cao (cm) và giới tính.
 * Nam: cao_cm * 0.415 / 100
 * Nữ : cao_cm * 0.413 / 100
 *
 * @param {number} heightCm Chiều cao tính bằng cm
 * @param {string} [gender='male'] Giới tính ('male' | 'female' | 'Nam' | 'Nữ')
 * @returns {number} Sải chân (m), làm tròn 3 chữ số thập phân
 */
export function calculateFormulaStrideM(heightCm, gender = 'male') {
  const numericHeight = Number(heightCm);
  const safeHeight = Number.isFinite(numericHeight) && numericHeight > 0 ? numericHeight : 170;
  const key = normalizeGender(gender);
  const factor = STRIDE_HEIGHT_FACTOR[key];
  return roundTo((safeHeight * factor) / 100, 3);
}

/**
 * Xác định sải chân sử dụng cho buổi chạy từ hồ sơ người dùng.
 * Nếu profile.calibratedStrideM khác null và hợp lệ (0.4 - 1.6 m) thì ưu tiên dùng.
 *
 * @param {object} [profile] Hồ sơ người dùng { heightCm, height, gender, calibratedStrideM }
 * @returns {{ strideM: number, strideSource: 'calibrated' | 'formula' }}
 */
export function resolveStride(profile = {}) {
  const cal = profile?.calibratedStrideM;
  if (
    cal !== null &&
    cal !== undefined &&
    typeof cal === 'number' &&
    Number.isFinite(cal) &&
    cal >= MIN_CALIBRATED_STRIDE_M &&
    cal <= MAX_CALIBRATED_STRIDE_M
  ) {
    return {
      strideM: roundTo(cal, 3),
      strideSource: 'calibrated',
    };
  }

  const heightCm = profile?.heightCm ?? profile?.height ?? 170;
  const gender = profile?.gender ?? 'male';
  return {
    strideM: calculateFormulaStrideM(heightCm, gender),
    strideSource: 'formula',
  };
}

/**
 * Trả về giá trị số của sải chân L (m) từ profile.
 *
 * @param {object} [profile]
 * @returns {number}
 */
export function getStrideLengthM(profile = {}) {
  return resolveStride(profile).strideM;
}

/**
 * Hiệu chuẩn sải chân thực tế: strideCal = knownDistanceM / countedSteps.
 * Từ chối giá trị ngoài khoảng 0.4 m - 1.6 m.
 *
 * @param {number} knownDistanceM Quãng đường thực tế đã biết (m), ví dụ 400 m
 * @param {number} countedSteps Số bước đếm được trên quãng đường đó
 * @returns {{ valid: boolean, strideM: number | null, error: string | null }}
 */
export function calibrateStride(knownDistanceM, countedSteps) {
  const distM = Number(knownDistanceM);
  const steps = Number(countedSteps);

  if (!Number.isFinite(distM) || distM <= 0) {
    return {
      valid: false,
      strideM: null,
      error: 'Quãng đường chuẩn phải lớn hơn 0 m.',
    };
  }
  if (!Number.isFinite(steps) || steps <= 0) {
    return {
      valid: false,
      strideM: null,
      error: 'Số bước đếm được phải lớn hơn 0.',
    };
  }

  const rawStride = distM / steps;
  const strideM = roundTo(rawStride, 3);

  if (strideM < MIN_CALIBRATED_STRIDE_M || strideM > MAX_CALIBRATED_STRIDE_M) {
    return {
      valid: false,
      strideM: null,
      error: `Sải chân tính được (${strideM.toFixed(3)} m) nằm ngoài khoảng hợp lệ 0.4 m – 1.6 m.`,
    };
  }

  return {
    valid: true,
    strideM,
    error: null,
  };
}

/**
 * Tính quãng đường S (km) = steps * strideM / 1000.
 *
 * @param {number} steps Tổng số bước chân
 * @param {number} strideM Sải chân (m)
 * @returns {number} Quãng đường (km), làm tròn 2 chữ số thập phân
 */
export function calculateDistanceKm(steps, strideM) {
  const s = Number(steps);
  const l = Number(strideM);
  if (!Number.isFinite(s) || !Number.isFinite(l) || s <= 0 || l <= 0) {
    return 0;
  }
  return roundTo((s * l) / 1000, 2);
}

/**
 * Tính vận tốc trung bình V (km/h) = distanceKm / (durationSec / 3600).
 *
 * @param {number} distanceKm Quãng đường (km)
 * @param {number} durationSec Thời gian di chuyển (giây)
 * @returns {number} Vận tốc (km/h), làm tròn 2 chữ số thập phân
 */
export function calculateSpeedKmh(distanceKm, durationSec) {
  const dist = Number(distanceKm);
  const sec = Number(durationSec);
  if (!Number.isFinite(dist) || !Number.isFinite(sec) || dist <= 0 || sec <= 0) {
    return 0;
  }
  const hours = sec / 3600;
  return roundTo(dist / hours, 2);
}

/**
 * Tính Pace (giây/km) = durationSec / distanceKm.
 * Nếu quãng đường < 10 m (0.01 km) hoặc durationSec = 0 thì trả về null (hiển thị "--:--").
 *
 * @param {number} distanceKm Quãng đường (km)
 * @param {number} durationSec Thời gian di chuyển (giây)
 * @returns {number | null} Số giây trên mỗi km (làm tròn số nguyên) hoặc null
 */
export function calculatePaceSecPerKm(distanceKm, durationSec) {
  const dist = Number(distanceKm);
  const sec = Number(durationSec);
  if (
    !Number.isFinite(dist) ||
    !Number.isFinite(sec) ||
    sec <= 0 ||
    dist < MIN_DISTANCE_KM_FOR_PACE
  ) {
    return null;
  }
  return Math.round(sec / dist);
}

/**
 * Định dạng Pace từ số giây/km sang chuỗi "mm:ss".
 * Nếu null hoặc <= 0 thì trả về "--:--".
 *
 * @param {number | null | undefined} paceSecPerKm
 * @returns {string}
 */
export function formatPaceSec(paceSecPerKm) {
  if (
    paceSecPerKm === null ||
    paceSecPerKm === undefined ||
    typeof paceSecPerKm !== 'number' ||
    !Number.isFinite(paceSecPerKm) ||
    paceSecPerKm <= 0
  ) {
    return '--:--';
  }
  const totalSec = Math.round(paceSecPerKm);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Tính Cadence trung bình (bước/phút) = steps / (durationSec / 60).
 *
 * @param {number} steps Tổng số bước
 * @param {number} durationSec Thời gian di chuyển (giây)
 * @returns {number} Số bước/phút (số nguyên)
 */
export function calculateCadenceSpm(steps, durationSec) {
  const s = Number(steps);
  const sec = Number(durationSec);
  if (!Number.isFinite(s) || !Number.isFinite(sec) || s <= 0 || sec <= 0) {
    return 0;
  }
  return Math.round(s / (sec / 60));
}

/**
 * Tính Cadence thời gian thực trên cửa sổ trượt 30 giây từ mảng vòng kích thước cố định.
 * Mỗi phần tử trong buffer có dạng { ts: number, steps: number }.
 *
 * @param {Array<{ts: number, steps: number}>} samples Mảng các mẫu thời gian thực
 * @param {number} nowMs Thời điểm hiện tại (ms)
 * @param {number} [windowMs=CADENCE_WINDOW_MS] Độ rộng cửa sổ trượt (mặc định 30000 ms)
 * @returns {number} Bước/phút trong cửa sổ trượt
 */
export function calculateSlidingCadenceSpm(samples, nowMs, windowMs = CADENCE_WINDOW_MS) {
  if (!Array.isArray(samples) || samples.length < 2) {
    return 0;
  }
  const cutoffMs = nowMs - windowMs;
  let oldest = null;
  let newest = null;

  for (let i = 0; i < samples.length; i += 1) {
    const item = samples[i];
    if (!item || typeof item.ts !== 'number' || item.ts < cutoffMs || item.ts > nowMs) {
      continue;
    }
    if (!oldest || item.ts < oldest.ts) {
      oldest = item;
    }
    if (!newest || item.ts > newest.ts) {
      newest = item;
    }
  }

  if (!oldest || !newest || newest.ts <= oldest.ts) {
    return 0;
  }
  // Nếu mẫu mới nhất đã quá cũ (> 10s không có bước mới), người dùng đã dừng bước
  if (nowMs - newest.ts > 10000) {
    return 0;
  }

  const deltaSteps = newest.steps - oldest.steps;
  const deltaMs = newest.ts - oldest.ts;
  if (deltaSteps <= 0 || deltaMs < 1000) {
    return 0;
  }

  return Math.round((deltaSteps / (deltaMs / 60000)));
}

/**
 * Nội suy tuyến tính hệ số MET theo vận tốc (km/h) dựa trên bảng MET_SPEED_TABLE.
 * - Vận tốc <= 0: trả về 0
 * - Dưới 8 km/h: nội suy tuyến tính về mốc đi bộ (4 km/h -> 3.0); dưới 4 km/h giữ 3.0
 * - Từ 8 -> 10 km/h: nội suy tuyến tính 8.0 -> 11.5
 * - Từ 10 -> 12 km/h: nội suy tuyến tính 11.5 -> 12.5
 * - Trên 12 km/h: giữ mốc trần 12.5
 *
 * @param {number} speedKmh Vận tốc trung bình (km/h)
 * @param {Array<{speedKmh: number, met: number}>} [table=MET_SPEED_TABLE] Bảng mốc MET
 * @returns {number} Hệ số MET làm tròn 2 chữ số thập phân
 */
export function interpolateMet(speedKmh, table = MET_SPEED_TABLE) {
  const v = Number(speedKmh);
  if (!Number.isFinite(v) || v <= 0 || !Array.isArray(table) || table.length === 0) {
    return 0;
  }

  const first = table[0];
  if (v <= first.speedKmh) {
    return roundTo(first.met, 2);
  }

  const last = table[table.length - 1];
  if (v >= last.speedKmh) {
    return roundTo(last.met, 2);
  }

  for (let i = 0; i < table.length - 1; i += 1) {
    const low = table[i];
    const high = table[i + 1];
    if (v >= low.speedKmh && v <= high.speedKmh) {
      const span = high.speedKmh - low.speedKmh;
      if (span <= 0) return roundTo(low.met, 2);
      const ratio = (v - low.speedKmh) / span;
      const interpolated = low.met + ratio * (high.met - low.met);
      return roundTo(interpolated, 2);
    }
  }

  return roundTo(last.met, 2);
}

/**
 * Tính lượng Calo tiêu hao (kcal) = MET * weightKg * (durationSec / 3600).
 *
 * @param {number} met Hệ số MET
 * @param {number} weightKg Cân nặng người chạy (kg)
 * @param {number} durationSec Thời gian di chuyển (giây)
 * @returns {number} Lượng kcal tiêu hao (làm tròn số nguyên)
 */
export function calculateCalories(met, weightKg, durationSec) {
  const m = Number(met);
  const w = Number(weightKg);
  const sec = Number(durationSec);
  if (!Number.isFinite(m) || !Number.isFinite(w) || !Number.isFinite(sec)) {
    return 0;
  }
  if (m <= 0 || w <= 0 || sec <= 0) {
    return 0;
  }
  return Math.round(m * w * (sec / 3600));
}

/**
 * Tổng hợp toàn bộ các chỉ số của một buổi chạy bộ từ các đầu vào cơ bản.
 *
 * @param {object} params
 * @param {number} params.steps Tổng số bước
 * @param {number} params.strideM Sải chân (m)
 * @param {number} params.durationSec Thời gian di chuyển thực tế (giây)
 * @param {number} [params.weightKg=60] Cân nặng (kg)
 * @returns {{
 *   steps: number,
 *   strideM: number,
 *   distanceKm: number,
 *   durationSec: number,
 *   avgSpeedKmh: number,
 *   paceSecPerKm: number | null,
 *   paceFormatted: string,
 *   cadenceSpm: number,
 *   met: number,
 *   weightKg: number,
 *   calories: number
 * }}
 */
export function computeRunMetrics({
  steps = 0,
  strideM = 0.726,
  durationSec = 0,
  weightKg = 60,
}) {
  const safeSteps = Math.max(0, Math.round(Number(steps) || 0));
  const safeStride = roundTo(Number(strideM) || 0.726, 3);
  const safeDuration = Math.max(0, Math.round(Number(durationSec) || 0));
  const safeWeight = Number(weightKg) > 0 ? Number(weightKg) : 60;

  const distanceKm = calculateDistanceKm(safeSteps, safeStride);
  const avgSpeedKmh = calculateSpeedKmh(distanceKm, safeDuration);
  const paceSecPerKm = calculatePaceSecPerKm(distanceKm, safeDuration);
  const paceFormatted = formatPaceSec(paceSecPerKm);
  const cadenceSpm = calculateCadenceSpm(safeSteps, safeDuration);
  const met = avgSpeedKmh > 0 ? interpolateMet(avgSpeedKmh) : 0;
  const calories = calculateCalories(met, safeWeight, safeDuration);

  return {
    steps: safeSteps,
    strideM: safeStride,
    distanceKm,
    durationSec: safeDuration,
    avgSpeedKmh,
    paceSecPerKm,
    paceFormatted,
    cadenceSpm,
    met,
    weightKg: safeWeight,
    calories,
  };
}
