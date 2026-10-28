// ============================================================================
// utils/dateLocal.js
// Hàm tiện ích xử lý ngày giờ theo múi giờ địa phương của thiết bị (Local Time).
// Khắc phục lỗi lệch ngày khi chạy bộ lúc rạng sáng (ví dụ 00:30 giờ Việt Nam
// tức 17:30 UTC ngày hôm trước nếu dùng toISOString()).
// ============================================================================

const pad2 = (num) => String(num).padStart(2, '0');

/**
 * Trả về chuỗi ngày YYYY-MM-DD theo múi giờ địa phương của thiết bị,
 * hoặc theo độ lệch múi giờ cụ thể (phút so với UTC, ví dụ +420 cho UTC+7)
 * phục vụ kiểm thử đơn vị độc lập môi trường.
 *
 * @param {Date|number|string} [input=new Date()] Thời điểm đầu vào
 * @param {number} [customUtcOffsetMinutes] Độ lệch phút so với UTC (tùy chọn, dùng khi test)
 * @returns {string} Chuỗi ngày định dạng YYYY-MM-DD
 */
export function localDateString(input = new Date(), customUtcOffsetMinutes) {
  const dateObj = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(dateObj.getTime())) {
    throw new Error('Thời gian đầu vào không hợp lệ');
  }

  // Nếu truyền customUtcOffsetMinutes (ví dụ 420 cho UTC+7), tính theo offset đó
  if (typeof customUtcOffsetMinutes === 'number' && Number.isFinite(customUtcOffsetMinutes)) {
    const shiftedMs = dateObj.getTime() + customUtcOffsetMinutes * 60 * 1000;
    const shiftedDate = new Date(shiftedMs);
    const year = shiftedDate.getUTCFullYear();
    const month = pad2(shiftedDate.getUTCMonth() + 1);
    const day = pad2(shiftedDate.getUTCDate());
    return `${year}-${month}-${day}`;
  }

  // Mặc định: lấy ngày theo giờ địa phương của máy
  const year = dateObj.getFullYear();
  const month = pad2(dateObj.getMonth() + 1);
  const day = pad2(dateObj.getDate());
  return `${year}-${month}-${day}`;
}

/**
 * Kiểm tra chuỗi ngày có đúng định dạng YYYY-MM-DD và là ngày có thật trong lịch.
 *
 * @param {string} dateStr Chuỗi ngày cần kiểm tra
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return (
    parsed.getUTCFullYear() === y &&
    parsed.getUTCMonth() + 1 === m &&
    parsed.getUTCDate() === d
  );
}
