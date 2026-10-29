// ============================================================================
// store/locationStore.ts
// Theo dõi vị trí thiết bị TOÀN ỨNG DỤNG (độc lập với màn hình Chạy bộ):
// - Được kích hoạt ngay sau khi đăng nhập thành công (xem RootNavigator).
// - Xin quyền vị trí foreground, lấy ngay vị trí cuối cùng đã biết (tức thì),
//   sau đó theo dõi liên tục ở chế độ tiết kiệm pin.
// - Màn hình bản đồ chỉ việc đọc `coords` nên luôn có sẵn toạ độ khi mở.
// ============================================================================

import { create } from 'zustand';
import * as Location from 'expo-location';

export type DeviceCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

export type LocationPermission = 'unknown' | 'granted' | 'denied';

type LocationState = {
  coords: DeviceCoords | null;
  permission: LocationPermission;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
};

let subscription: Location.LocationSubscription | null = null;
let starting = false;

function toCoords(loc: Location.LocationObject): DeviceCoords {
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    accuracy: loc.coords.accuracy ?? null,
    timestamp: loc.timestamp,
  };
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  permission: 'unknown',

  startWatching: async () => {
    // Tránh khởi tạo trùng lặp
    if (subscription || starting) return;
    starting = true;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ permission: 'denied' });
        return;
      }
      set({ permission: 'granted' });

      // 1. Vị trí cache của hệ điều hành: có gần như tức thì
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last) set({ coords: toCoords(last) });
      } catch {
        // bỏ qua, chờ vị trí thực bên dưới
      }

      // 2. Lấy vị trí hiện tại chính xác (không chặn việc đăng ký theo dõi)
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((loc) => set({ coords: toCoords(loc) }))
        .catch(() => {});

      // 3. Theo dõi liên tục (tiết kiệm pin: 5 giây hoặc 10 mét)
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => set({ coords: toCoords(loc) })
      );
    } catch {
      set({ permission: 'denied' });
    } finally {
      starting = false;
    }
  },

  stopWatching: () => {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
    set({ coords: null });
  },
}));
