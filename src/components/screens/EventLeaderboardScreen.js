import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../layout/Screen';
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

const getID = (obj, ...fields) => {
  for (const field of fields) {
    if (obj?.[field] !== undefined && obj?.[field] !== null) return obj[field];
  }
  return null;
};

const getPlayerID = (obj) => getID(obj, 'PlayerID', 'PlayerId', 'id');
const getFindPlayerID = (find) => getID(find, 'FindPlayerID', 'FindPlayerId') || getPlayerID(find?.FindPlayer);
const getCacheID = (cache) => getID(cache, 'CacheID', 'CacheId', 'id');
const getFindCacheID = (find) => getID(find, 'FindCacheID', 'FindCacheId') || getCacheID(find?.FindCache);
const getEventID = (event) => event?.EventID || event?.EventId || event?.id;
const getCachePoints = (find, cachePointsByID) => {
  const nestedPoints = Number(find.FindCache?.CachePoints || find.FindCache?.Cachepoints);
  if (Number.isFinite(nestedPoints)) return nestedPoints;
  const cacheID = getFindCacheID(find);
  if (cacheID === null || cacheID === undefined) return 0;
  return Number(cachePointsByID[String(cacheID)] || 0);
};

const PLAYER_DEACTIVATION_STORE_KEY = 'geoquest_event_deactivated_players';

const readDeactivationStore = async () => {
  const recovered = await AsyncStorage.getItem(PLAYER_DEACTIVATION_STORE_KEY);
  if (!recovered) return {};
  const parsed = JSON.parse(recovered);
  return parsed && typeof parsed === 'object' ? parsed : {};
};

const writeDeactivationStore = async (store) => {
  await AsyncStorage.setItem(PLAYER_DEACTIVATION_STORE_KEY, JSON.stringify(store));
};

const EventLeaderboardScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const {event} = route.params;
  const refreshKey = route.params?.refreshKey;
  const [currentUser] = useCurrentUser();
  // State -------------------------------
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPlayerID, setBusyPlayerID] = useState(null);
  const eventID = getEventID(event);
  const eventOwnerID = event?.EventOwnerID || event?.EventOwner?.UserID;
  const isHost = route.params?.isHost === true || String(currentUser?.UserID) === String(eventOwnerID);

  const loadLeaderboard = useCallback(async () => {
    if (!eventID) {
      setRanked([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [playersResponse, findsResponse, cachesResponse, allPlayersResponse, allFindsResponse, deactivationStore] = await Promise.all([
      API.get(API.geoQuest.playersByEvent(eventID)),
      API.get(API.geoQuest.findsByEvent(eventID)),
      API.get(API.geoQuest.cachesByEvent(eventID)),
      API.get(API.geoQuest.players()),
      API.get(API.geoQuest.finds()),
      readDeactivationStore(),
    ]);

    const eventDeactivation = deactivationStore[String(eventID)] || {};
    const players = playersResponse.isSuccess
      ? normaliseList(playersResponse.result)
      : normaliseList(allPlayersResponse.result).filter(
        (player) => String(player.PlayerEventID) === String(eventID),
      );
    const finds = findsResponse.isSuccess
      ? normaliseList(findsResponse.result)
      : normaliseList(allFindsResponse.result).filter((find) => {
        const nestedEventID = getID(find?.FindPlayer?.PlayerEvent, 'EventID', 'EventId', 'id');
        const directEventID = getID(find, 'FindEventID', 'FindEventId', 'EventID', 'EventId');
        return String(nestedEventID || directEventID) === String(eventID);
      });
    const caches = normaliseList(cachesResponse.result);

    const cachePointsByID = caches.reduce((acc, cache) => {
      const cacheID = getCacheID(cache);
      if (cacheID === null || cacheID === undefined) return acc;
      acc[String(cacheID)] = Number(cache.CachePoints || cache.Cachepoints || 0);
      return acc;
    }, {});

    const scoreByPlayer = finds.reduce((acc, find) => {
      const playerID = getFindPlayerID(find);
      if (!playerID) return acc;
      const key = String(playerID);
      acc[key] = (acc[key] || 0) + getCachePoints(find, cachePointsByID);
      return acc;
    }, {});

    const rows = players
      .map((player) => ({
        PlayerID: getPlayerID(player),
        UserID: player.PlayerUserID,
        UserName: player.PlayerUser
          ? `${player.PlayerUser.UserFirstname || ''} ${player.PlayerUser.UserLastname || ''}`.trim() || player.PlayerUser.UserUsername || 'Player'
          : 'Player',
        points: scoreByPlayer[String(getPlayerID(player))] || 0,
        isInactive: eventDeactivation[String(player.PlayerUserID)] === true,
      }))
      .sort((a, b) => b.points - a.points);

    setRanked(rows);
    setLoading(false);
  }, [eventID]);

  const setPlayerInactiveState = useCallback(async (userID, inactive) => {
    const store = await readDeactivationStore();
    const eventKey = String(eventID);
    const eventDeactivation = { ...(store[eventKey] || {}) };

    if (inactive) eventDeactivation[String(userID)] = true;
    else delete eventDeactivation[String(userID)];

    store[eventKey] = eventDeactivation;
    await writeDeactivationStore(store);
  }, [eventID]);

  const handleToggleActive = useCallback((participant) => {
    const actionLabel = participant.isInactive ? 'Activate' : 'Deactivate';
    const nextInactive = !participant.isInactive;
    const message = participant.isInactive
      ? `Activate ${participant.UserName} for this event?`
      : `Deactivate ${participant.UserName} for this event?`;

    Alert.alert(`${actionLabel} Player`, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: actionLabel,
        onPress: async () => {
          setBusyPlayerID(participant.PlayerID);
          await setPlayerInactiveState(participant.UserID, nextInactive);
          setRanked((prev) => prev.map((item) => (
            item.PlayerID === participant.PlayerID
              ? { ...item, isInactive: nextInactive }
              : item
          )));
          setBusyPlayerID(null);
        },
      },
    ]);
  }, [setPlayerInactiveState]);

  const handleRemoveParticipant = useCallback((participant) => {
    Alert.alert('Remove Player', `Remove ${participant.UserName} from this event ranking?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusyPlayerID(participant.PlayerID);
          const response = await API.delete(API.geoQuest.players(participant.PlayerID));
          if (!response.isSuccess) {
            setBusyPlayerID(null);
            Alert.alert('Remove Failed', response.message || 'Could not remove this player right now.');
            return;
          }

          await setPlayerInactiveState(participant.UserID, false);
          setRanked((prev) => prev.filter((item) => item.PlayerID !== participant.PlayerID));
          setBusyPlayerID(null);
        },
      },
    ]);
  }, [setPlayerInactiveState]);

  const rankedRows = useMemo(() => {
    let activeRank = 0;
    return ranked.map((participant) => {
      if (participant.isInactive) {
        return { ...participant, rankLabel: 'OFF' };
      }

      activeRank += 1;
      return { ...participant, rankLabel: `#${activeRank}` };
    });
  }, [ranked]);

  // Handlers ----------------------------
  // View --------------------------------
  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [loadLeaderboard, refreshKey]),
  );

  const medalColour = (index) => {
    if (index === 0) return '#FFD700';
    if (index === 1) return '#C0C0C0';
    if (index === 2) return '#CD7F32';
    return 'black';
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icons.Leaderboard color='black' />
          <Text style={styles.title}>Leaderboard</Text>
        </View>
        <Text style={styles.eventName}>{event.EventName}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size='small' color='black' />
          </View>
        ) : rankedRows.length === 0 ? (
          <Text style={styles.emptyText}>No participants yet.</Text>
        ) : (
          rankedRows.map((participant, index) => (
            <View
              key={`${participant.UserID}-${participant.PlayerID}`}
              style={[styles.row, participant.isInactive && styles.rowInactive]}
            >
              <Text
                style={[
                  styles.rank,
                  participant.isInactive ? styles.rankOff : {color: medalColour(index)},
                ]}
              >
                {participant.rankLabel}
              </Text>
              <View style={styles.nameWrap}>
                <Text style={styles.name}>{participant.UserName}</Text>
                {participant.isInactive ? <Text style={styles.stateText}>Deactivated for this event</Text> : null}
              </View>
              <View style={styles.rightCol}>
                <Text style={styles.points}>{participant.points} pts</Text>
                {isHost && String(participant.UserID) !== String(currentUser?.UserID) ? (
                  <View style={styles.controlsRow}>
                    <Pressable
                      onPress={() => handleToggleActive(participant)}
                      disabled={busyPlayerID === participant.PlayerID}
                      style={({pressed}) => [styles.controlBtn, styles.toggleBtn, pressed && styles.controlBtnPressed]}
                    >
                      <Text style={styles.controlBtnText}>
                        {participant.isInactive ? 'Activate' : 'Deactivate'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemoveParticipant(participant)}
                      disabled={busyPlayerID === participant.PlayerID}
                      style={({pressed}) => [styles.controlBtn, styles.removeBtn, pressed && styles.controlBtnPressed]}
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
  },
  eventName: {
    fontSize: 15,
    color: 'grey',
  },
  emptyText: {
    textAlign: 'center',
    color: 'grey',
    fontSize: 15,
    marginTop: 40,
  },
  loadingWrap: {
    marginTop: 40,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: 'lightgray',
    gap: 12,
  },
  rowInactive: {
    opacity: 0.65,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 48,
  },
  rankOff: {
    color: '#666666',
    fontSize: 13,
  },
  nameWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    color: 'black',
  },
  stateText: {
    color: '#6d4c41',
    fontSize: 11,
    fontWeight: '600',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  controlBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleBtn: {
    borderColor: '#1b5e20',
    backgroundColor: '#e8f5e9',
  },
  removeBtn: {
    borderColor: '#b71c1c',
    backgroundColor: '#ffebee',
  },
  controlBtnPressed: {
    opacity: 0.75,
  },
  controlBtnText: {
    color: '#1b5e20',
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtnText: {
    color: '#b71c1c',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default EventLeaderboardScreen;
