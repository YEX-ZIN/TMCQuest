import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import API from '../API/API';
import Icons from '../UI/Icons';
import { Button } from '../UI/Button';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const isPublicEvent = (event) => {
  const value = event?.EventIspublic;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return false;
};

const PublicCachesScreen = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [publicEventsByID, setPublicEventsByID] = useState({});
  const [publicCaches, setPublicCaches] = useState([]);
  const [selectedCache, setSelectedCache] = useState(null);

  const requestLocation = async () => {
    setLocationLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation(loc.coords);
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

  return (
    <View style={styles.screen}>
      <StatusBar style='dark' />

      <MapView
        style={styles.map}
        mapType={Platform.OS === 'ios' ? 'hybridFlyover' : 'hybrid'}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {publicCaches.map((cache) => (
          <Marker
            key={cache.CacheID}
            coordinate={{
              latitude: cache.CacheLatitude ?? cache.CacheLat,
              longitude: cache.CacheLongitude ?? cache.CacheLng,
            }}
            title={cache.CacheName}
            description={cache.CacheClue}
            pinColor={selectedCache?.CacheID === cache.CacheID ? 'blue' : '#d9a83c'}
            onPress={() => setSelectedCache(cache)}
          />
        ))}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Public World</Text>
          <Text style={styles.headerSubtitle}>Explore shared caches from public events.</Text>
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
          </View>
          <View style={styles.actionRow}>
            <Button
              label=''
              icon={<Icons.MyLocation color='white' />}
              onClick={requestLocation}
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
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    padding: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  headerTitle: {
    color: '#1f1f1f',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#4d4d4d',
    fontSize: 13,
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
    color: '#e9d18f',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedEvent: {
    color: '#d9d9d9',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  openEventButton: {
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

export default PublicCachesScreen;
