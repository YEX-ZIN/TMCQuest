import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../UI/Button';
import Icons from '../UI/Icons';

const DashboardScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  const handleCreateEvent = () => navigation.navigate('CreateEventScreen');
  const handleJoinEvent = () => navigation.navigate('JoinEventScreen');
  const handleProfile = () => {
    Alert.alert('Account', 'Choose an action', [
      {
        text: 'Profile',
        onPress: () => navigation.navigate('ProfileScreen'),
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };
  // View --------------------------------
  return (
    <View style={styles.screen}>
      <StatusBar style='dark' />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.profileIconWrap} onPress={handleProfile}>
            <Icons.Profile size={28} color='black' />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>GeoQuest</Text>
          <Text style={styles.subtitle}>Choose your adventure</Text>
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Icons.Map />
            </View>
            <Text style={styles.cardTitle}>Create an Event</Text>
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
            <View style={styles.cardIcon}>
              <Icons.Key />
            </View>
            <Text style={styles.cardTitle}>Join an Event</Text>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingVertical: 28,
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'grey',
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 20,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f4f4f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
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
    marginBottom: 2,
  },
  primaryButton: {
    backgroundColor: 'black',
    borderColor: 'black',
    flex: 0,
    marginTop: 6,
    borderRadius: 10,
    minHeight: 50,
  },
  primaryLabel: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderColor: 'black',
    borderWidth: 1.5,
    flex: 0,
    marginTop: 6,
    borderRadius: 10,
    minHeight: 50,
  },
  secondaryLabel: {
    color: 'black',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default DashboardScreen;
