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

const isPublicEvent = (event) => {
  const value = event?.EventIspublic;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
  return false;
};

const PublicLeaderboardScreen = () => {
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadLeaderboard = async () => {
        setLoading(true);

        const [eventsResponse, playersResponse, findsResponse] = await Promise.all([
          API.get(API.geoQuest.events()),
          API.get(API.geoQuest.players()),
          API.get(API.geoQuest.finds()),
        ]);

        if (!eventsResponse.isSuccess || !playersResponse.isSuccess || !findsResponse.isSuccess) {
          setRanked([]);
          setLoading(false);
          return;
        }

        const events = normaliseList(eventsResponse.result);
        const players = normaliseList(playersResponse.result);
        const finds = normaliseList(findsResponse.result);

        const publicEventIDs = new Set(
          events
            .filter(isPublicEvent)
            .map((event) => String(event.EventID)),
        );

        const publicPlayers = players.filter((player) => publicEventIDs.has(String(player.PlayerEventID)));
        const publicPlayerIDs = new Set(publicPlayers.map((player) => String(player.PlayerID)));

        const pointsByPlayer = finds.reduce((acc, find) => {
          const playerID = String(find.FindPlayerID || find.FindPlayer?.PlayerID || '');
          if (!publicPlayerIDs.has(playerID)) return acc;
          const points = Number(find.FindCache?.CachePoints || 0);
          acc[playerID] = (acc[playerID] || 0) + points;
          return acc;
        }, {});

        const rowsByUser = publicPlayers.reduce((acc, player) => {
          const userID = String(player.PlayerUserID || player.PlayerUser?.UserID || '');
          if (!userID) return acc;

          const firstName = player.PlayerUser?.UserFirstname || '';
          const lastName = player.PlayerUser?.UserLastname || '';
          const username = player.PlayerUser?.UserUsername || `User ${userID}`;
          const displayName = `${firstName} ${lastName}`.trim() || username;

          if (!acc[userID]) {
            acc[userID] = {
              UserID: userID,
              UserName: displayName,
              points: 0,
              eventCount: 0,
            };
          }

          acc[userID].points += pointsByPlayer[String(player.PlayerID)] || 0;
          acc[userID].eventCount += 1;
          return acc;
        }, {});

        const rows = Object.values(rowsByUser)
          .sort((a, b) => b.points - a.points);

        setRanked(rows);
        setLoading(false);
      };

      loadLeaderboard();
    }, []),
  );

  const medalColour = (index) => {
    if (index === 0) return '#FFD700';
    if (index === 1) return '#C0C0C0';
    if (index === 2) return '#CD7F32';
    return '#2f1b07';
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icons.Leaderboard color='black' />
          <Text style={styles.title}>Public Leaderboard</Text>
        </View>
        <Text style={styles.subtitle}>Scores from all public events</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size='small' color='black' />
          </View>
        ) : ranked.length === 0 ? (
          <Text style={styles.emptyText}>No public leaderboard data yet.</Text>
        ) : (
          ranked.map((participant, index) => (
            <View key={participant.UserID} style={styles.row}>
              <Text style={[styles.rank, { color: medalColour(index) }]}>#{index + 1}</Text>
              <View style={styles.nameCol}>
                <Text style={styles.name}>{participant.UserName}</Text>
                <Text style={styles.meta}>{participant.eventCount} public events</Text>
              </View>
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
  subtitle: {
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
  nameCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    color: 'black',
  },
  meta: {
    fontSize: 12,
    color: '#6b7280',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default PublicLeaderboardScreen;
