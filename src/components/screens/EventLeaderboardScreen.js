import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../layout/Screen';
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
  const [expandedPlayerID, setExpandedPlayerID] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [evidenceModal, setEvidenceModal] = useState(false);
  const [evidenceByCache, setEvidenceByCache] = useState({});
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
    const [playersResponse, findsResponse, cachesResponse, allPlayersResponse, allFindsResponse, deactivationStore, evidenceMap] = await Promise.all([
      API.get(API.geoQuest.playersByEvent(eventID)),
      API.get(API.geoQuest.findsByEvent(eventID)),
      API.get(API.geoQuest.cachesByEvent(eventID)),
      API.get(API.geoQuest.players()),
      API.get(API.geoQuest.finds()),
      readDeactivationStore(),
      loadEvidenceMap(),
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

    const findsByPlayer = finds.reduce((acc, find) => {
      const playerID = getFindPlayerID(find);
      if (!playerID) return acc;
      const key = String(playerID);
      if (!acc[key]) acc[key] = [];
      acc[key].push(find);
      return acc;
    }, {});

    const rows = players
      .map((player) => {
        const playerID = getPlayerID(player);
        return {
          PlayerID: playerID,
          UserID: player.PlayerUserID,
          UserName: player.PlayerUser
            ? `${player.PlayerUser.UserFirstname || ''} ${player.PlayerUser.UserLastname || ''}`.trim() || player.PlayerUser.UserUsername || 'Player'
            : 'Player',
          points: scoreByPlayer[String(playerID)] || 0,
          isInactive: eventDeactivation[String(player.PlayerUserID)] === true,
          finds: findsByPlayer[String(playerID)] || [],
        };
      })
      .sort((a, b) => b.points - a.points);

    setEvidenceByCache(evidenceMap || {});
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

  const getFindImageURL = (find) => {
    const cacheID = getFindCacheID(find);
    // Check local evidence first (captured photos from device)
    const localEvidence = evidenceByCache[String(cacheID)];
    if (localEvidence?.uri) return localEvidence.uri;
    // Fall back to API Find image
    return find?.FindImageURL || find?.FindEvidenceURL || '';
  };

  const getCacheName = (find) => {
    return find?.FindCache?.CacheName || 'Treasure';
  };

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
            <View key={`${participant.UserID}-${participant.PlayerID}`}>
              <View style={[styles.row, participant.isInactive && styles.rowInactive]}>
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

              {participant.finds && participant.finds.length > 0 ? (
                <View style={styles.evidenceSection}>
                  <Pressable
                    onPress={() => setExpandedPlayerID(expandedPlayerID === participant.PlayerID ? null : participant.PlayerID)}
                    style={({pressed}) => [styles.evidenceHeader, pressed && styles.evidenceHeaderPressed]}
                  >
                    <Icons.Photo color='#666' size={14} />
                    <Text style={styles.evidenceHeaderText}>
                      {participant.finds.length} {participant.finds.length === 1 ? 'find' : 'finds'} with evidence
                    </Text>
                    <Text style={styles.evidenceToggle}>
                      {expandedPlayerID === participant.PlayerID ? '▼' : '▶'}
                    </Text>
                  </Pressable>

                  {expandedPlayerID === participant.PlayerID ? (
                    <View style={styles.evidenceThumbnails}>
                      {participant.finds.map((find, findIndex) => {
                        const imageURL = getFindImageURL(find);
                        const hasImage = imageURL && imageURL !== 'https://placehold.co/600x400/png';
                        return (
                          <View key={`${participant.PlayerID}-find-${findIndex}`} style={styles.evidenceThumbWrap}>
                            {hasImage ? (
                              <Pressable
                                onPress={() => {
                                  setSelectedEvidence({
                                    uri: imageURL,
                                    cacheName: getCacheName(find),
                                    playerName: participant.UserName,
                                  });
                                  setEvidenceModal(true);
                                }}
                              >
                                <Image
                                  source={{ uri: imageURL }}
                                  style={styles.evidenceThumb}
                                />
                              </Pressable>
                            ) : (
                              <View style={[styles.evidenceThumb, styles.evidencePlaceholder]}>
                                <Text style={styles.placeholderText}>No image</Text>
                              </View>
                            )}
                            <Text style={styles.evidenceCacheName}>{getCacheName(find)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={evidenceModal}
        transparent
        animationType='fade'
        onRequestClose={() => setEvidenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable
              onPress={() => setEvidenceModal(false)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
            {selectedEvidence?.uri ? (
              <Image
                source={{ uri: selectedEvidence.uri }}
                style={styles.modalImage}
                resizeMode='contain'
              />
            ) : null}
            <View style={styles.modalInfo}>
              {selectedEvidence?.cacheName ? (
                <Text style={styles.modalInfoLabel}>Cache: <Text style={styles.modalInfoValue}>{selectedEvidence.cacheName}</Text></Text>
              ) : null}
              {selectedEvidence?.playerName ? (
                <Text style={styles.modalInfoLabel}>Player: <Text style={styles.modalInfoValue}>{selectedEvidence.playerName}</Text></Text>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
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
  evidenceSection: {
    backgroundColor: 'rgba(100, 150, 200, 0.05)',
    borderBottomWidth: 1,
    borderColor: 'lightgray',
  },
  evidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  evidenceHeaderPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  evidenceHeaderText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  evidenceToggle: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  evidenceThumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  evidenceThumbWrap: {
    alignItems: 'center',
    width: '25%',
    gap: 4,
  },
  evidenceThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  evidencePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    fontWeight: '600',
  },
  evidenceCacheName: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: 12,
    backgroundColor: '#f0f0f0',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalImage: {
    width: '100%',
    height: 350,
    backgroundColor: '#f5f5f5',
  },
  modalInfo: {
    padding: 16,
    gap: 8,
    backgroundColor: '#fafafa',
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  modalInfoValue: {
    color: '#333',
    fontWeight: '700',
  },
});

export default EventLeaderboardScreen;
