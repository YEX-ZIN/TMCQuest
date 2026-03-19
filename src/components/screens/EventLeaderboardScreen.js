import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../layout/Screen';
import Icons from '../UI/Icons';
import API from '../API/API';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const EventLeaderboardScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const {event} = route.params;
  const refreshKey = route.params?.refreshKey;
  // State -------------------------------
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);
  // Handlers ----------------------------
  // View --------------------------------
  useFocusEffect(
    useCallback(() => {
      const loadLeaderboard = async () => {
      const eventID = event.EventID || event.EventId || event.id;
      if (!eventID) {
        setRanked([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [playersResponse, findsResponse] = await Promise.all([
        API.get(API.geoQuest.playersByEvent(eventID)),
        API.get(API.geoQuest.findsByEvent(eventID)),
      ]);

      const players = normaliseList(playersResponse.result);
      const finds = normaliseList(findsResponse.result);

      const scoreByPlayer = finds.reduce((acc, find) => {
        const playerID = find.FindPlayerID || find.FindPlayer?.PlayerID;
        if (!playerID) return acc;
        acc[playerID] = (acc[playerID] || 0) + (find.FindCache?.CachePoints || 0);
        return acc;
      }, {});

      const rows = players
        .map((player) => ({
          PlayerID: player.PlayerID,
          UserID: player.PlayerUserID,
          UserName: player.PlayerUser
            ? `${player.PlayerUser.UserFirstname || ''} ${player.PlayerUser.UserLastname || ''}`.trim() || player.PlayerUser.UserUsername || 'Player'
            : 'Player',
          points: scoreByPlayer[player.PlayerID] || 0,
        }))
        .sort((a, b) => b.points - a.points);

      setRanked(rows);
      setLoading(false);
      };

      loadLeaderboard();
    }, [event, refreshKey]),
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
        ) : ranked.length === 0 ? (
          <Text style={styles.emptyText}>No participants yet.</Text>
        ) : (
          ranked.map((participant, index) => (
            <View key={participant.UserID} style={styles.row}>
              <Text style={[styles.rank, {color: medalColour(index)}]}>
                #{index + 1}
              </Text>
              <Text style={styles.name}>{participant.UserName}</Text>
              <Text style={styles.points}>{participant.points} pts</Text>
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
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default EventLeaderboardScreen;
