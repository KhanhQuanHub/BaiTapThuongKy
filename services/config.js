// ============================================================================
// services/config.js
// Cấu hình TỰ ĐỘNG & LINH ĐỘNG địa chỉ máy chủ (BASE_URL):
//
// 1. Tự động lấy IP máy tính từ Expo Metro Bundler (hostUri / linkingUri)
//    -> Dù đổi sang bất kỳ mạng Wi-Fi nào (ở nhà, ở trường, phát 4G Hotspot),
//       chỉ cần máy tính và điện thoại cùng mạng, app tự nhận diện IP mới ngay!
// 2. Bỏ qua các tên miền Tunnel giả lập (ngrok, exp.direct, cloudflare) nếu không có cổng 3000
// 3. Nếu chạy trên Android Emulator: tự động dùng 10.0.2.2
// 4. Nếu chạy trên iOS Simulator / Web: tự động dùng localhost
// 5. Hỗ trợ lưu cấu hình tùy chỉnh qua AsyncStorage (nếu cần đổi IP thủ công)
// ============================================================================

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SERVER_PORT = 3000;
export const API_TIMEOUT_MS = 10000; // Timeout 10 giây cho mọi request mạng
export const STORAGE_KEY_CUSTOM_SERVER_URL = '@fitlog_custom_server_url';

/**
 * Trích xuất IP LAN của máy tính từ nhiều nguồn khả dĩ của Expo.
 * Tự động loại bỏ các domain tunnel trung gian (exp.direct, trycloudflare, ngrok)
 * vì các tunnel này chỉ chuyển tiếp cổng 8081 của Metro, không chuyển tiếp cổng 3000 của API.
 *
 * @returns {string | null}
 */
export function extractHostFromExpo() {
  try {
    const candidateUris = [
      Constants?.expoConfig?.hostUri,
      Constants?.manifest2?.extra?.expoClient?.hostUri,
      Constants?.platform?.hostUri,
      Constants?.manifest?.debuggerHost,
      Constants?.linkingUri,
      Constants?.experienceUrl,
      typeof process !== 'undefined' ? process.env?.EXPO_DEV_SERVER_ORIGIN : '',
    ];

    for (const raw of candidateUris) {
      if (typeof raw !== 'string' || raw.trim() === '') {
        continue;
      }

      // Chuẩn hóa, bỏ giao thức exp://, http://, https://
      const sanitized = raw.replace(/^[a-zA-Z]+:\/\//, '').trim();
      const hostPart = sanitized.split(':')[0]?.split('/')[0]?.trim();

      if (!hostPart) {
        continue;
      }

      // Bỏ qua localhost/127.0.0.1 (sẽ xử lý theo Platform riêng)
      if (hostPart === 'localhost' || hostPart === '127.0.0.1') {
        continue;
      }

      // Bỏ qua các tunnel trung gian chỉ mở cho Metro (tránh lỗi 502/504)
      if (
        hostPart.endsWith('.exp.direct') ||
        hostPart.includes('trycloudflare.com') ||
        hostPart.includes('ngrok-free.app') ||
        hostPart.includes('ngrok.io')
      ) {
        continue;
      }

      // Tìm thấy IP LAN hợp lệ (ví dụ: 192.168.x.x, 10.x.x.x, 172.x.x.x)
      return hostPart;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Tự động tính toán BASE_URL phù hợp nhất tại thời điểm gọi.
 *
 * @returns {string}
 */
export function resolveBaseUrl() {
  // 1. Kiểm tra biến môi trường EXPO_PUBLIC_API_URL (nếu được đặt rõ ràng và không phải tunnel chết)
  const envUrl =
    typeof process !== 'undefined' &&
    process.env &&
    typeof process.env.EXPO_PUBLIC_API_URL === 'string'
      ? process.env.EXPO_PUBLIC_API_URL.trim()
      : '';

  if (envUrl && !envUrl.includes('trycloudflare.com')) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Thiết bị thật kết nối qua mạng nội bộ: Lấy IP LAN của máy tính đang chạy Expo
  const lanHost = extractHostFromExpo();
  if (lanHost) {
    return `http://${lanHost}:${DEFAULT_SERVER_PORT}`;
  }

  // 3. Máy ảo Android (Android Emulator) dùng 10.0.2.2 để gọi về máy host
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_SERVER_PORT}`;
  }

  // 4. iOS Simulator hoặc Web chạy trên cùng máy tính dùng localhost
  return `http://localhost:${DEFAULT_SERVER_PORT}`;
}

/**
 * Lấy BASE_URL hiện tại (Hỗ trợ đọc cấu hình override từ AsyncStorage nếu có).
 *
 * @returns {Promise<string>}
 */
export async function getBaseUrlAsync() {
  try {
    const customUrl = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_SERVER_URL);
    if (customUrl && typeof customUrl === 'string' && customUrl.trim() !== '') {
      return customUrl.trim().replace(/\/+$/, '');
    }
  } catch {
    // Bỏ qua lỗi đọc AsyncStorage, fallback về tự động
  }

  return resolveBaseUrl();
}

/**
 * Lấy BASE_URL đồng bộ (luôn gọi lại resolveBaseUrl để cập nhật nếu IP thay đổi).
 *
 * @returns {string}
 */
export function getBaseUrl() {
  return resolveBaseUrl();
}

/**
 * Cho phép người dùng lưu một URL / IP tùy chỉnh (ví dụ khi cần đổi IP thủ công).
 *
 * @param {string} url
 */
export async function setCustomServerUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    await AsyncStorage.removeItem(STORAGE_KEY_CUSTOM_SERVER_URL);
  } else {
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_SERVER_URL, url.trim().replace(/\/+$/, ''));
  }
}

/**
 * Xóa cấu hình tùy chỉnh, quay về chế độ tự động dò IP.
 */
export async function clearCustomServerUrl() {
  await AsyncStorage.removeItem(STORAGE_KEY_CUSTOM_SERVER_URL);
}

// Giữ lại BASE_URL xuất ra ban đầu cho các module cũ tương thích ngược
export const BASE_URL = resolveBaseUrl();
