import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Screen from '../layout/Screen';
import Form from '../UI/Form';
import Icons from '../UI/Icons';
import API from '../API/API';
import useCurrentUser from '../store/useCurrentUser';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const normaliseJoinCode = (value) => value.trim().toUpperCase().replace(/^INVITE:\s*/, '').replace(/^#/, '');

const JoinEventScreen = ({navigation}) => {
  // Initialisations ---------------------
  const eventsEndpoint = 'https://mark0s.com/geoquest/v1/api/events?key=16gv8f';
  const cachesByEvent = (eventID) => `https://mark0s.com/geoquest/v1/api/caches/events/${eventID}?key=16gv8f`;
  const playersEndpoint = 'https://mark0s.com/geoquest/v1/api/players?key=16gv8f';
  const [currentUser] = useCurrentUser();
  // State -------------------------------
  const [code, setCode] = useState('');
  // Handlers ----------------------------
  const handleJoin = async () => {
    if (!currentUser?.UserID) {
      Alert.alert('Login Required', 'Log in before joining an event.');
      return;
    }

    const inviteCode = normaliseJoinCode(code);
    if (!inviteCode) {
      Alert.alert('Missing Code', 'Enter an invite code to join an event.');
      return;
    }

    const eventsResponse = await API.get(eventsEndpoint);
    if (!eventsResponse.isSuccess) {
      Alert.alert('Join Failed', eventsResponse.message || 'Unable to load events right now.');
      return;
    }

    const events = normaliseList(eventsResponse.result);
    const matchedEvent = events.find((event) => {
      const eventInviteCode = ((event.EventInviteCode || event.EventID || event.EventId || event.id || '')).toString().trim().toUpperCase();
      const eventIDText = (event.EventID || event.EventId || event.id || '').toString().trim().toUpperCase();
      return eventInviteCode === inviteCode || eventIDText === inviteCode;
    });
    if (!matchedEvent) {
      Alert.alert('Not Found', 'No event found with that code. Use the event code shown on the event screen and try again.');
      return;
    }

    const eventID = matchedEvent.EventID || matchedEvent.EventId || matchedEvent.id;
    let eventCaches = [];
    if (eventID) {
      const cachesResponse = await API.get(cachesByEvent(eventID));
      if (cachesResponse.isSuccess) {
        eventCaches = normaliseList(cachesResponse.result);
      }

      const playersResponse = await API.get(playersEndpoint);
      const existingPlayers = normaliseList(playersResponse.result);
      const alreadyJoined = existingPlayers.some((player) => player.PlayerUserID === currentUser.UserID && player.PlayerEventID === eventID);

      if (!alreadyJoined) {
        await API.post(playersEndpoint, {
          PlayerUserID: currentUser.UserID,
          PlayerEventID: eventID,
        });
      }
    }

    const eventWithCaches = {
      ...matchedEvent,
      EventInviteCode: matchedEvent.EventInviteCode || String(eventID),
      EventCaches: eventCaches,
    };

    navigation.replace('EventCacheListScreen', {event: eventWithCaches, isHost: false});
  };

  const handleCancel = () => navigation.goBack();
  // View --------------------------------
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Event</Text>
          <Text style={styles.subtitle}>Enter the quest code shown on the event screen.</Text>
        </View>
        <Form
          onSubmit={handleJoin}
          onCancel={handleCancel}
          submitLabel="Join"
          submitIcon={<Icons.Submit />}
        >
          <Form.InputText
            label="Quest Code"
            value={code}
            onChange={(value) => setCode(value.toUpperCase())}
          />
        </Form>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
  },
  subtitle: {
    fontSize: 15,
    color: 'grey',
    textAlign: 'center',
  },
});

export default JoinEventScreen;
