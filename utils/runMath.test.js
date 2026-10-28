// ============================================================================
// utils/runMath.test.js
// Bộ kiểm thử đơn vị (Unit Tests) cho utils/runMath.js và utils/dateLocal.js.
// Có thể chạy trực tiếp bằng lệnh: node utils/runMath.test.js
// ============================================================================

import assert from 'node:assert/strict';
import {
  calculateFormulaStrideM,
  resolveStride,
  calibrateStride,
  calculateDistanceKm,
  calculateSpeedKmh,
  calculatePaceSecPerKm,
  formatPaceSec,
  calculateCadenceSpm,
  calculateSlidingCadenceSpm,
  interpolateMet,
  calculateCalories,
  computeRunMetrics,
} from './runMath.js';
import { localDateString, isValidDateString } from './dateLocal.js';

const results = [];

function runTest(name, fn) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, passed: false, error: err.message });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

// 1. Kiểm thử sải chân công thức & sải chân hiệu chuẩn
runTest('1. Sải chân công thức: nam 175cm -> 0.726m, nữ 162cm -> 0.669m', () => {
  assert.equal(calculateFormulaStrideM(175, 'male'), 0.726);
  assert.equal(calculateFormulaStrideM(162, 'female'), 0.669);
});

runTest('2. Ưu tiên calibratedStrideM trong profile khi khác null', () => {
  const formulaRes = resolveStride({ heightCm: 175, gender: 'male', calibratedStrideM: null });
  assert.deepEqual(formulaRes, { strideM: 0.726, strideSource: 'formula' });

  const calRes = resolveStride({ heightCm: 175, gender: 'male', calibratedStrideM: 0.785 });
  assert.deepEqual(calRes, { strideM: 0.785, strideSource: 'calibrated' });
});

// 2. Kiểm thử hiệu chuẩn sải chân (400m & biên 0.4 - 1.6m)
runTest('3. Hiệu chuẩn sải chân 400m: hợp lệ trong [0.4, 1.6] và sai số quãng đường < 5%', () => {
  // Đi 400m đếm được 540 bước -> strideCal = 0.741m
  const cal = calibrateStride(400, 540);
  assert.equal(cal.valid, true);
  assert.equal(cal.strideM, 0.741);

  // Kiểm tra sai số quãng đường khi chạy lại 400m với 540 bước (tức 0.40 km)
  const measuredKm = calculateDistanceKm(540, cal.strideM);
  const actualKm = 0.4;
  const errorPercent = (Math.abs(measuredKm - actualKm) / actualKm) * 100;
  assert.equal(measuredKm, 0.4);
  assert.ok(errorPercent < 5, `Sai số ${errorPercent}% phải < 5%`);
});

runTest('4. Từ chối sải chân hiệu chuẩn ngoài khoảng 0.4m - 1.6m', () => {
  const tooShort = calibrateStride(400, 1200); // 0.333m < 0.4m
  assert.equal(tooShort.valid, false);
  assert.equal(tooShort.strideM, null);

  const tooLong = calibrateStride(400, 200); // 2.0m > 1.6m
  assert.equal(tooLong.valid, false);
  assert.equal(tooLong.strideM, null);

  // Biên hợp lệ 0.4m và 1.6m
  assert.equal(calibrateStride(400, 1000).valid, true); // 0.400m
  assert.equal(calibrateStride(400, 250).valid, true);  // 1.600m
});

// 3. Kiểm thử công thức mẫu đề bài (id: 4)
runTest('5. Khớp chính xác 100% với bản ghi mẫu trong đề bài (5645 bước, 1800s, 60kg)', () => {
  const m = computeRunMetrics({
    steps: 5645,
    strideM: 0.726,
    durationSec: 1800,
    weightKg: 60,
  });
  assert.equal(m.distanceKm, 4.1);
  assert.equal(m.avgSpeedKmh, 8.2);
  assert.equal(m.paceSecPerKm, 439);
  assert.equal(m.paceFormatted, '07:19');
  assert.equal(m.cadenceSpm, 188);
  assert.equal(m.met, 8.35);
  assert.equal(m.calories, 251);
});

// 4. Kiểm thử nội suy tuyến tính MET ở các khoảng vận tốc
runTest('6. Nội suy tuyến tính MET theo vận tốc (4->3.0, 8->8.0, 10->11.5, 12->12.5)', () => {
  assert.equal(interpolateMet(0), 0);
  assert.equal(interpolateMet(4), 3.0);
  assert.equal(interpolateMet(6), 5.5);     // Chính giữa 4 km/h (3.0) và 8 km/h (8.0)
  assert.equal(interpolateMet(7.26), 7.08); // Bản ghi id=1 trong db.jsonc
  assert.equal(interpolateMet(7.62), 7.53); // Bản ghi id=2 trong db.jsonc
  assert.equal(interpolateMet(8), 8.0);
  assert.equal(interpolateMet(8.2), 8.35);  // Bản ghi id=4 trong db.jsonc
  assert.equal(interpolateMet(9), 9.75);    // Chính giữa 8 km/h (8.0) và 10 km/h (11.5)
  assert.equal(interpolateMet(9.34), 10.35);// Bản ghi id=3 trong db.jsonc
  assert.equal(interpolateMet(10), 11.5);
  assert.equal(interpolateMet(11), 12.0);   // Chính giữa 10 km/h (11.5) và 12 km/h (12.5)
  assert.equal(interpolateMet(12), 12.5);
  assert.equal(interpolateMet(15), 12.5);   // Chạm trần
});

// 5. Kiểm thử chia cho 0 & quãng đường < 10m
runTest('7. Chia cho 0: distance < 10m (0.01km) hoặc duration = 0 -> pace "--:--"', () => {
  assert.equal(calculatePaceSecPerKm(0, 100), null);
  assert.equal(calculatePaceSecPerKm(0.009, 30), null); // 9m < 10m
  assert.equal(calculatePaceSecPerKm(1.0, 0), null);
  assert.equal(formatPaceSec(null), '--:--');
  assert.equal(formatPaceSec(0), '--:--');

  const mZero = computeRunMetrics({ steps: 10, strideM: 0.726, durationSec: 15, weightKg: 60 });
  // 10 * 0.726 = 7.26m -> 0.01 km khi làm tròn 2 số lẻ; thử 5 bước = 3.63m -> 0.00 km
  const mUnder10m = computeRunMetrics({ steps: 5, strideM: 0.726, durationSec: 15, weightKg: 60 });
  assert.equal(mUnder10m.distanceKm, 0);
  assert.equal(mUnder10m.paceSecPerKm, null);
  assert.equal(mUnder10m.paceFormatted, '--:--');
  assert.ok(mZero);
});

// 6. Kiểm thử Cadence cửa sổ trượt 30s
runTest('8. Cadence cửa sổ trượt 30s tính đúng bước/phút', () => {
  const samples = [
    { ts: 1000, steps: 0 },
    { ts: 16000, steps: 45 },
    { ts: 31000, steps: 90 },
  ];
  // Trong 30s (từ 1000ms đến 31000ms) đi được 90 bước -> 180 bước/phút
  assert.equal(calculateSlidingCadenceSpm(samples, 31000, 30000), 180);
});

// 7. Kiểm thử ngày địa phương lúc 00:30 giờ Việt Nam (UTC+7)
runTest('9. Chạy lúc 00:30 giờ Việt Nam (UTC+7): date là ngày hôm đó, không bị lùi về hôm trước như UTC', () => {
  // 2026-10-28T00:30:00+07:00 tương đương 2026-10-27T17:30:00.000Z
  const instant = new Date('2026-10-28T00:30:00+07:00');
  // Nếu dùng UTC (toISOString) sẽ bị sai thành 2026-10-27
  assert.equal(instant.toISOString().slice(0, 10), '2026-10-27');
  // Dùng localDateString theo giờ Việt Nam (+420 phút) trả về đúng 2026-10-28
  assert.equal(localDateString(instant, 420), '2026-10-28');
  // Trên máy đang đặt múi giờ Việt Nam (UTC+7), gọi mặc định cũng trả về 2026-10-28
  if (instant.getTimezoneOffset() === -420) {
    assert.equal(localDateString(instant), '2026-10-28');
  }
  assert.equal(isValidDateString('2026-10-28'), true);
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('28-10-2026'), false);
});

const failed = results.filter((r) => !r.passed);
console.log(`\nTổng kết kiểm thử logic thuần: ${results.length - failed.length}/${results.length} PASS`);
if (failed.length > 0) {
  process.exit(1);
}
