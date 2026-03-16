import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const eventsKey = 'geoquest_events';

const useEvents = () => {
  // Initialisations ---------------------
  // State -------------------------------
  const [events, setEvents] = useState([]);
  // Handlers ----------------------------
  const loadEvents = async () => {
    try {
      const json = await AsyncStorage.getItem(eventsKey);
      if (json !== null) setEvents(JSON.parse(json));
    } catch (error) {
      Alert.alert(`Error loading events: ${error}`);
    }
  };

  const saveEvent = async (newEvent) => {
    try {
      const updated = [...events, newEvent];
      await AsyncStorage.setItem(eventsKey, JSON.stringify(updated));
      setEvents(updated);
    } catch (error) {
      Alert.alert(`Error saving event: ${error}`);
    }
  };

  const findEventByCode = (code) =>
    events.find((e) => e.EventInviteCode === code.trim().toUpperCase()) || null;

  const updateEvent = async (updatedEvent) => {
    try {
      const updated = events.map((e) =>
        e.EventID === updatedEvent.EventID ? updatedEvent : e
      );
      await AsyncStorage.setItem(eventsKey, JSON.stringify(updated));
      setEvents(updated);
    } catch (error) {
      Alert.alert(`Error updating event: ${error}`);
    }
  };

  useEffect(() => { loadEvents(); }, []);
  // Return --------------------------------
  return [events, saveEvent, findEventByCode, updateEvent];
};

export default useEvents;
