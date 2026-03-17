import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Screen from '../layout/Screen';
import Form from '../UI/Form';
import Icons from '../UI/Icons';
import API from '../API/API';

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

const AddHuntLocationScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const { event, coordinate, isHost = false } = route.params;
  const cachesEndpoint = 'https://mark0s.com/geoquest/v1/api/caches?key=16gv8f';
  // State -------------------------------
  const [cache, setCache] = useState({
    ...defaultCache,
    CacheEventID: event.EventID,
    CacheLatitude: coordinate.latitude,
    CacheLongitude: coordinate.longitude,
  });
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

    const cacheToSave = {
      ...cache,
      CachePoints: points,
      CacheLatitude: Number(cache.CacheLatitude),
      CacheLongitude: Number(cache.CacheLongitude),
    };

    const response = await API.post(cachesEndpoint, cacheToSave);
    if (!response.isSuccess) {
      Alert.alert('Add Location Failed', response.message);
      return;
    }

    const payload = normaliseCreatedCache(response.result);
    const createdCache = {
      ...cacheToSave,
      ...payload,
    };

    const eventCaches = event.EventCaches || [];
    const updatedEvent = {
      ...event,
      EventCaches: [...eventCaches, createdCache],
    };

    navigation.replace('EventCacheListScreen', {event: updatedEvent, isHost});
  };

  const handleCancel = () => navigation.goBack();
  // View --------------------------------
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Add Hunt Location</Text>
        <Text style={styles.subtitle}>Selected map point:</Text>
        <Text style={styles.coords}>Lat {cache.CacheLatitude.toFixed(6)} | Lng {cache.CacheLongitude.toFixed(6)}</Text>
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
});

export default AddHuntLocationScreen;
