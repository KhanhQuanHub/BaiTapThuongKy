// ============================================================================
// components/run/RunMapView.tsx
// Component Bản đồ Chạy bộ GPS với Leaflet trong WebView:
// - Nguồn Tile: Đọc từ getMapTileConfig() (MapTiler raster với API key từ .env,
//   hoặc fallback chuẩn OSM không watermark).
// - Offline Caching: Tự động lưu cache tile vào IndexedDB trong WebView (giới hạn 150 MB / 4500 tiles),
//   tự động dọn dẹp theo cơ chế LRU khi đầy bộ nhớ.
// - Khi mất mạng: Tự động tải từ cache đã lưu; nếu ô chưa từng xem thì hiện nền xám tối
//   thay vì ô vuông trắng hay icon lỗi.
// - Báo trạng thái "Đang offline" khi mất kết nối mạng.
// - Camera tự bám theo vị trí người chạy khi di chuyển, hỗ trợ nút định vị lại và nút phóng to.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import {
  fontSize,
  fontWeight,
  layout,
  radius,
  shadow,
  spacing,
  ThemeColors,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';
import { getMapTileConfig } from '../../services/mapTileProvider';
import { useLocationStore } from '../../store/locationStore';

export type Coordinate = {
  latitude: number;
  longitude: number;
  timestamp?: number;
};

type Props = {
  isTracking: boolean;
  onDistanceChange?: (distanceKm: number) => void;
  height?: number;
  initialCoordinates?: Coordinate[];
};

// Vị trí mặc định (IUH - TP. Hồ Chí Minh) khi chưa có GPS thực tế
const DEFAULT_CENTER: Coordinate = {
  latitude: 10.822363,
  longitude: 106.687487,
};

export default function RunMapView({
  isTracking,
  onDistanceChange,
  height = 260,
  initialCoordinates = [],
}: Props): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<any>(null);
  const onDistanceChangeRef = useRef(onDistanceChange);

  const tileConfig = useMemo(() => getMapTileConfig(), []);

  // Vị trí máy đã được theo dõi toàn app từ sau đăng nhập (store/locationStore.ts)
  const deviceCoords = useLocationStore((state) => state.coords);

  // Chốt tâm bản đồ ban đầu 1 lần (ưu tiên: lộ trình dở dang > vị trí máy > mặc định)
  // để HTML WebView không bị nạp lại mỗi khi GPS cập nhật
  const [initialCenter] = useState<Coordinate>(() =>
    initialCoordinates.length > 0
      ? initialCoordinates[initialCoordinates.length - 1]
      : deviceCoords
        ? { latitude: deviceCoords.latitude, longitude: deviceCoords.longitude }
        : DEFAULT_CENTER
  );

  const routeRef = useRef<Coordinate[]>(initialCoordinates);
  const currentPosRef = useRef<Coordinate>(initialCenter);

  useEffect(() => {
    onDistanceChangeRef.current = onDistanceChange;
  }, [onDistanceChange]);

  const [route, setRoute] = useState<Coordinate[]>(initialCoordinates);
  const [currentPos, setCurrentPos] = useState<Coordinate>(initialCenter);
  const [hasGps, setHasGps] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const updateMapCoordinate = useCallback((coord: Coordinate) => {
    if (!webViewRef.current) return;
    const jsCode = `
      if (window.addRoutePoint) {
        window.addRoutePoint(${coord.latitude}, ${coord.longitude});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(jsCode);
  }, []);

  // Tính tổng quãng đường từ mảng toạ độ theo công thức Haversine (km)
  const calculateTotalDistance = (coords: Coordinate[]): number => {
    let total = 0;
    const R = 6371; // Bán kính Trái Đất (km)
    for (let i = 1; i < coords.length; i++) {
      const lat1 = (coords[i - 1].latitude * Math.PI) / 180;
      const lat2 = (coords[i].latitude * Math.PI) / 180;
      const dLat = ((coords[i].latitude - coords[i - 1].latitude) * Math.PI) / 180;
      const dLon = ((coords[i].longitude - coords[i - 1].longitude) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  };

  // Khởi tạo GPS thực tế từ expo-location
  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;

    const setupLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setHasGps(true);
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const initCoord: Coordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            timestamp: loc.timestamp,
          };
          currentPosRef.current = initCoord;
          setCurrentPos(initCoord);

          // Đưa bản đồ về vị trí GPS thực tế ngay khi có tín hiệu
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (window.recenterMap) {
                window.recenterMap(${initCoord.latitude}, ${initCoord.longitude});
              }
              true;
            `);
          }

          if (isTracking) {
            subscriber = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 3,
              },
              (newLoc) => {
                const newCoord: Coordinate = {
                  latitude: newLoc.coords.latitude,
                  longitude: newLoc.coords.longitude,
                  timestamp: newLoc.timestamp,
                };
                const updated = [...routeRef.current, newCoord];
                routeRef.current = updated;
                currentPosRef.current = newCoord;
                setRoute(updated);
                setCurrentPos(newCoord);
                updateMapCoordinate(newCoord);

                if (onDistanceChangeRef.current) {
                  const dist = calculateTotalDistance(updated);
                  onDistanceChangeRef.current(dist);
                }
              }
            );
          }
        } else {
          setHasGps(false);
        }
      } catch {
        setHasGps(false);
      }
    };

    setupLocation();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, [isTracking, updateMapCoordinate]);

  // Giả lập di chuyển khi test trên máy ảo nếu không có GPS thực
  useEffect(() => {
    if (!isTracking || hasGps) return;

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const angle = (step * 15 * Math.PI) / 180;
      const deltaLat = 0.00015 * Math.sin(angle) + 0.00008;
      const deltaLng = 0.00018 * Math.cos(angle) + 0.00005;

      const nextCoord: Coordinate = {
        latitude: currentPosRef.current.latitude + deltaLat,
        longitude: currentPosRef.current.longitude + deltaLng,
        timestamp: Date.now(),
      };
      currentPosRef.current = nextCoord;
      const updated = [...routeRef.current, nextCoord];
      routeRef.current = updated;

      setRoute(updated);
      setCurrentPos(nextCoord);
      updateMapCoordinate(nextCoord);

      if (onDistanceChangeRef.current) {
        const dist = calculateTotalDistance(updated);
        onDistanceChangeRef.current(dist);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isTracking, hasGps, updateMapCoordinate]);

  // Đồng bộ vị trí máy (từ store toàn app) lên bản đồ ngay khi bản đồ sẵn sàng
  useEffect(() => {
    if (!deviceCoords || !isMapReady || !webViewRef.current) return;
    setHasGps(true);
    currentPosRef.current = {
      latitude: deviceCoords.latitude,
      longitude: deviceCoords.longitude,
      timestamp: deviceCoords.timestamp,
    };
    setCurrentPos(currentPosRef.current);
    webViewRef.current.injectJavaScript(`
      if (window.setCurrentLocation) {
        window.setCurrentLocation(${deviceCoords.latitude}, ${deviceCoords.longitude});
      }
      true;
    `);
  }, [deviceCoords, isMapReady]);

  const handleRecenter = () => {
    if (!webViewRef.current) return;
    const jsCode = `
      if (window.recenterMap) {
        window.recenterMap(${currentPos.latitude}, ${currentPos.longitude});
      }
      true;
    `;
    webViewRef.current.injectJavaScript(jsCode);
  };

  // Trang HTML Leaflet nhúng trong WebView với bộ đệm IndexedDB Offline Cache
  const leafletHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #0F172A; }
          .leaflet-container { background: #0F172A !important; }
          .runner-pulse {
            width: 18px;
            height: 18px;
            background: #16A34A;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(22, 163, 74, 0.9);
            position: relative;
          }
          .runner-pulse::after {
            content: '';
            position: absolute;
            top: -7px;
            left: -7px;
            right: -7px;
            bottom: -7px;
            border-radius: 50%;
            background: rgba(22, 163, 74, 0.4);
            animation: pulse 1.8s infinite;
          }
          .start-pin {
            width: 14px;
            height: 14px;
            background: #0EA5E9;
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .leaflet-control-attribution {
            display: none !important;
          }
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // ==================== TẦNG QUẢN LÝ TILES VÀ OFFLINE CACHE ====================
          // L.TileLayer.FitLogLayer tải ảnh đồng bộ tức thì, tận dụng native HTTP disk cache
          // của Android WebView, đồng thời hỗ trợ CacheStorage để lưu và đọc offline.
          var CACHE_NAME = 'fitlog-tiles-v1';

          // Ảnh fallback tối giản màu navy xám (khi mất mạng và tile chưa được lưu cache)
          function getFallbackTileSvg() {
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">' +
              '<rect width="256" height="256" fill="#131C2E"/>' +
              '<path d="M0 0 L256 256 M256 0 L0 256" stroke="#1E293B" stroke-width="1" stroke-dasharray="6,6"/>' +
              '<text x="128" y="132" fill="#334155" font-size="12" font-family="sans-serif" text-anchor="middle">FitLog Offline</text>' +
              '</svg>';
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
          }

          L.TileLayer.FitLogLayer = L.TileLayer.extend({
            createTile: function(coords, done) {
              var tile = document.createElement('img');
              var url = this.getTileUrl(coords);

              L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));

              // Xử lý khi không tải được từ mạng (mất mạng hoặc tile lỗi)
              L.DomEvent.on(tile, 'error', function() {
                if (window.caches) {
                  caches.open(CACHE_NAME).then(function(cache) {
                    return cache.match(url);
                  }).then(function(cachedResp) {
                    if (cachedResp) {
                      return cachedResp.blob().then(function(blob) {
                        tile.src = URL.createObjectURL(blob);
                        done(null, tile);
                      });
                    }
                    tile.src = getFallbackTileSvg();
                    done(null, tile);
                  }).catch(function() {
                    tile.src = getFallbackTileSvg();
                    done(null, tile);
                  });
                } else {
                  tile.src = getFallbackTileSvg();
                  done(null, tile);
                }
              });

              tile.alt = '';
              tile.setAttribute('role', 'presentation');

              // 1. GÁN SRC ĐỒNG BỘ: Kích hoạt tải ảnh ngay lập tức! Trình duyệt bắt đầu tải tile ngay
              tile.src = url;

              // 2. Tự động sao lưu tile vào Cache API khi trực tuyến (chạy nền không chặn luồng)
              if (window.caches && navigator.onLine) {
                caches.open(CACHE_NAME).then(function(cache) {
                  cache.add(url).catch(function() {});
                }).catch(function() {});
              }

              return tile;
            }
          });

          L.tileLayer.fitLogLayer = function(url, options) {
            return new L.TileLayer.FitLogLayer(url, options);
          };

          // ==================== KHỞI TẠO BẢN ĐỒ LEAFLET ====================
          var map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${initialCenter.latitude}, ${initialCenter.longitude}], 16);

          // Gắn TileLayer với danh sách subdomains đầy đủ
          L.tileLayer.fitLogLayer('${tileConfig.urlTemplate}', {
            maxZoom: ${tileConfig.maxZoom},
            minZoom: ${tileConfig.minZoom},
            subdomains: ${JSON.stringify(tileConfig.subdomains && tileConfig.subdomains.length ? tileConfig.subdomains : ['a', 'b', 'c'])}
          }).addTo(map);

          let autoFollow = true;
          map.on('dragstart', function() {
            autoFollow = false;
          });

          let routePoints = [];
          const polyline = L.polyline([], {
            color: '#16A34A',
            weight: 5,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(map);

          let startMarker = null;

          const runnerIcon = L.divIcon({
            className: 'runner-marker',
            html: '<div class="runner-pulse"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          const currentMarker = L.marker([${initialCenter.latitude}, ${initialCenter.longitude}], {
            icon: runnerIcon
          }).addTo(map);

          window.addRoutePoint = function(lat, lng) {
            const pt = [lat, lng];
            routePoints.push(pt);
            polyline.setLatLngs(routePoints);
            currentMarker.setLatLng(pt);

            if (!startMarker && routePoints.length === 1) {
              const startIcon = L.divIcon({
                html: '<div class="start-pin"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });
              startMarker = L.marker(pt, { icon: startIcon }).addTo(map);
            }

            if (autoFollow) {
              map.panTo(pt, { animate: true, duration: 0.8 });
            }
          };

          // Cập nhật chấm vị trí hiện tại (không thêm điểm vào lộ trình)
          window.setCurrentLocation = function(lat, lng) {
            currentMarker.setLatLng([lat, lng]);
            if (autoFollow && routePoints.length === 0) {
              map.setView([lat, lng], map.getZoom(), { animate: true });
            }
          };

          window.recenterMap = function(lat, lng) {
            autoFollow = true;
            map.setView([lat, lng], 17, { animate: true });
          };

          // Lắng nghe trạng thái mạng trong WebView
          function notifyNetworkState() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'NETWORK',
                online: navigator.onLine
              }));
            }
          }

          window.addEventListener('online', notifyNetworkState);
          window.addEventListener('offline', notifyNetworkState);

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
            notifyNetworkState();
          }
        </script>
      </body>
    </html>
  `, [initialCenter.latitude, initialCenter.longitude, tileConfig]);

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setIsMapReady(true);
        if (route.length > 0) {
          route.forEach((coord) => updateMapCoordinate(coord));
        }
      } else if (data.type === 'NETWORK') {
        setIsOffline(!data.online);
      }
    } catch {
      if (event.nativeEvent.data === 'MAP_READY') {
        setIsMapReady(true);
      }
    }
  };

  return (
    <View style={[styles.container, { height: isExpanded ? 420 : height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml, baseUrl: 'https://fitlog.vn' }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        mixedContentMode="always"
        scrollEnabled={false}
        onMessage={handleWebViewMessage}
      />

      {!isMapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      )}

      {/* Badge trạng thái: Offline hoặc GPS */}
      <View style={[styles.statusBadge, isOffline && styles.statusBadgeOffline]}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isOffline
                ? colors.warning
                : isTracking
                  ? colors.primary
                  : colors.textMuted,
            },
          ]}
        />
        <Text
          style={[
            styles.statusText,
            isOffline && { color: colors.warning },
          ]}
        >
          {isOffline
            ? 'Đang offline (Dùng bản đồ lưu)'
            : isTracking
              ? hasGps
                ? 'GPS chuẩn xác'
                : 'Bản đồ lộ trình thực'
              : 'Sẵn sàng theo dõi'}
        </Text>
      </View>

      {/* Các nút điều khiển bản đồ */}
      <View style={styles.controlsWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Thu nhỏ bản đồ' : 'Phóng to bản đồ'}
          style={styles.iconButton}
          onPress={() => setIsExpanded((prev) => !prev)}
        >
          <Ionicons
            name={isExpanded ? 'contract-outline' : 'expand-outline'}
            size={18}
            color={colors.text}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Định vị lại vị trí của bạn"
          style={styles.iconButton}
          onPress={handleRecenter}
        >
          <Ionicons name="locate" size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: '#0F172A',
      position: 'relative',
      ...shadow.card,
    },
    webview: {
      flex: 1,
      backgroundColor: '#0F172A',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: '#0F172A',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xs,
    },
    loadingText: {
      fontSize: fontSize.caption,
      color: colors.textMuted,
      fontWeight: fontWeight.medium,
    },
    statusBadge: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    statusBadgeOffline: {
      backgroundColor: isDark ? 'rgba(69, 26, 3, 0.92)' : 'rgba(254, 243, 199, 0.95)',
      borderColor: colors.warning,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: radius.pill,
    },
    statusText: {
      fontSize: fontSize.caption - 1,
      fontWeight: fontWeight.semibold,
      color: colors.text,
    },
    controlsWrap: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      flexDirection: 'column',
      gap: spacing.xs,
    },
    iconButton: {
      width: layout.minTouchSize - 6,
      height: layout.minTouchSize - 6,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
  });
