// ============================================================================
// services/mapTileProvider.ts
// Tầng cấu hình và quản lý nguồn bản đồ (Tile Provider):
// - Hỗ trợ đọc API key từ cả biến môi trường .env (EXPO_PUBLIC_MAP_API_KEY)
//   lẫn file cấu hình app.json (expo.extra.mapApiKey).
// - Nguồn ưu tiên: MapTiler Streets v2 raster (khi có key).
// - Nguồn dự phòng: OpenStreetMap Humanitarian (HOT) ổn định, không yêu cầu key,
//   không watermark, không bị 403 trên mobile WebView.
// ============================================================================

import Constants from 'expo-constants';

export type TileProviderType = 'maptiler' | 'stadia' | 'osm_fallback';

export interface MapTileConfig {
  provider: TileProviderType;
  apiKey: string;
  urlTemplate: string;
  attribution: string;
  subdomains: string[];
  minZoom: number;
  maxZoom: number;
  tileSize: number;
  cacheDbName: string;
  cacheStoreName: string;
  maxCacheBytes: number;
  maxTileCount: number;
}

/**
 * Lấy cấu hình Tile Layer hiện tại từ .env hoặc app.json.
 */
export function getMapTileConfig(): MapTileConfig {
  const envKey =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_MAP_API_KEY
      ? process.env.EXPO_PUBLIC_MAP_API_KEY.trim()
      : '';

  const extraKey =
    (Constants?.expoConfig?.extra?.mapApiKey as string) ||
    (Constants?.manifest2?.extra?.expoClient?.extra?.mapApiKey as string) ||
    '';

  const rawKey = envKey || extraKey;
  const apiKey =
    rawKey && rawKey !== 'YOUR_MAPTILER_API_KEY' && rawKey !== 'KHÓA_CỦA_BẠN'
      ? rawKey.trim()
      : '';

  // 1. Nếu có API key MapTiler hợp lệ
  if (apiKey) {
    return {
      provider: 'maptiler',
      apiKey,
      urlTemplate: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${apiKey}`,
      attribution: '',
      subdomains: [],
      minZoom: 1,
      maxZoom: 19,
      tileSize: 256,
      cacheDbName: 'FitLogMapCacheDB',
      cacheStoreName: 'maptiler_tiles_v1',
      maxCacheBytes: 150 * 1024 * 1024,
      maxTileCount: 4500,
    };
  }

  // 2. Dự phòng sạch: OSM Humanitarian (HOT) không yêu cầu API key, không watermark, hoạt động 100%
  return {
    provider: 'osm_fallback',
    apiKey: '',
    urlTemplate: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '',
    subdomains: ['a', 'b', 'c'],
    minZoom: 1,
    maxZoom: 19,
    tileSize: 256,
    cacheDbName: 'FitLogMapCacheDB',
    cacheStoreName: 'osm_tiles_v1',
    maxCacheBytes: 150 * 1024 * 1024,
    maxTileCount: 4500,
  };
}
