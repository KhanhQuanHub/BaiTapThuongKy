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
  fontSize, fontWeight, layout, radius, shadow, spacing, ThemeColors,
} from '../../constants/theme';
import { useTheme } from '../../store/themeStore';

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

  const initialCenter = initialCoordinates.length > 0
    ? initialCoordinates[initialCoordinates.length - 1]
    : DEFAULT_CENTER;

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

          // Nếu đang chạy thì cập nhật vị trí liên tục
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

  // Giả lập di chuyển khi đang chạy nếu thiết bị không có GPS thực (ví dụ giả lập emulator)
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

  // Trang HTML Leaflet nhúng trong WebView với theme Strava / Google Maps hiện đại
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #map { width: 100%; height: 100%; background: #F8FAFC; }
          .runner-pulse {
            width: 18px;
            height: 18px;
            background: #16A34A;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(22, 163, 74, 0.8);
            position: relative;
          }
          .runner-pulse::after {
            content: '';
            position: absolute;
            top: -6px;
            left: -6px;
            right: -6px;
            bottom: -6px;
            border-radius: 50%;
            background: rgba(22, 163, 74, 0.35);
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
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([${currentPos.latitude}, ${currentPos.longitude}], 16);

          // Tile CartoDB Positron hiện đại, rõ ràng như bản đồ chạy bộ chuyên nghiệp
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(map);

          let routePoints = [];
          const polyline = L.polyline([], {
            color: '#16A34A',
            weight: 5,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
          }).addTo(map);

          // Marker điểm xuất phát
          let startMarker = null;

          // Marker người chạy hiện tại
          const runnerIcon = L.divIcon({
            className: 'runner-marker',
            html: '<div class="runner-pulse"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          const currentMarker = L.marker([${currentPos.latitude}, ${currentPos.longitude}], {
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

            map.panTo(pt, { animate: true, duration: 0.8 });
          };

          window.recenterMap = function(lat, lng) {
            map.setView([lat, lng], 17, { animate: true });
          };

          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('MAP_READY');
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height: isExpanded ? 380 : height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onMessage={(event: WebViewMessageEvent): void => {
          if (event.nativeEvent.data === 'MAP_READY') {
            setIsMapReady(true);
            if (route.length > 0) {
              route.forEach((coord) => updateMapCoordinate(coord));
            }
          }
        }}
      />

      {!isMapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      )}

      {/* Badge trạng thái định vị */}
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: isTracking ? colors.primary : colors.textMuted }]} />
        <Text style={styles.statusText}>
          {isTracking ? (hasGps ? 'GPS chuẩn xác' : 'Bản đồ lộ trình thực') : 'Sẵn sàng theo dõi'}
        </Text>
      </View>

      {/* Các nút điều khiển bản đồ */}
      <View style={styles.controlsWrap}>
        <Pressable
          accessibilityRole="button"
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
      backgroundColor: colors.surface,
      position: 'relative',
      ...shadow.card,
    },
    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.surface,
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
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      ...shadow.card,
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
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
  });
