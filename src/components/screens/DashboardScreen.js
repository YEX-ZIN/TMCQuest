import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button, ButtonTray } from '../UI/Button';
import Icons from '../UI/Icons';

const DashboardScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  const handleCreateEvent = () => navigation.navigate('CreateEventScreen');
  const handleJoinEvent = () => navigation.navigate('JoinEventScreen');
  // View --------------------------------
  return (
    <View style={styles.screen}>
      <StatusBar style='dark' />
      <View style={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>⚔️ GeoQuest</Text>
          <Text style={styles.subtitle}>Choose your adventure</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🗺️ Create an Event</Text>
          <Text style={styles.cardDesc}>
            Set up a private treasure hunt for your group. Place caches, set a time window, and share an invite code.
          </Text>
          <Button
            label="Create Event"
            icon={<Icons.Add />}
            onClick={handleCreateEvent}
            styleButton={styles.primaryButton}
            styleLabel={styles.primaryLabel}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Join an Event</Text>
          <Text style={styles.cardDesc}>
            Have an invite code? Jump into an existing hunt and compete on the leaderboard.
          </Text>
          <Button
            label="Join Event"
            icon={<Icons.Submit />}
            onClick={handleJoinEvent}
            styleButton={styles.secondaryButton}
            styleLabel={styles.secondaryLabel}
          />
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'grey',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'black',
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  cardDesc: {
    fontSize: 14,
    color: 'grey',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  primaryLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: 'black',
  },
  secondaryLabel: {
    color: 'black',
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
