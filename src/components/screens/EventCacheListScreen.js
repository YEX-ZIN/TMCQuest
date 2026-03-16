import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Screen from '../layout/Screen';
import { Button, ButtonTray } from '../UI/Button';
import Icons from '../UI/Icons';

const EventCacheListScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const {event} = route.params;
  const eventDescription = event.EventDescription || event.EventDesc || '';
  const eventStart = event.EventStart || event.EventStartTime || '';
  const eventFinish = event.EventFinish || event.EventEndTime || '';
  const eventCaches = event.EventCaches || [];
  const formatDateTime = (value) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value || '-';
    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  // State -------------------------------
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
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

  useEffect(() => { requestLocation(); }, []);
  // View --------------------------------
  const defaultRegion = {
    latitude: 51.5074,
    longitude: -0.1278,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const mapRegion = userLocation
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : defaultRegion;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.eventHeader}>
          <Text style={styles.eventName}>{event.EventName}</Text>
          <Text style={styles.eventDesc}>{eventDescription}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>🕐 {formatDateTime(eventStart)} — {formatDateTime(eventFinish)}</Text>
          </View>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>Invite Code: </Text>
            <Text style={styles.codeValue}>{event.EventInviteCode}</Text>
          </View>
        </View>

        <View style={styles.mapContainer}>
          {locationLoading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator size="large" />
              <Text style={styles.mapLoadingText}>Getting your location...</Text>
            </View>
          ) : (
            <MapView style={styles.map} region={mapRegion} showsUserLocation={true}>
              {eventCaches.map((cache) => (
                <Marker
                  key={cache.CacheID}
                  coordinate={{latitude: cache.CacheLat, longitude: cache.CacheLng}}
                  title={cache.CacheName}
                  description={cache.CacheClue}
                />
              ))}
            </MapView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Caches ({eventCaches.length})</Text>
          {eventCaches.length === 0 ? (
            <Text style={styles.emptyText}>No caches added yet.</Text>
          ) : (
            eventCaches.map((cache) => (
              <View key={cache.CacheID} style={styles.cacheItem}>
                <Text style={styles.cacheName}>{cache.CacheName}</Text>
                <Text style={styles.cacheClue}>🗺️ {cache.CacheClue}</Text>
                <Text style={styles.cachePoints}>⭐ {cache.CachePoints} pts</Text>
              </View>
            ))
          )}
        </View>

        <ButtonTray>
          <Button label="Leaderboard" icon={<Icons.Favorite />} onClick={gotoLeaderboard} />
        </ButtonTray>

      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  eventHeader: {
    gap: 6,
    marginBottom: 16,
  },
  eventName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'black',
  },
  eventDesc: {
    fontSize: 15,
    color: 'grey',
  },
  metaRow: {
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: 'grey',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  codeLabel: {
    fontSize: 14,
    color: 'grey',
  },
  codeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
  },
  mapContainer: {
    height: 320,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'lightgray',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  mapLoadingText: {
    color: 'grey',
    fontSize: 14,
  },
  section: {
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  emptyText: {
    color: 'grey',
    fontSize: 14,
  },
  cacheItem: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  cacheName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  cacheClue: {
    fontSize: 14,
    color: 'grey',
  },
  cachePoints: {
    fontSize: 13,
    color: 'black',
  },
});

export default EventCacheListScreen;
