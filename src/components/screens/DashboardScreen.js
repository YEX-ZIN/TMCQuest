import { Alert, Pressable, StyleSheet, Text, View, ScrollView, ActivityIndicator, ImageBackground } from 'react-native';
import { useState, useCallback } from 'react';
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

const getFindPlayerID = (find) => find.FindPlayerID || find.FindPlayerId || find.FindPlayer?.PlayerID || find.FindPlayer?.PlayerId;
const getCacheID = (cache) => cache?.CacheID || cache?.CacheId || cache?.id || null;
const getFindCacheID = (find) => find.FindCacheID || find.FindCacheId || find.FindCache?.CacheID || find.FindCache?.CacheId || null;
const getFindPoints = (find, cachePointsByID) => {
  const nestedPoints = Number(find.FindCache?.CachePoints || find.FindCache?.Cachepoints);
  if (Number.isFinite(nestedPoints)) return nestedPoints;
  const cacheID = getFindCacheID(find);
  if (cacheID === null || cacheID === undefined) return 0;
  return Number(cachePointsByID[String(cacheID)] || 0);
};

const getEventID = (event) => event?.EventID || event?.EventId || event?.id;

const formatQuestDate = (eventStart) => {
  if (!eventStart) return '-';
  const date = new Date(eventStart);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
};

const buildCachePointsByID = (allCaches) => allCaches.reduce((acc, cache) => {
  const cacheID = getCacheID(cache);
  if (cacheID === null || cacheID === undefined) return acc;
  acc[String(cacheID)] = Number(cache.CachePoints || cache.Cachepoints || 0);
  return acc;
}, {});

const buildHostedEvents = (allEvents, currentUserID) => allEvents
  .filter((event) => String(event.EventOwnerID) === String(currentUserID))
  .map((event) => ({ ...event, _role: 'host', _score: null, _playerID: null }));

const buildJoinedEntries = ({ allEvents, allPlayers, allFinds, currentUserID, cachePointsByID, hostedEvents }) => {
  const myPlayerRecords = allPlayers.filter((player) => String(player.PlayerUserID) === String(currentUserID));
  const hostedIDs = new Set(hostedEvents.map((event) => String(getEventID(event))));

  return myPlayerRecords
    .filter((player) => !hostedIDs.has(String(player.PlayerEventID)))
    .map((player) => {
      const event = allEvents.find((candidate) => String(getEventID(candidate)) === String(player.PlayerEventID));
      if (!event) return null;

      const score = allFinds
        .filter((find) => String(getFindPlayerID(find)) === String(player.PlayerID))
        .reduce((sum, find) => sum + getFindPoints(find, cachePointsByID), 0);

      const eventID = getEventID(event);
      const fallbackCode = event.EventIspublic
        ? encodeQuestCode(eventID)
        : API.geoQuest.key;

      return {
        ...event,
        EventInviteCode: event.EventInviteCode || fallbackCode,
        _role: 'player',
        _score: score,
        _playerID: player.PlayerID,
      };
    })
    .filter(Boolean);
};

const encodeQuestCode = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `${value ?? '-'}`;
  const mixed = (numeric * 1103515245 + 12345) >>> 0;
  return mixed.toString(36).slice(-6).padStart(6, '0').toLowerCase();
};

const AdventureCard = ({ icon, modeLabel, title, description, tags, buttonLabel, buttonIcon, onPress, styleButton, styleLabel }) => (
  <View style={styles.card}>
    <View style={styles.cardTopRow}>
      <View style={styles.cardIcon}>{icon}</View>
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>{modeLabel}</Text>
      </View>
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{description}</Text>
    <View style={styles.cardMetaRow}>
      {tags.map((tag) => (
        <View key={`${title}-${tag}`} style={styles.metaPill}>
          <Text style={styles.metaPillText}>{tag}</Text>
        </View>
      ))}
    </View>
    <Button
      label={buttonLabel}
      icon={buttonIcon}
      onClick={onPress}
      styleButton={styleButton}
      styleLabel={styleLabel}
    />
  </View>
);

const DashboardScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  const [currentUser, saveCurrentUser] = useCurrentUser();
  const [quests, setQuests] = useState([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const captainName = currentUser?.UserFirstname || currentUser?.UserUsername || 'Explorer';

  const loadQuests = useCallback(async () => {
    if (!currentUser?.UserID) {
      setQuests([]);
      setQuestsLoading(false);
      return;
    }

    setQuestsLoading(true);
    const [eventsRes, playersRes, findsRes, cachesRes] = await Promise.all([
      API.get(API.geoQuest.events()),
      API.get(API.geoQuest.players()),
      API.get(API.geoQuest.finds()),
      API.get(API.geoQuest.caches()),
    ]);

    const allEvents = normaliseList(eventsRes.result);
    const allPlayers = normaliseList(playersRes.result);
    const allFinds = normaliseList(findsRes.result);
    const allCaches = normaliseList(cachesRes.result);

    const cachePointsByID = buildCachePointsByID(allCaches);
    const hostedEvents = buildHostedEvents(allEvents, currentUser.UserID);
    const joinedEntries = buildJoinedEntries({
      allEvents,
      allPlayers,
      allFinds,
      currentUserID: currentUser.UserID,
      cachePointsByID,
      hostedEvents,
    });

    // Deduplicate and sort newest first
    const combined = [...hostedEvents, ...joinedEntries]
      .sort((a, b) => new Date(b.EventStart) - new Date(a.EventStart));

    setQuests(combined);
    setQuestsLoading(false);
  }, [currentUser?.UserID]);

  useFocusEffect(useCallback(() => { loadQuests(); }, [loadQuests]));

  const handleOpenQuest = (quest) => {
    const isHost = quest._role === 'host';
    const eventID = quest.EventID || quest.EventId || quest.id;
    navigation.navigate('EventCacheListScreen', {
      event: {
        ...quest,
        EventInviteCode: quest.EventInviteCode || encodeQuestCode(eventID),
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
    <ImageBackground
      source={require('../../assets/logo.png')}
      style={styles.screen}
      imageStyle={styles.backgroundLogo}
      resizeMode='cover'
      blurRadius={15}
    >
      <StatusBar style='light' />
      <View style={styles.overlay} />
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
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>QUEST COMMAND DECK</Text>
            </View>
            <Text style={styles.title}>TMCQuest</Text>
            <Text style={styles.subtitle}>Treasure routes, hidden caches, and leaderboard glory.</Text>
            <Text style={styles.captainLine}>Captain: {captainName}</Text>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <AdventureCard
            icon={<Icons.Map />}
            modeLabel='PRIVATE MODE'
            title='Create an Event'
            description='Set up a private treasure hunt for your group. Place caches, set a time window, and share an invite code.'
            tags={['Set time window', 'Share code', 'Track players']}
            buttonLabel='Create Event'
            buttonIcon={<Icons.Add />}
            onPress={handleCreateEvent}
            styleButton={styles.primaryButton}
            styleLabel={styles.primaryLabel}
          />

          <AdventureCard
            icon={<Icons.Key />}
            modeLabel='PLAYER MODE'
            title='Join an Event'
            description='Have an invite code? Jump into an existing hunt and compete on the leaderboard.'
            tags={['Enter code', 'Find caches', 'Earn points']}
            buttonLabel='Join Event'
            buttonIcon={<Icons.Submit />}
            onPress={handleJoinEvent}
            styleButton={styles.secondaryButton}
            styleLabel={styles.secondaryLabel}
          />

          <AdventureCard
            icon={<Icons.Map />}
            modeLabel='GLOBAL MODE'
            title='Public World'
            description='View all public caches on a shared map, navigate to them, and open the event to log discoveries.'
            tags={['Shared map', 'AR nearby', 'Public ranks']}
            buttonLabel='Explore Public Caches'
            buttonIcon={<Icons.Map color='#5c3b10' />}
            onPress={handlePublicWorld}
            styleButton={styles.tertiaryButton}
            styleLabel={styles.tertiaryLabel}
          />
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
                  {!!quest.EventDescription && (
                    <Text style={styles.questDescription}>{quest.EventDescription}</Text>
                  )}
                  <Text style={styles.questDate}>
                    {formatQuestDate(quest.EventStart)}
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d0a04',
  },
  backgroundLogo: {
    opacity: 0.35,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,7,3,0.72)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 76,
    paddingBottom: 28,
    gap: 12,
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  profileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#d6a34d',
    backgroundColor: 'rgba(38,26,10,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  header: {
    marginBottom: 2,
  },
  heroCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#bf8c38',
    backgroundColor: 'rgba(45,29,13,0.84)',
    gap: 6,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dfb86b',
    backgroundColor: 'rgba(212,168,67,0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: '#f2d18c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f0d080',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#d2b787',
    lineHeight: 20,
  },
  captainLine: {
    marginTop: 2,
    color: '#efcb84',
    fontSize: 12,
    fontWeight: '700',
  },
  cardsContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: 'rgba(246,231,194,0.96)',
    borderRadius: 14,
    padding: 20,
    gap: 9,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#c4903a',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    gap: 8,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f3e4c6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d2ac63',
    backgroundColor: '#f6ead0',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeText: {
    color: '#5c3b10',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f1b07',
  },
  cardDesc: {
    fontSize: 14,
    color: '#6b4e2a',
    lineHeight: 19,
  },
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  metaPill: {
    borderRadius: 999,
    backgroundColor: '#f0dfb8',
    borderWidth: 1,
    borderColor: '#d8b878',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    color: '#6b4a1b',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#c4903a',
    borderColor: '#f0d080',
    borderWidth: 1,
    flex: 0,
    marginTop: 8,
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: 12,
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
    marginTop: 8,
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: 12,
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
    marginTop: 8,
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: 12,
  },
  tertiaryLabel: {
    color: '#5c3b10',
    fontWeight: '700',
    fontSize: 14,
  },

  // --- Quest list ---
  questSection: {
    gap: 8,
    marginTop: 8,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(202,147,67,0.42)',
    backgroundColor: 'rgba(30,20,10,0.7)',
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
  questDescription: {
    fontSize: 13,
    color: '#5f4524',
    lineHeight: 18,
    fontWeight: '500',
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
