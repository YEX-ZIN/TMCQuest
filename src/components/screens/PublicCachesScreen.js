import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import API from '../API/API';
import Icons from '../UI/Icons';
import { Button } from '../UI/Button';
import { loadEvidenceMap } from '../store/evidenceStore';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const AUTO_CAMERA_RADIUS_METERS = 100;
const AUTO_CAMERA_RESET_RADIUS_METERS = 130;

const toRadians = (degrees) => degrees * (Math.PI / 180);
const distanceInMeters = (fromLat, fromLng, toLat, toLng) => {
  const earthRadius = 6371000;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const getCacheID = (cache) => cache?.CacheID ?? cache?.CacheId ?? cache?.id;

const isPublicEvent = (event) => {
  const value = event?.EventIspublic;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return false;
};

const PublicCachesScreen = ({ navigation }) => {
  const isFocused = useIsFocused();
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [publicEventsByID, setPublicEventsByID] = useState({});
  const [publicCaches, setPublicCaches] = useState([]);
  const [selectedCache, setSelectedCache] = useState(null);
  const [evidenceByCache, setEvidenceByCache] = useState({});
  const mapRef = useRef(null);
  const hasCenteredOnOpenRef = useRef(false);
  const autoOpenedCameraByCacheRef = useRef({});

  const focusMapOnLocation = (coords, animated = true) => {
    if (!coords || !mapRef.current) return;

    const region = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    };

    if (mapRef.current.animateToRegion) {
      mapRef.current.animateToRegion(region, animated ? 500 : 0);
      return;
    }

    if (mapRef.current.animateCamera) {
      mapRef.current.animateCamera({ center: { latitude: coords.latitude, longitude: coords.longitude }, zoom: 14 }, { duration: animated ? 500 : 0 });
    }
  };

  const refreshEvidence = async () => {
    try {
      const evidenceMap = await loadEvidenceMap();
      setEvidenceByCache(evidenceMap);
    } catch (error) {
      // Ignore evidence read failures to avoid blocking map usage.
    }
  };

  const handleEvidenceCaptured = (payload) => {
    const cacheID = payload?.cacheID;
    const uri = payload?.uri;
    if (cacheID === null || cacheID === undefined || !uri) return;

    setEvidenceByCache((prev) => ({
      ...prev,
      [String(cacheID)]: {
        uri,
        capturedAt: payload?.capturedAt || new Date().toISOString(),
        isPublic: true,
      },
    }));
  };

  const requestLocation = async (shouldCenterMap = false) => {
    setLocationLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation(loc.coords);
    if (shouldCenterMap) focusMapOnLocation(loc.coords, true);
    setLocationLoading(false);
  };

  const loadPublicCaches = async () => {
    setLoading(true);

    const [eventsResponse, cachesResponse] = await Promise.all([
      API.get(API.geoQuest.events()),
      API.get(API.geoQuest.caches()),
    ]);

    if (!eventsResponse.isSuccess || !cachesResponse.isSuccess) {
      setLoading(false);
      Alert.alert('Load Failed', 'Unable to load public caches right now.');
      return;
    }

    const events = normaliseList(eventsResponse.result);
    const caches = normaliseList(cachesResponse.result);

    const publicEvents = events.filter(isPublicEvent);
    const publicEventIDs = new Set(publicEvents.map((event) => String(event.EventID)));

    const byID = publicEvents.reduce((acc, event) => {
      acc[String(event.EventID)] = event;
      return acc;
    }, {});

    const filteredCaches = caches
      .filter((cache) => {
        const eventID = String(cache.CacheEventID || cache.CacheEvent?.EventID || '');
        return publicEventIDs.has(eventID);
      })
      .filter((cache) => {
        const latitude = cache.CacheLatitude ?? cache.CacheLat;
        const longitude = cache.CacheLongitude ?? cache.CacheLng;
        return latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;
      });

    setPublicEventsByID(byID);
    setPublicCaches(filteredCaches);
    setLoading(false);
  };

  useEffect(() => {
    requestLocation();
    loadPublicCaches();
  }, []);

  useEffect(() => {
    if (!userLocation || hasCenteredOnOpenRef.current) return;
    focusMapOnLocation(userLocation, false);
    hasCenteredOnOpenRef.current = true;
  }, [userLocation]);

  useEffect(() => {
    if (isFocused) refreshEvidence();
  }, [isFocused]);

  useEffect(() => {
    let mounted = true;
    let watcher = null;

    const startWatcher = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1200,
          distanceInterval: 1,
        },
        (position) => {
          if (!mounted) return;
          setUserLocation(position.coords);
          setLocationLoading(false);
        },
      );
    };

    startWatcher();

    return () => {
      mounted = false;
      watcher?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!isFocused || !selectedCache || !userLocation) return;

    const cacheID = getCacheID(selectedCache);
    const cacheKey = String(cacheID ?? `${selectedCache.CacheLatitude ?? selectedCache.CacheLat}-${selectedCache.CacheLongitude ?? selectedCache.CacheLng}`);
    const latitude = selectedCache.CacheLatitude ?? selectedCache.CacheLat;
    const longitude = selectedCache.CacheLongitude ?? selectedCache.CacheLng;
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) return;

    const meters = distanceInMeters(userLocation.latitude, userLocation.longitude, latitude, longitude);
    const alreadyOpened = autoOpenedCameraByCacheRef.current[cacheKey] === true;

    if (Number.isFinite(meters) && meters <= AUTO_CAMERA_RADIUS_METERS && !alreadyOpened) {
      autoOpenedCameraByCacheRef.current[cacheKey] = true;
      navigation.navigate('ARCameraNavigatorScreen', {
        cache: selectedCache,
        discoveryRadiusMeters: 30,
        isPublic: true,
        onEvidenceCaptured: handleEvidenceCaptured,
      });
      return;
    }

    if (Number.isFinite(meters) && meters > AUTO_CAMERA_RESET_RADIUS_METERS && alreadyOpened) {
      autoOpenedCameraByCacheRef.current[cacheKey] = false;
    }
  }, [isFocused, navigation, selectedCache, userLocation]);

  const defaultRegion = {
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  };

  const mapRegion = userLocation
    ? {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    }
    : defaultRegion;

  const selectedEvent = useMemo(() => {
    if (!selectedCache) return null;
    const eventID = String(selectedCache.CacheEventID || selectedCache.CacheEvent?.EventID || '');
    return publicEventsByID[eventID] || selectedCache.CacheEvent || null;
  }, [publicEventsByID, selectedCache]);

  const gotoSelectedCache = async () => {
    if (!selectedCache) {
      Alert.alert('Select A Cache', 'Tap a public cache marker first.');
      return;
    }

    const latitude = selectedCache.CacheLatitude ?? selectedCache.CacheLat;
    const longitude = selectedCache.CacheLongitude ?? selectedCache.CacheLng;

    const iosUrl = `maps://?daddr=${latitude},${longitude}&dirflg=w`;
    const androidUrl = `google.navigation:q=${latitude},${longitude}&mode=w`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;

    const nativeUrl = Platform.OS === 'ios' ? iosUrl : androidUrl;
    const canOpenNative = await Linking.canOpenURL(nativeUrl);
    const targetUrl = canOpenNative ? nativeUrl : webUrl;
    const canOpenTarget = await Linking.canOpenURL(targetUrl);

    if (!canOpenTarget) {
      Alert.alert('Navigation Unavailable', 'Unable to open a maps application on this device.');
      return;
    }

    await Linking.openURL(targetUrl);
  };

  const openSelectedEvent = () => {
    if (!selectedCache || !selectedEvent) {
      Alert.alert('Select A Cache', 'Choose a cache marker to open its event.');
      return;
    }

    navigation.navigate('EventCacheListScreen', {
      event: {
        ...selectedEvent,
        EventID: selectedEvent.EventID || selectedCache.CacheEventID,
      },
      isHost: false,
    });
  };

  const openPublicLeaderboard = () => navigation.navigate('PublicLeaderboardScreen');
  const selectedEvidenceText = useMemo(() => {
    const cacheID = getCacheID(selectedCache);
    if (cacheID === null || cacheID === undefined) return '';
    return evidenceByCache[String(cacheID)] ? 'Evidence captured' : 'No evidence photo yet';
  }, [selectedCache, evidenceByCache]);
  const selectedEvidenceURI = useMemo(() => {
    const cacheID = getCacheID(selectedCache);
    if (cacheID === null || cacheID === undefined) return '';
    return evidenceByCache[String(cacheID)]?.uri || '';
  }, [selectedCache, evidenceByCache]);

  return (
    <View style={styles.screen}>
      <StatusBar style='dark' />

      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={Platform.OS === 'ios' ? 'hybridFlyover' : 'hybrid'}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {publicCaches.map((cache, index) => {
          const cacheID = getCacheID(cache);
          const selectedCacheID = getCacheID(selectedCache);
          return (
          <Marker
            key={cacheID ?? `${cache.CacheName || 'cache'}-${index}`}
            coordinate={{
              latitude: cache.CacheLatitude ?? cache.CacheLat,
              longitude: cache.CacheLongitude ?? cache.CacheLng,
            }}
            title={cache.CacheName}
            description={cache.CacheClue}
            pinColor={
              selectedCacheID !== null && selectedCacheID !== undefined && String(selectedCacheID) === String(cacheID)
                ? '#2f7f8f'
                : (evidenceByCache[String(cacheID)] ? '#3a8f54' : '#b57011')
            }
            onPress={() => setSelectedCache(cache)}
          />
          );
        })}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Treasure Atlas</Text>
          <Text style={styles.headerSubtitle}>Follow clues, track hidden caches, and mark your finds.</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendUnfound]} />
              <Text style={styles.legendText}>Hidden</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendFound]} />
              <Text style={styles.legendText}>Evidence</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendSelected]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          </View>
        </View>
      </View>

      {locationLoading || loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='small' color='white' />
          <Text style={styles.loadingText}>{loading ? 'Loading public caches...' : 'Locating...'}</Text>
        </View>
      ) : null}

      <View style={styles.bottomOverlay}>
        <View style={styles.actionPanel}>
          <View style={styles.selectedRow}>
            <Text style={styles.selectedTitle}>{selectedCache ? selectedCache.CacheName : 'Select a public cache marker'}</Text>
            {selectedCache ? (
              <Text style={styles.selectedMeta}>{Number(selectedCache.CachePoints || 0)} pts</Text>
            ) : null}
          </View>
          <View style={styles.selectedRow}>
            <Text style={styles.selectedEvent}>{selectedEvent?.EventName || ''}</Text>
            {selectedCache ? <Text style={styles.selectedEvidenceMeta}>{selectedEvidenceText}</Text> : null}
            {selectedCache && userLocation ? (
              <Text style={styles.selectedEventMeta}>
                {(() => {
                  const latitude = selectedCache.CacheLatitude ?? selectedCache.CacheLat;
                  const longitude = selectedCache.CacheLongitude ?? selectedCache.CacheLng;
                  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) return '';
                  const meters = distanceInMeters(userLocation.latitude, userLocation.longitude, latitude, longitude);
                  if (!Number.isFinite(meters)) return '';
                  if (meters <= AUTO_CAMERA_RADIUS_METERS) return `AR opens at <=${AUTO_CAMERA_RADIUS_METERS}m (${Math.round(meters)}m)`;
                  return `${Math.round(meters)}m`;
                })()}
              </Text>
            ) : null}
          </View>
          {selectedEvidenceURI ? (
            <View style={styles.evidencePreviewRow}>
              <Image source={{ uri: selectedEvidenceURI }} style={styles.evidencePreviewImage} />
              <Text style={styles.evidencePreviewText}>Saved evidence photo</Text>
            </View>
          ) : null}
          <View style={styles.actionRow}>
            <Button
              label=''
              icon={<Icons.MyLocation color='white' />}
              onClick={() => requestLocation(true)}
              styleButton={[styles.actionButton, styles.locationButton]}
              styleLabel={styles.actionLabel}
            />
            <Button
              label=''
              icon={<Icons.Navigation color='black' />}
              onClick={gotoSelectedCache}
              styleButton={[styles.actionButton, styles.navigateButton]}
              styleLabel={[styles.actionLabel, styles.navigateLabel]}
            />
            <Button
              label=''
              icon={<Icons.Map color='white' />}
              onClick={openSelectedEvent}
              styleButton={[styles.actionButton, styles.openEventButton]}
              styleLabel={styles.actionLabel}
            />
            <Button
              label=''
              icon={<Icons.Leaderboard color='white' />}
              onClick={openPublicLeaderboard}
              styleButton={[styles.actionButton, styles.leaderboardButton]}
              styleLabel={styles.actionLabel}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#20150b',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    position: 'absolute',
    top: 104,
    left: 16,
    right: 16,
  },
  headerCard: {
    backgroundColor: 'rgba(244, 232, 200, 0.96)',
    borderRadius: 16,
    padding: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: '#a8742a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: {
    color: '#4f2f10',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    color: '#6a4a27',
    fontSize: 13,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  legendUnfound: {
    backgroundColor: '#b57011',
  },
  legendFound: {
    backgroundColor: '#3a8f54',
  },
  legendSelected: {
    backgroundColor: '#2f7f8f',
  },
  legendText: {
    color: '#5e4121',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 168,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 26,
  },
  actionPanel: {
    backgroundColor: 'rgba(36, 23, 11, 0.82)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(230, 190, 120, 0.42)',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
    gap: 8,
  },
  selectedTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  selectedMeta: {
    color: '#f0c771',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedEvent: {
    color: '#eadfcb',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  selectedEvidenceMeta: {
    color: '#86df9d',
    fontSize: 11,
    fontWeight: '700',
  },
  selectedEventMeta: {
    color: '#d9a83c',
    fontSize: 11,
    fontWeight: '700',
  },
  evidencePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  evidencePreviewImage: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  evidencePreviewText: {
    color: '#d4f0dc',
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
  },
  actionLabel: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.2,
    fontSize: 15,
  },
  locationButton: {
    backgroundColor: 'rgba(255, 240, 212, 0.15)',
    borderColor: 'rgba(232, 189, 117, 0.45)',
  },
  openEventButton: {
    backgroundColor: 'rgba(255, 240, 212, 0.15)',
    borderColor: 'rgba(232, 189, 117, 0.45)',
  },
  leaderboardButton: {
    backgroundColor: 'rgba(255, 240, 212, 0.15)',
    borderColor: 'rgba(232, 189, 117, 0.45)',
  },
  navigateButton: {
    backgroundColor: '#f1c66c',
    borderColor: '#e1ad47',
  },
  navigateLabel: {
    color: '#2f1f06',
    fontWeight: '700',
  },
});

export default PublicCachesScreen;
