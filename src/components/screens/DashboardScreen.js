import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../UI/Button';
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
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ TMCQuest</Text>
        <Text style={styles.subtitle}>Discover • Compete • Conquer</Text>
        <View style={styles.decorativeLine} />
      </View>

      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.cardCreateBg]}>
          <View style={[styles.cardIcon, styles.cardIconCreate]}>
            <Text style={styles.cardIconText}>🗺️</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Create an Event</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>🎯 Design your hunt</Text>
              <Text style={styles.infoText}>Place caches and set time</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>👥 Share with friends</Text>
              <Text style={styles.infoText}>Invite via unique code</Text>
            </View>
          </View>
          <Button
            label="Create Event"
            icon={<Icons.Add />}
            onClick={handleCreateEvent}
            styleButton={styles.primaryButton}
            styleLabel={styles.primaryLabel}
          />
        </View>

        <View style={[styles.card, styles.cardJoinBg]}>
          <View style={[styles.cardIcon, styles.cardIconJoin]}>
            <Text style={styles.cardIconText}>🔑</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Join an Event</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>🎫 Enter your code</Text>
              <Text style={styles.infoText}>Jump into existing hunts</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>🏆 Compete & earn</Text>
              <Text style={styles.infoText}>Climb the leaderboard</Text>
            </View>
          </View>
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
    backgroundColor: '#0f1419',
    paddingHorizontal: 12,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
  },
  subtitle: {
    fontSize: 12,
    color: '#b0b8c1',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  decorativeLine: {
    width: 40,
    height: 3,
    backgroundColor: '#ff6b35',
    marginTop: 3,
    borderRadius: 1.5,
  },
  cardsContainer: {
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
  },
  cardCreateBg: {
    backgroundColor: '#1a2a3a',
    borderColor: '#ff6b35',
  },
  cardJoinBg: {
    backgroundColor: '#1a2a3a',
    borderColor: '#00d4ff',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconCreate: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  cardIconJoin: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
  },
  cardIconText: {
    fontSize: 26,
  },
  cardContent: {
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 2.5,
  },
  cardCreateBg: {
    borderLeftColor: '#ff6b35',
  },
  cardJoinBg: {
    borderLeftColor: '#00d4ff',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ff6b35',
    marginBottom: 1,
  },
  infoText: {
    fontSize: 11,
    color: '#d0d8e0',
    lineHeight: 14,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    borderWidth: 1,
    flex: 0,
    marginTop: 8,
    borderRadius: 8,
  },
  primaryLabel: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#00d4ff',
    borderWidth: 2,
    flex: 0,
    marginTop: 8,
    borderRadius: 8,
  },
  secondaryLabel: {
    color: '#00d4ff',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default DashboardScreen;
