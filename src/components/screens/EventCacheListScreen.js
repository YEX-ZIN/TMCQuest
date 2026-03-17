import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button } from '../UI/Button';
import Icons from '../UI/Icons';

const EventCacheListScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const isHost = route.params?.isHost === true;
  // State -------------------------------
  const [event, setEvent] = useState(route.params.event);

  const eventStart = event.EventStart || event.EventStartTime || '';
  const eventFinish = event.EventFinish || event.EventEndTime || '';
  const eventCaches = event.EventCaches || [];
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

  const gotoLeaderboard = () => navigation.navigate('EventLeaderboardScreen', {event});
  const recenterMap = () => requestLocation();
  const selectCache = (cache) => setSelectedCache(cache);
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

  const gotoSelectedCache = async () => {
    if (!selectedCache) {
      Alert.alert('Select A Cache', 'Tap a cache marker first, then press Navigate.');
      return;
    }

    const latitude = selectedCache.CacheLatitude || selectedCache.CacheLat;
    const longitude = selectedCache.CacheLongitude || selectedCache.CacheLng;
    if (!latitude || !longitude) {
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

  useEffect(() => { requestLocation(); }, []);
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
        {eventCaches.map((cache) => (
          <Marker
            key={cache.CacheID}
            coordinate={{
              latitude: cache.CacheLatitude || cache.CacheLat,
              longitude: cache.CacheLongitude || cache.CacheLng,
            }}
            title={cache.CacheName}
            description={cache.CacheClue}
            pinColor={selectedCache?.CacheID === cache.CacheID ? 'blue' : 'red'}
            onPress={() => selectCache(cache)}
          />
        ))}
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
              <Text style={styles.codeValue}>Invite: {event.EventInviteCode || '-'}</Text>
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

      <View style={styles.bottomOverlay}>
        <View style={styles.actionPanel}>
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
