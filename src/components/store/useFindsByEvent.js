import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import API from '../API/API';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const useFindsByEvent = (eventID) => {
  const [finds, setFinds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFindsByEvent = async (id = eventID) => {
    if (!id) {
      setFinds([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await API.get(API.geoQuest.findsByEvent(id));
      if (response.isSuccess) {
        const normalized = normaliseList(response.result);
        setFinds(normalized);
        return normalized;
      } else {
        setError(response.message || 'Failed to load finds');
        return [];
      }
    } catch (err) {
      const errorMsg = err.message || 'Error loading finds';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadFindsByPlayer = async (playerID) => {
    if (!playerID) {
      setFinds([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await API.get(API.geoQuest.findsByPlayer(playerID));
      if (response.isSuccess) {
        const normalized = normaliseList(response.result);
        setFinds(normalized);
        return normalized;
      } else {
        setError(response.message || 'Failed to load player finds');
        return [];
      }
    } catch (err) {
      const errorMsg = err.message || 'Error loading player finds';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (eventID) {
      loadFindsByEvent(eventID);
    }
  }, [eventID]);

  return {
    finds,
    setFinds,
    isLoading,
    error,
    loadFindsByEvent,
    loadFindsByPlayer,
  };
};

export default useFindsByEvent;
