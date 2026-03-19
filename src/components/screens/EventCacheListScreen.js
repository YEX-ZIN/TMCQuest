import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { Button } from '../UI/Button';
import Icons from '../UI/Icons';
import API from '../API/API';
import useCurrentUser from '../store/useCurrentUser';
import { loadEvidenceMap } from '../store/evidenceStore';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const getID = (obj, ...fields) => {
  for (const field of fields) {
    if (obj?.[field] !== undefined && obj?.[field] !== null) return obj[field];
  }
  return null;
};

const getCacheID = (cache) => getID(cache, 'CacheID', 'CacheId', 'id');
const getPlayerID = (player) => getID(player, 'PlayerID', 'PlayerId', 'id');
const getFindCacheID = (find) => getID(find, 'FindCacheID', 'FindCacheId', 'CacheID', 'CacheId') || getCacheID(find?.FindCache) || getCacheID(find);

const DISCOVERY_RADIUS_METERS = 30;
const AUTO_CAMERA_RADIUS_METERS = 100;
const AUTO_CAMERA_RESET_RADIUS_METERS = 130;

const normaliseCreatedID = (result, keyName) => {
  if (result === null || result === undefined) return null;
  if (typeof result === 'number' || typeof result === 'string') return result;
  if (Array.isArray(result)) return normaliseCreatedID(result[0], keyName);
  return getID(result, keyName, 'id', 'insertId', 'InsertId');
};

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

const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) return '-';
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(2)} km away`;
};

const encodeQuestCode = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `${value ?? '-'}`;
  const mixed = (numeric * 1103515245 + 12345) >>> 0;
  return mixed.toString(36).slice(-6).padStart(6, '0').toLowerCase();
};

const EventCacheListScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const isFocused = useIsFocused();
  const isHost = route.params?.isHost === true;
  const [currentUser] = useCurrentUser();
  // State -------------------------------
  const [event, setEvent] = useState(route.params.event);
  const [cachesLoading, setCachesLoading] = useState(false);
  const [isLoggingFind, setIsLoggingFind] = useState(false);
  const [foundCacheLookup, setFoundCacheLookup] = useState({});

  const eventStart = event.EventStart || event.EventStartTime || '';
  const eventFinish = event.EventFinish || event.EventEndTime || '';
  const eventCaches = event.EventCaches || [];
  const inviteCode = (event.EventInviteCode
    ? `${event.EventInviteCode}`
    : encodeQuestCode(event.EventID || event.EventId || event.id || '-')).toUpperCase();
  const parseDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const formatDate = (value) => {
    const parsed = parseDate(value);
    if (!parsed) return value || '-';
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };
  const formatTime = (value) => {
    const parsed = parseDate(value);
    if (!parsed) return '-';
    return parsed.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };
  // State -------------------------------
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selectedCache, setSelectedCache] = useState(null);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(Date.now());
  const [evidenceByCache, setEvidenceByCache] = useState({});
  const autoOpenedCameraByCacheRef = useRef({});
  // Handlers ----------------------------
  const requestLocation = async () => {
    setLocationLoading(true);
    const {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location access is needed to show your position on the map.');
      setLocationLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation(loc.coords);
    setLocationLoading(false);
  };

  const gotoLeaderboard = () => {
    navigation.navigate('EventLeaderboardScreen', {event, refreshKey: leaderboardRefreshKey});
  };
  const recenterMap = () => requestLocation();
  const selectCache = (cache) => setSelectedCache(cache);
  const handleEvidenceCaptured = useCallback((payload) => {
    const cacheID = payload?.cacheID;
    const uri = payload?.uri;
    if (cacheID === null || cacheID === undefined || !uri) return;

    setEvidenceByCache((prev) => ({
      ...prev,
      [String(cacheID)]: {
        uri,
        capturedAt: payload?.capturedAt || new Date().toISOString(),
      },
    }));
  }, []);

  const refreshEvidence = useCallback(async () => {
    try {
      const evidenceMap = await loadEvidenceMap();
      setEvidenceByCache(evidenceMap);
    } catch (error) {
      // Ignore evidence read failures to avoid interrupting gameplay.
    }
  }, []);

  const loadEventCaches = useCallback(async () => {
    const eventID = event.EventID || event.EventId || event.id;
    if (!eventID) return;

    setCachesLoading(true);
    const response = await API.get(API.geoQuest.cachesByEvent(eventID));
    setCachesLoading(false);

    if (!response.isSuccess) return;

    setEvent((prev) => ({
      ...prev,
      EventCaches: normaliseList(response.result),
      EventInviteCode: String(eventID),
    }));
  }, [event.EventID, event.EventId, event.id]);

  const handleCacheAdded = useCallback((newCache) => {
    setEvent(prev => ({
      ...prev,
      EventCaches: [...(prev.EventCaches || []), newCache],
    }));
  }, []);

  const handleMapLongPress = (mapEvent) => {
    if (!isHost) return;
    const coordinate = mapEvent.nativeEvent.coordinate;
    navigation.navigate('AddHuntLocationScreen', {event, coordinate, isHost, onCacheAdded: handleCacheAdded});
  };

  const loadFoundCachesForCurrentPlayer = useCallback(async () => {
    const eventID = getID(event, 'EventID', 'EventId', 'id');
    if (!currentUser?.UserID || !eventID) {
      setFoundCacheLookup({});
      return;
    }

    const playersResponse = await API.get(API.geoQuest.players());
    if (!playersResponse.isSuccess) {
      setFoundCacheLookup({});
      return;
    }

    const players = normaliseList(playersResponse.result);
    const playerRecord = players.find(
      (player) => String(player.PlayerUserID) === String(currentUser.UserID)
        && String(player.PlayerEventID) === String(eventID),
    );

    const playerID = getPlayerID(playerRecord);
    if (!playerID) {
      setFoundCacheLookup({});
      return;
    }

    const findsResponse = await API.get(API.geoQuest.findsByPlayer(playerID));
    if (!findsResponse.isSuccess) {
      setFoundCacheLookup({});
      return;
    }

    const lookup = normaliseList(findsResponse.result).reduce((acc, find) => {
      const cacheID = getFindCacheID(find);
      if (cacheID !== null && cacheID !== undefined) acc[String(cacheID)] = true;
      return acc;
    }, {});

    setFoundCacheLookup(lookup);
  }, [currentUser?.UserID, event]);

  const gotoSelectedCache = async () => {
    if (!selectedCache) {
      Alert.alert('Select A Cache', 'Tap a cache marker first, then press Navigate.');
      return;
    }

    const latitude = selectedCache.CacheLatitude ?? selectedCache.CacheLat;
    const longitude = selectedCache.CacheLongitude ?? selectedCache.CacheLng;
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      Alert.alert('Navigation Unavailable', 'This cache does not have valid coordinates.');
      return;
    }

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

  const logDiscovery = async () => {
    if (!currentUser?.UserID) {
      Alert.alert('Login Required', 'Log in before logging a discovery.');
      return;
    }

    const eventID = getID(event, 'EventID', 'EventId', 'id');
    const cacheID = getCacheID(selectedCache);

    if (!selectedCache || cacheID === null || cacheID === undefined || eventID === null || eventID === undefined) {
      Alert.alert('Select A Cache', 'Tap a cache marker before logging a discovery.');
      return;
    }

    const cacheLatitude = selectedCache.CacheLatitude ?? selectedCache.CacheLat;
    const cacheLongitude = selectedCache.CacheLongitude ?? selectedCache.CacheLng;
    if (cacheLatitude === undefined || cacheLatitude === null || cacheLongitude === undefined || cacheLongitude === null) {
      Alert.alert('Log Failed', 'This cache does not have valid coordinates.');
      return;
    }

    let latestCoords = userLocation;
    if (!latestCoords) {
      const latestLocation = await Location.getCurrentPositionAsync({});
      latestCoords = latestLocation?.coords || null;
      if (latestCoords) setUserLocation(latestCoords);
    }

    if (!latestCoords) {
      Alert.alert('Location Required', 'Your location is needed to unlock and log this cache.');
      return;
    }

    const metersAway = distanceInMeters(
      latestCoords.latitude,
      latestCoords.longitude,
      cacheLatitude,
      cacheLongitude,
    );
    if (!Number.isFinite(metersAway) || metersAway > DISCOVERY_RADIUS_METERS) {
      Alert.alert(
        'Too Far Away',
        `Move within ${DISCOVERY_RADIUS_METERS} meters to unlock this cache. You are ${formatDistance(metersAway)}.`,
      );
      return;
    }

    setIsLoggingFind(true);

    const playersResponse = await API.get(API.geoQuest.players());
    if (!playersResponse.isSuccess) {
      setIsLoggingFind(false);
      Alert.alert('Log Failed', playersResponse.message || 'Could not load players right now.');
      return;
    }

    const players = normaliseList(playersResponse.result);
    let playerRecord = players.find(
      (player) => String(player.PlayerUserID) === String(currentUser.UserID)
        && String(player.PlayerEventID) === String(eventID),
    );

    if (!playerRecord) {
      const createPlayerResponse = await API.post(API.geoQuest.players(), {
        PlayerUserID: currentUser.UserID,
        PlayerEventID: eventID,
      });

      if (!createPlayerResponse.isSuccess) {
        setIsLoggingFind(false);
        Alert.alert('Log Failed', createPlayerResponse.message || 'Could not join this event automatically.');
        return;
      }

      const createdPlayerID = normaliseCreatedID(createPlayerResponse.result, 'PlayerID');
      playerRecord = { PlayerID: createdPlayerID, PlayerUserID: currentUser.UserID, PlayerEventID: eventID };
    }

    const playerID = getPlayerID(playerRecord);
    if (!playerID) {
      setIsLoggingFind(false);
      Alert.alert('Log Failed', 'Could not resolve your player record for this event.');
      return;
    }

    const findsResponse = await API.get(API.geoQuest.findsByPlayer(playerID));
    if (!findsResponse.isSuccess) {
      setIsLoggingFind(false);
      Alert.alert('Log Failed', findsResponse.message || 'Could not verify previous discoveries.');
      return;
    }

    const existingFinds = normaliseList(findsResponse.result);
    const alreadyFound = existingFinds.some((find) => {
      const findCacheID = getFindCacheID(find);
      return String(findCacheID) === String(cacheID);
    });
    if (alreadyFound) {
      setIsLoggingFind(false);
      Alert.alert('Already Logged', 'You already discovered this cache.');
      return;
    }

    const evidenceURI = evidenceByCache[String(cacheID)]?.uri || '';
    const payload = {
      FindPlayerID: playerID,
      FindCacheID: cacheID,
      FindDatetime: new Date().toISOString(),
    };
    if (evidenceURI) payload.FindEvidenceURL = evidenceURI;

    let createFindResponse = await API.post(API.geoQuest.finds(), payload);
    if (!createFindResponse.isSuccess && evidenceURI) {
      const fallbackPayload = {
        FindPlayerID: playerID,
        FindCacheID: cacheID,
        FindDatetime: payload.FindDatetime,
      };
      createFindResponse = await API.post(API.geoQuest.finds(), fallbackPayload);
    }

    setIsLoggingFind(false);

    if (!createFindResponse.isSuccess) {
      Alert.alert('Log Failed', createFindResponse.message || 'Could not log your discovery.');
      return;
    }

    setFoundCacheLookup((prev) => ({
      ...prev,
      [String(cacheID)]: true,
    }));
    setLeaderboardRefreshKey(Date.now());

    const points = Number(selectedCache.CachePoints || 0);
    Alert.alert('Discovery Logged', `Nice find! +${Number.isFinite(points) ? points : 0} points.`);
  };

  useEffect(() => { requestLocation(); }, []);
  useEffect(() => { if (isFocused) refreshEvidence(); }, [isFocused, refreshEvidence]);
  useEffect(() => {
    let mounted = true;
    let watcher = null;

    const startWatcher = async () => {
      const {status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !mounted) return;

      watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1200,
          distanceInterval: 1,
        },
        (location) => {
          if (!mounted) return;
          setUserLocation(location.coords);
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
  useEffect(() => { loadEventCaches(); }, [loadEventCaches]);
  useEffect(() => { loadFoundCachesForCurrentPlayer(); }, [loadFoundCachesForCurrentPlayer]);

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
        event,
        discoveryRadiusMeters: DISCOVERY_RADIUS_METERS,
        onEvidenceCaptured: handleEvidenceCaptured,
      });
      return;
    }

    if (Number.isFinite(meters) && meters > AUTO_CAMERA_RESET_RADIUS_METERS && alreadyOpened) {
      autoOpenedCameraByCacheRef.current[cacheKey] = false;
    }
  }, [isFocused, selectedCache, userLocation, navigation, event, handleEvidenceCaptured]);

  const selectedDistanceText = useMemo(() => {
    if (!selectedCache || !userLocation) return '';
    const latitude = selectedCache.CacheLatitude ?? selectedCache.CacheLat;
    const longitude = selectedCache.CacheLongitude ?? selectedCache.CacheLng;
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) return '';
    const meters = distanceInMeters(userLocation.latitude, userLocation.longitude, latitude, longitude);
    if (meters <= AUTO_CAMERA_RADIUS_METERS) return `Camera AR zone: ${Math.round(meters)} m`;
    if (meters <= DISCOVERY_RADIUS_METERS) return `Unlocked: ${Math.round(meters)} m`;
    return formatDistance(meters);
  }, [selectedCache, userLocation]);
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
  // View --------------------------------
  const defaultRegion = {
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const mapRegion = userLocation
    ? {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }
    : defaultRegion;

  const mapType = Platform.OS === 'ios' ? 'hybridFlyover' : 'hybrid';

  const mapCamera = {
    center: {
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    },
    pitch: 60,
    heading: 20,
    altitude: 700,
    zoom: 16,
  };

  return (
    <View style={styles.screen}>
      <StatusBar style='dark' />

      <MapView
        style={styles.map}
        mapType={mapType}
        initialRegion={mapRegion}
        camera={mapCamera}
        pitchEnabled={true}
        rotateEnabled={true}
        showsBuildings={true}
        showsUserLocation={true}
        showsCompass={false}
        toolbarEnabled={false}
        onLongPress={handleMapLongPress}
      >
        {eventCaches.map((cache, index) => {
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
                ? 'blue'
                : (foundCacheLookup[String(cacheID)] ? 'green' : 'red')
            }
            onPress={() => selectCache(cache)}
          />
          );
        })}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTopRow}>
            <Text style={styles.eventName}>{event.EventName}</Text>
            <View style={styles.eventBadge}>
              <Text style={styles.eventBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.metaPill}>
            <View style={styles.metaInline}>
              <Icons.Clock />
              <View style={styles.timeBlock}>
                <Text style={styles.metaDateText}>{formatDate(eventStart)}</Text>
                <Text style={styles.metaTimeText}>{formatTime(eventStart)} - {formatTime(eventFinish)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaPillSmall}>
              <Text style={styles.codeValue}>Quest Code: {inviteCode}</Text>
            </View>
            <View style={styles.metaPillSmall}>
              <View style={styles.metaInline}>
                <Icons.CacheBox />
                <Text style={styles.cacheCount}>{eventCaches.length}</Text>
              </View>
            </View>
          </View>
          {isHost && (
            <View style={styles.metaPill}>
              <Text style={styles.hostHintText}>Host mode: long-press the map to add a hunt location.</Text>
            </View>
          )}
        </View>
      </View>

      {locationLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='small' color='white' />
          <Text style={styles.loadingText}>Locating...</Text>
        </View>
      ) : null}

      {cachesLoading ? (
        <View style={styles.cacheLoadingOverlay}>
          <ActivityIndicator size='small' color='white' />
          <Text style={styles.loadingText}>Loading caches...</Text>
        </View>
      ) : null}

      <View style={styles.bottomOverlay}>
        <View style={styles.actionPanel}>
          <View style={styles.selectedRow}>
            <Text style={styles.selectedTitle}>{selectedCache ? selectedCache.CacheName : 'Select a cache marker'}</Text>
            {selectedCache ? (
              <Text style={styles.selectedMeta}>{Number(selectedCache.CachePoints || 0)} pts</Text>
            ) : null}
          </View>
          <View style={styles.selectedRow}>
            <Text style={styles.selectedSubMeta}>{selectedDistanceText || 'Distance will show after selecting a cache'}</Text>
            {selectedCache ? <Text style={styles.selectedEvidenceMeta}>{selectedEvidenceText}</Text> : null}
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
              onClick={recenterMap}
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
              icon={<Icons.Leaderboard color='white' />}
              onClick={gotoLeaderboard}
              styleButton={[styles.actionButton, styles.leaderboardButton]}
              styleLabel={styles.actionLabel}
            />
            <Button
              label=''
              icon={<Icons.Add />}
              onClick={isLoggingFind ? () => {} : logDiscovery}
              styleButton={[styles.actionButton, styles.logButton]}
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
    backgroundColor: 'black',
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
  eventHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    padding: 12,
    gap: 7,
    borderWidth: 1,
    borderColor: '#e3e3e3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: 'black',
    flex: 1,
  },
  eventBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d7d7d7',
    backgroundColor: '#f6f6f6',
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  eventBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b3b3b',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 7,
  },
  metaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaPill: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ececec',
  },
  metaPillSmall: {
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#ececec',
    flex: 1,
  },
  timeBlock: {
    gap: 1,
  },
  metaDateText: {
    fontSize: 12,
    color: '#1f1f1f',
    fontWeight: '700',
  },
  metaTimeText: {
    fontSize: 11,
    color: '#4d4d4d',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  codeValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222222',
    letterSpacing: 0.5,
  },
  cacheCount: {
    fontSize: 12,
    color: '#222222',
    fontWeight: '600',
  },
  hostHintText: {
    fontSize: 11,
    color: '#333333',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 142,
    left: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cacheLoadingOverlay: {
    position: 'absolute',
    top: 184,
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    color: '#e9d18f',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedSubMeta: {
    color: '#d9d9d9',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  selectedEvidenceMeta: {
    color: '#7af4a5',
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
    color: '#d6f7e2',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.2,
    fontSize: 15,
  },
  locationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  leaderboardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  logButton: {
    backgroundColor: '#d9a83c',
    borderColor: '#f0d080',
  },
  navigateButton: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  navigateLabel: {
    color: 'black',
    fontWeight: '700',
  },
});

export default EventCacheListScreen;
