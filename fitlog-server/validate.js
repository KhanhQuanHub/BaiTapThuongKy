// ================================================================
// validate.js - KIỂM TRA DỮ LIỆU ĐẦU VÀO CHO BẢNG "runs" (422 Unprocessable Entity)
// Các quy tắc kiểm tra khi POST / PATCH / PUT vào /runs:
//   1. Có đủ các trường bắt buộc: date, steps, strideM, distanceKm,
//      durationSec, avgSpeedKmh, calories
//   2. date đúng định dạng YYYY-MM-DD và là ngày hợp lệ trong lịch
//   3. steps trong khoảng [0, 100000]
//   4. durationSec trong khoảng [10, 21600] (10 giây đến 6 giờ)
//   5. avgSpeedKmh trong khoảng [0, 25] km/h
//   6. calories trong khoảng [0, 3000] kcal
//   7. |distanceKm - steps * strideM / 1000| <= 0.05
// ================================================================

const REQUIRED_RUN_FIELDS = [
    'date',
    'steps',
    'strideM',
    'distanceKm',
    'durationSec',
    'avgSpeedKmh',
    'calories',
];

/**
 * Kiểm tra chuỗi ngày có đúng định dạng YYYY-MM-DD và có thật trong lịch.
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDateYYYYMMDD(dateStr) {
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return false;
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() + 1 === month &&
        parsed.getUTCDate() === day
    );
}

/**
 * Kiểm tra hợp lệ dữ liệu buổi chạy bộ cho POST/PATCH/PUT /runs.
 * @param {object} body Body từ client gửi lên
 * @param {{ isPatch?: boolean, existingRow?: object | null }} [options]
 * @returns {{ valid: boolean, message: string | null }}
 */
function validateRunPayload(body, options = {}) {
    const { isPatch = false, existingRow = null } = options;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { valid: false, message: 'Dữ liệu gửi lên không hợp lệ' };
    }

    // Nếu là PATCH thì kiểm tra không trường bắt buộc nào bị cố tình xóa thành null/rỗng
    if (isPatch && existingRow) {
        for (const field of REQUIRED_RUN_FIELDS) {
            if (
                Object.prototype.hasOwnProperty.call(body, field) &&
                (body[field] === undefined || body[field] === null || body[field] === '')
            ) {
                return {
                    valid: false,
                    message: `Thiếu trường bắt buộc: ${field}`,
                };
            }
        }
    }

    const data = isPatch && existingRow ? { ...existingRow, ...body } : body;

    // 1. Kiểm tra các trường bắt buộc
    for (const field of REQUIRED_RUN_FIELDS) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
            return {
                valid: false,
                message: `Thiếu trường bắt buộc: ${field}`,
            };
        }
    }

    // 2. Kiểm tra định dạng ngày YYYY-MM-DD
    if (!isValidDateYYYYMMDD(data.date)) {
        return {
            valid: false,
            message: 'Ngày chạy (date) sai định dạng YYYY-MM-DD hoặc không tồn tại',
        };
    }

    // 3. Kiểm tra steps trong khoảng 0 - 100000
    if (
        typeof data.steps !== 'number' ||
        !Number.isFinite(data.steps) ||
        data.steps < 0 ||
        data.steps > 100000
    ) {
        return {
            valid: false,
            message: 'Số bước (steps) phải nằm trong khoảng từ 0 đến 100000',
        };
    }

    // 4. Kiểm tra durationSec trong khoảng 10 - 21600
    if (
        typeof data.durationSec !== 'number' ||
        !Number.isFinite(data.durationSec) ||
        data.durationSec < 10 ||
        data.durationSec > 21600
    ) {
        return {
            valid: false,
            message: 'Thời gian chạy (durationSec) phải nằm trong khoảng từ 10 đến 21600 giây',
        };
    }

    // 5. Kiểm tra avgSpeedKmh <= 25 (và >= 0)
    if (
        typeof data.avgSpeedKmh !== 'number' ||
        !Number.isFinite(data.avgSpeedKmh) ||
        data.avgSpeedKmh < 0 ||
        data.avgSpeedKmh > 25
    ) {
        return {
            valid: false,
            message: 'Vận tốc trung bình (avgSpeedKmh) không hợp lệ hoặc vượt quá 25 km/h',
        };
    }

    // 6. Kiểm tra calories <= 3000 (và >= 0)
    if (
        typeof data.calories !== 'number' ||
        !Number.isFinite(data.calories) ||
        data.calories < 0 ||
        data.calories > 3000
    ) {
        return {
            valid: false,
            message: 'Lượng calo tiêu hao (calories) không hợp lệ hoặc vượt quá 3000 kcal',
        };
    }

    // 7. Kiểm tra sải chân và độ lệch quãng đường |distanceKm - steps * strideM / 1000| <= 0.05
    if (
        typeof data.strideM !== 'number' ||
        !Number.isFinite(data.strideM) ||
        data.strideM <= 0
    ) {
        return {
            valid: false,
            message: 'Sải chân (strideM) phải là số dương hợp lệ',
        };
    }

    if (
        typeof data.distanceKm !== 'number' ||
        !Number.isFinite(data.distanceKm) ||
        data.distanceKm < 0
    ) {
        return {
            valid: false,
            message: 'Quãng đường (distanceKm) phải là số không âm hợp lệ',
        };
    }

    const expectedDistanceKm = (data.steps * data.strideM) / 1000;
    const distanceDiff = Math.abs(data.distanceKm - expectedDistanceKm);
    if (distanceDiff > 0.05 + 1e-9) {
        return {
            valid: false,
            message: 'Quãng đường (distanceKm) lệch quá 0.05 km so với công thức steps × strideM / 1000',
        };
    }

    return { valid: true, message: null };
}

module.exports = {
    REQUIRED_RUN_FIELDS,
    isValidDateYYYYMMDD,
    validateRunPayload,
};
