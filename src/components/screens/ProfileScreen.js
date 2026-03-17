import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Screen from '../layout/Screen';
import API from '../API/API';
import Icons from '../UI/Icons';
import { Button } from '../UI/Button';

const fallbackUser = {
  UserID: 1,
  UserFirstname: 'GeoQuest',
  UserLastname: 'Player',
  UserUsername: 'player1',
  UserPhone: 'N/A',
  UserImageURL: '',
};

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(fallbackUser);

  useEffect(() => {
    const loadUser = async () => {
      const response = await API.get('https://mark0s.com/geoquest/v1/api/users/1?key=16gv8f');
      if (!response.isSuccess) return;

      const payload = Array.isArray(response.result)
        ? response.result[0]
        : (response.result?.data?.[0] || response.result);

      if (payload) setUser({ ...fallbackUser, ...payload });
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
      },
    ]);
  };

  return (
    <Screen>
      <StatusBar style='light' />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroOrbOne} />
          <View style={styles.heroOrbTwo} />

          <View style={styles.avatarWrap}>
            <Icons.Profile size={70} color='black' />
          </View>

          <Text style={styles.name}>
            {user.UserFirstname} {user.UserLastname}
          </Text>
          <View style={styles.usernameChip}>
            <Text style={styles.username}>@{user.UserUsername || 'player'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value}>{user.UserID || '-'}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{user.UserPhone || 'N/A'}</Text>
          </View>
        </View>

        <Button
          label='Back to Dashboard'
          icon={<Icons.Map />}
          onClick={() => navigation.goBack()}
          styleButton={styles.backButton}
          styleLabel={styles.backLabel}
        />

        <Button
          label='Logout'
          icon={<Icons.Close />}
          onClick={handleLogout}
          styleButton={styles.logoutButton}
          styleLabel={styles.logoutLabel}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 12,
  },
  heroCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2a44',
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  heroOrbOne: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1d4ed8',
    opacity: 0.2,
  },
  heroOrbTwo: {
    position: 'absolute',
    bottom: -40,
    left: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#38bdf8',
    opacity: 0.18,
  },
  avatarWrap: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 30,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  usernameChip: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  username: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '600',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 34,
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  label: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    maxWidth: '65%',
    textAlign: 'right',
  },
  backButton: {
    width: '100%',
    backgroundColor: 'white',
    borderColor: '#0f172a',
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 50,
  },
  backLabel: {
    color: '#0f172a',
    fontWeight: '700',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#b91c1c',
    borderColor: '#b91c1c',
    borderRadius: 12,
    minHeight: 50,
  },
  logoutLabel: {
    color: 'white',
    fontWeight: '700',
  },
});

export default ProfileScreen;
