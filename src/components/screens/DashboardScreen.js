import { Alert, Pressable, StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../UI/Button';
import Icons from '../UI/Icons';
import API from '../API/API';
import useCurrentUser from '../store/useCurrentUser';

const normaliseList = (r) => {
  if (!r) return [];
  if (Array.isArray(r)) return r;
  if (Array.isArray(r.data)) return r.data;
  if (Array.isArray(r.result)) return r.result;
  return [];
};

const DashboardScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  const [currentUser, saveCurrentUser] = useCurrentUser();
  const [quests, setQuests] = useState([]);
  const [questsLoading, setQuestsLoading] = useState(true);

  const loadQuests = useCallback(async () => {
    if (!currentUser?.UserID) {
      setQuests([]);
      setQuestsLoading(false);
      return;
    }

    setQuestsLoading(true);
    const [eventsRes, playersRes, findsRes] = await Promise.all([
      API.get(API.geoQuest.events()),
      API.get(API.geoQuest.players()),
      API.get(API.geoQuest.finds()),
    ]);

    const allEvents = normaliseList(eventsRes.result);
    const allPlayers = normaliseList(playersRes.result);
    const allFinds = normaliseList(findsRes.result);

    // Hosted events
    const hostedEvents = allEvents
      .filter(e => String(e.EventOwnerID) === String(currentUser.UserID))
      .map(e => ({ ...e, _role: 'host', _score: null, _playerID: null }));

    // Joined events (player records for this user, exclude events they also host)
    const myPlayerRecords = allPlayers.filter(p => String(p.PlayerUserID) === String(currentUser.UserID));
    const hostedIDs = new Set(hostedEvents.map(e => String(e.EventID)));
    const joinedEntries = myPlayerRecords
      .filter(p => !hostedIDs.has(String(p.PlayerEventID)))
      .map(p => {
        const event = allEvents.find(e => String(e.EventID) === String(p.PlayerEventID));
        if (!event) return null;
        // Sum points for finds made by this player
        const score = allFinds
          .filter(f => String(f.FindPlayerID) === String(p.PlayerID))
          .reduce((sum, f) => sum + (f.FindCache?.CachePoints || 0), 0);
        return { ...event, _role: 'player', _score: score, _playerID: p.PlayerID };
      })
      .filter(Boolean);

    // Deduplicate and sort newest first
    const combined = [...hostedEvents, ...joinedEntries]
      .sort((a, b) => new Date(b.EventStart) - new Date(a.EventStart));

    setQuests(combined);
    setQuestsLoading(false);
  }, [currentUser?.UserID]);

  useFocusEffect(useCallback(() => { loadQuests(); }, [loadQuests]));

  const handleOpenQuest = (quest) => {
    const isHost = quest._role === 'host';
    navigation.navigate('EventCacheListScreen', {
      event: {
        ...quest,
        EventInviteCode: quest.EventInviteCode || String(quest.EventID || ''),
      },
      isHost,
    });
  };

  const handleDeleteQuest = (quest) => {
    const isHost = quest._role === 'host';
    const title = isHost ? 'Delete Event' : 'Leave Event';
    const message = isHost
      ? `Delete "${quest.EventName}"? This cannot be undone.`
      : `Leave "${quest.EventName}"? Your progress will be lost.`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isHost ? 'Delete' : 'Leave',
        style: 'destructive',
        onPress: async () => {
          const endpoint = isHost
            ? API.geoQuest.events(quest.EventID)
            : API.geoQuest.players(quest._playerID);
          const response = await API.delete(endpoint);
          if (!response.isSuccess) {
            Alert.alert('Failed', response.message || 'Could not complete the action.');
            return;
          }
          setQuests(prev => prev.filter(q => q !== quest));
        },
      },
    ]);
  };

  // Handlers ----------------------------
  const handleCreateEvent = () => navigation.navigate('CreateEventScreen');
  const handleJoinEvent = () => navigation.navigate('JoinEventScreen');
  const handlePublicWorld = () => navigation.navigate('PublicCachesScreen');
  const handleProfile = () => {
    Alert.alert('Account', 'Choose an action', [
      {
        text: 'Profile',
        onPress: () => navigation.navigate('ProfileScreen'),
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await saveCurrentUser(null);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
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
      <StatusBar style='light' />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.profileIconWrap} onPress={handleProfile}>
            <Icons.Profile size={28} color='#f6e4bc' />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>TMCQuest</Text>
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

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Icons.Map />
            </View>
            <Text style={styles.cardTitle}>Public World</Text>
            <Text style={styles.cardDesc}>
              View all public caches on a shared map, navigate to them, and open the event to log discoveries.
            </Text>
            <Button
              label="Explore Public Caches"
              icon={<Icons.Map color='#5c3b10' />}
              onClick={handlePublicWorld}
              styleButton={styles.tertiaryButton}
              styleLabel={styles.tertiaryLabel}
            />
          </View>
        </View>

        {/* ── My Quests ── */}
        <View style={styles.questSection}>
          <View style={styles.questHeadRow}>
            <Text style={styles.questHeading}>My Quests</Text>
            <Pressable onPress={loadQuests} hitSlop={8}>
              <Icons.Submit size={16} color='#d4a843' />
            </Pressable>
          </View>

          {questsLoading ? (
            <View style={styles.questEmpty}>
              <ActivityIndicator size='small' color='#d4a843' />
            </View>
          ) : quests.length === 0 ? (
            <View style={styles.questEmpty}>
              <Text style={styles.questEmptyText}>No quests yet. Create or join one above.</Text>
            </View>
          ) : (
            quests.map((quest) => (
              <Pressable
                key={`${quest._role}-${quest.EventID}`}
                style={({pressed}) => [styles.questCard, pressed && styles.questCardPressed]}
                onPress={() => handleOpenQuest(quest)}
                onLongPress={() => handleDeleteQuest(quest)}
              >
                <View style={styles.questCardLeft}>
                  <Text style={styles.questName} numberOfLines={1}>{quest.EventName}</Text>
                  <Text style={styles.questDate}>
                    {quest.EventStart ? new Date(quest.EventStart).toLocaleDateString(undefined, {month: 'short', day: '2-digit', year: 'numeric'}) : '-'}
                  </Text>
                </View>
                <View style={styles.questCardRight}>
                  {quest._role === 'player' && quest._score !== null && (
                    <View style={styles.scorePill}>
                      <Icons.Leaderboard size={11} color='white' />
                      <Text style={styles.scoreText}>{quest._score} pts</Text>
                    </View>
                  )}
                  <View style={[styles.roleBadge, quest._role === 'host' ? styles.hostBadge : styles.playerBadge]}>
                    <Text style={[styles.roleText, quest._role === 'host' ? styles.hostText : styles.playerText]}>
                      {quest._role === 'host' ? 'Host' : 'Player'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d0a04',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 90,
    paddingBottom: 28,
    gap: 10,
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
    borderColor: '#c4903a',
    backgroundColor: '#261a0a',
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
    color: '#f0d080',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#b89a68',
  },
  cardsContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(246,231,194,0.95)',
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
    borderColor: '#c4903a',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f3e4c6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f1b07',
  },
  cardDesc: {
    fontSize: 14,
    color: '#6b4e2a',
    lineHeight: 20,
    marginBottom: 2,
  },
  primaryButton: {
    backgroundColor: '#c4903a',
    borderColor: '#f0d080',
    borderWidth: 1,
    flex: 0,
    marginTop: 6,
    borderRadius: 10,
    minHeight: 50,
  },
  primaryLabel: {
    color: '#1a1105',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: '#f6ead0',
    borderColor: '#8a6224',
    borderWidth: 1.5,
    flex: 0,
    marginTop: 6,
    borderRadius: 10,
    minHeight: 50,
  },
  secondaryLabel: {
    color: '#5c3b10',
    fontWeight: '600',
    fontSize: 15,
  },
  tertiaryButton: {
    backgroundColor: '#ecd9aa',
    borderColor: '#8a6224',
    borderWidth: 1.5,
    flex: 0,
    marginTop: 6,
    borderRadius: 10,
    minHeight: 50,
  },
  tertiaryLabel: {
    color: '#5c3b10',
    fontWeight: '700',
    fontSize: 14,
  },

  // --- Quest list ---
  questSection: {
    gap: 8,
    marginTop: 6,
  },
  questHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  questHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0d080',
  },
  questEmpty: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8a6224',
    backgroundColor: '#261a0a',
  },
  questEmptyText: {
    fontSize: 13,
    color: '#b89a68',
    textAlign: 'center',
  },
  questCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c4903a',
    backgroundColor: 'rgba(246,231,194,0.95)',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  questCardPressed: {
    backgroundColor: '#f1deb5',
  },
  questCardLeft: {
    flex: 1,
    gap: 3,
  },
  questName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2f1b07',
  },
  questDate: {
    fontSize: 12,
    color: '#6b4e2a',
  },
  questCardRight: {
    alignItems: 'flex-end',
    gap: 5,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#5a3a12',
  },
  scoreText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
  },
  roleBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  hostBadge: {
    backgroundColor: '#f6e8c9',
    borderWidth: 1,
    borderColor: '#d7b574',
  },
  playerBadge: {
    backgroundColor: '#f3dfb3',
    borderWidth: 1,
    borderColor: '#d2ac63',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  hostText: {
    color: '#5c3b10',
  },
  playerText: {
    color: '#7a5217',
  },
});

export default DashboardScreen;
