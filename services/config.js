// ============================================================================
// services/config.js
// Cấu hình tự động địa chỉ máy chủ (BASE_URL) theo môi trường chạy:
// 1. Ưu tiên biến môi trường EXPO_PUBLIC_API_URL (dùng cho bản build / cấu hình riêng)
// 2. Nếu đang chạy trên thiết bị thật qua Expo Go: trích xuất IP LAN từ hostUri
// 3. Nếu chạy trên máy ảo Android (Android Emulator): dùng 10.0.2.2
// 4. Nếu chạy trên iOS Simulator hoặc Web: dùng localhost
// KHÔNG hard-code địa chỉ IP cố định.
// ============================================================================

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const DEFAULT_SERVER_PORT = 3000;
export const API_TIMEOUT_MS = 10000; // Timeout 10 giây cho mọi request mạng

/**
 * Trích xuất hostname/IP từ hostUri của Expo (ví dụ "192.168.1.15:8081" -> "192.168.1.15").
 *
 * @returns {string | null}
 */
function extractHostFromExpo() {
  try {
    const rawHostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri ||
      Constants?.platform?.hostUri ||
      '';

    if (typeof rawHostUri !== 'string' || rawHostUri.trim() === '') {
      return null;
    }

    const sanitized = rawHostUri.replace(/^[a-zA-Z]+:\/\//, '');
    const hostPart = sanitized.split(':')[0]?.split('/')[0]?.trim();
    if (!hostPart || hostPart === 'localhost' || hostPart === '127.0.0.1') {
      return null;
    }
    return hostPart;
  } catch {
    return null;
  }
}

/**
 * Tự động xác định BASE_URL phù hợp với thiết bị đang chạy.
 *
 * @returns {string}
 */
export function resolveBaseUrl() {
  // 1. Ưu tiên biến môi trường EXPO_PUBLIC_API_URL nếu được khai báo
  const envUrl =
    typeof process !== 'undefined' &&
    process.env &&
    typeof process.env.EXPO_PUBLIC_API_URL === 'string'
      ? process.env.EXPO_PUBLIC_API_URL.trim()
      : '';

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Máy thật kết nối qua mạng nội bộ với Expo Go (hostUri chứa IP LAN của máy tính)
  const lanHost = extractHostFromExpo();
  if (lanHost) {
    return `http://${lanHost}:${DEFAULT_SERVER_PORT}`;
  }

  // 3. Android Emulator ánh xạ loopback của máy chủ qua 10.0.2.2
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_SERVER_PORT}`;
  }

  // 4. iOS Simulator / Web dùng localhost
  return `http://localhost:${DEFAULT_SERVER_PORT}`;
}

export const BASE_URL = resolveBaseUrl();
