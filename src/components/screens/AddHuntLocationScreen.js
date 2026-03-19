import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import Screen from '../layout/Screen';
import Form from '../UI/Form';
import Icons from '../UI/Icons';
import API from '../API/API';

const DEFAULT_CACHE_IMAGE_URL = 'https://placehold.co/600x400/png';

const normaliseCreatedCache = (result) => {
  if (!result) return {};
  if (Array.isArray(result)) return result[0] || {};
  if (typeof result === 'number') return { CacheID: result };
  if (typeof result === 'string') {
    const parsed = Number(result);
    return Number.isNaN(parsed) ? {} : { CacheID: parsed };
  }

  const cacheID =
    result.CacheID ||
    result.CacheId ||
    result.id ||
    result.insertId ||
    result.InsertId ||
    null;

  return cacheID ? { ...result, CacheID: cacheID } : result;
};

const defaultCache = {
  CacheID: null,
  CacheName: '',
  CacheDescription: '',
  CacheEventID: null,
  CacheImageURL: '',
  CacheClue: '',
  CachePoints: '10',
  CacheLatitude: 0,
  CacheLongitude: 0,
  CacheEvent: null,
};

const buildLocationName = (place) => {
  if (!place) return '';
  const primary = [place.name, place.street]
    .filter(Boolean)
    .join(' ')
    .trim();
  const locality = [place.city || place.subregion, place.region]
    .filter(Boolean)
    .join(', ')
    .trim();
  return [primary, locality].filter(Boolean).join(' - ').trim();
};

const AddHuntLocationScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const { event, coordinate, isHost = false, onCacheAdded } = route.params;
  const cachesEndpoint = API.geoQuest.caches();
  // State -------------------------------
  const [isResolvingName, setIsResolvingName] = useState(true);
  const [cache, setCache] = useState({
    ...defaultCache,
    CacheEventID: event.EventID,
    CacheLatitude: coordinate.latitude,
    CacheLongitude: coordinate.longitude,
  });

  useEffect(() => {
    const setNameFromCoordinate = async () => {
      setIsResolvingName(true);
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
        });
        const suggestedName = buildLocationName(places?.[0]);
        if (suggestedName) {
          setCache((prev) => ({
            ...prev,
            CacheName: prev.CacheName || suggestedName,
          }));
        }
      } catch (_error) {
        // Ignore lookup failures and keep manual entry available.
      } finally {
        setIsResolvingName(false);
      }
    };

    setNameFromCoordinate();
  }, [coordinate.latitude, coordinate.longitude]);
  // Handlers ----------------------------
  const handleChange = (field, value) => setCache({...cache, [field]: value});

  const handleSubmit = async () => {
    if (!isHost) {
      Alert.alert('Host Only', 'Only the host can add hunt locations.');
      return;
    }

    const points = Number(cache.CachePoints);
    if (Number.isNaN(points) || points < 0) {
      Alert.alert('Invalid Points', 'Points must be a valid number.');
      return;
    }

    const { CacheImageURL, ...cacheWithoutImage } = cache;
    const imageURL = (CacheImageURL || '').trim();

    const cacheToSave = {
      ...cacheWithoutImage,
      CachePoints: points,
      CacheLatitude: Number(cache.CacheLatitude),
      CacheLongitude: Number(cache.CacheLongitude),
      ...(imageURL ? { CacheImageURL: imageURL } : {}),
    };

    let response = await API.post(cachesEndpoint, cacheToSave);

    const imageRequiredError = !imageURL
      && (response.message || '').toLowerCase().includes('cacheimageurl');

    if (!response.isSuccess && imageRequiredError) {
      response = await API.post(cachesEndpoint, {
        ...cacheToSave,
        CacheImageURL: DEFAULT_CACHE_IMAGE_URL,
      });
    }

    if (!response.isSuccess) {
      Alert.alert('Add Location Failed', response.message);
      return;
    }

    const payload = normaliseCreatedCache(response.result);
    const createdCache = {
      ...cacheToSave,
      ...payload,
    };

    if (onCacheAdded) onCacheAdded(createdCache);
    navigation.goBack();
  };

  const handleCancel = () => navigation.goBack();
  // View --------------------------------
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Add Hunt Location</Text>
        <Text style={styles.subtitle}>Selected map point:</Text>
        <Text style={styles.coords}>Lat {cache.CacheLatitude.toFixed(6)} | Lng {cache.CacheLongitude.toFixed(6)}</Text>
        <Text style={styles.lookupText}>{isResolvingName ? 'Finding location name...' : 'Location name loaded from map point.'}</Text>
      </View>

      <Form
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel='Save Location'
        submitIcon={<Icons.Add />}
      >
        <Form.InputText
          label='Location Name'
          value={cache.CacheName}
          onChange={(value) => handleChange('CacheName', value)}
        />
        <Form.InputText
          label='Description'
          value={cache.CacheDescription}
          onChange={(value) => handleChange('CacheDescription', value)}
        />
        <Form.InputText
          label='Clue'
          value={cache.CacheClue}
          onChange={(value) => handleChange('CacheClue', value)}
        />
        <Form.InputText
          label='Points'
          value={`${cache.CachePoints}`}
          onChange={(value) => handleChange('CachePoints', value)}
        />
        <Form.InputText
          label='Image URL (optional)'
          value={cache.CacheImageURL}
          onChange={(value) => handleChange('CacheImageURL', value)}
        />
      </Form>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 3,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  subtitle: {
    fontSize: 14,
    color: 'grey',
  },
  coords: {
    fontSize: 13,
    color: 'black',
    fontWeight: '600',
  },
  lookupText: {
    fontSize: 12,
    color: '#555555',
  },
});

export default AddHuntLocationScreen;
