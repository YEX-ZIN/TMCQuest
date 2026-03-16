import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../layout/Screen';
import Icons from '../UI/Icons';

const EventLeaderboardScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const {event} = route.params;
  // State -------------------------------
  // Handlers ----------------------------
  // View --------------------------------
  const ranked = [...(event.EventParticipants || [])].sort((a, b) => b.points - a.points);

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
        {ranked.length === 0 ? (
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
