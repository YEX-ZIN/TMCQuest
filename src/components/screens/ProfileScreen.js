import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Screen from '../layout/Screen';
import API from '../API/API';
import Icons from '../UI/Icons';
import { Button } from '../UI/Button';
import useCurrentUser from '../store/useCurrentUser';

const fallbackUser = {
  UserID: null,
  UserFirstname: 'TMCQuest',
  UserLastname: 'Player',
  UserUsername: 'player1',
  UserPhone: 'N/A',
  UserImageURL: '',
};

const readUserPayload = (result) => {
  if (Array.isArray(result)) return result[0] || null;
  if (Array.isArray(result?.data)) return result.data[0] || null;
  return result || null;
};

const ProfileScreen = ({ navigation }) => {
  const [currentUser, saveCurrentUser] = useCurrentUser();
  const userID = currentUser?.UserID;
  const userGetEndpoint = `https://mark0s.com/geoquest/v1/api/users/${userID}?key=16gv8f`;
  const userPutEndpoint = `https://mark0s.com/geoquest/v1/api/users/${userID}?key=16gv8f`;

  const [user, setUser] = useState(fallbackUser);
  const [draft, setDraft] = useState(fallbackUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!userID) return;
      const response = await API.get(userGetEndpoint);
      if (!response.isSuccess) return;

      const payload = readUserPayload(response.result);
      if (!payload) return;

      const merged = { ...fallbackUser, ...payload };
      setUser(merged);
      setDraft(merged);
    };

    loadUser();
  }, [userGetEndpoint, userID]);

  const handleDraftChange = (field, value) => setDraft(prev => ({ ...prev, [field]: value }));

  const handleStartEdit = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setDraft(user);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!draft.UserFirstname.trim() || !draft.UserLastname.trim() || !draft.UserUsername.trim()) {
      Alert.alert('Missing Details', 'First name, last name, and username are required.');
      return;
    }

    setIsSaving(true);
    const payload = {
      ...user,
      UserFirstname: draft.UserFirstname.trim(),
      UserLastname: draft.UserLastname.trim(),
      UserUsername: draft.UserUsername.trim(),
      UserPhone: draft.UserPhone.trim(),
    };

    const response = await API.put(userPutEndpoint, payload);
    setIsSaving(false);

    if (!response.isSuccess) {
      Alert.alert('Save Failed', response.message || 'Could not update profile right now.');
      return;
    }

    setUser(payload);
    setDraft(payload);
    await saveCurrentUser(payload);
    setIsEditing(false);
    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await saveCurrentUser(null);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const renderValue = (field, fallback = '-') => (isEditing ? draft[field] : (user[field] || fallback));

  return (
    <Screen style={styles.screen} statusBarStyle='light'>
      <StatusBar style='light' />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroOrbOne} />
          <View style={styles.heroOrbTwo} />

          <View style={styles.avatarWrap}>
            <Icons.Profile size={70} color='black' />
          </View>

          <Text style={styles.name}>
            {renderValue('UserFirstname', '')} {renderValue('UserLastname', '')}
          </Text>
          <View style={styles.usernameChip}>
            <Text style={styles.username}>@{renderValue('UserUsername', 'player')}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            {!isEditing ? (
              <Button
                label='Edit'
                icon={<Icons.Edit />}
                onClick={handleStartEdit}
                styleButton={styles.editButton}
                styleLabel={styles.editLabel}
              />
            ) : null}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value}>{user.UserID || '-'}</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>First Name</Text>
            {isEditing ? (
              <TextInput
                value={draft.UserFirstname}
                onChangeText={(value) => handleDraftChange('UserFirstname', value)}
                style={styles.input}
                placeholder='First name'
                placeholderTextColor='#94a3b8'
              />
            ) : (
              <Text style={styles.valueLeft}>{user.UserFirstname || '-'}</Text>
            )}
          </View>

          <View style={styles.separator} />

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Last Name</Text>
            {isEditing ? (
              <TextInput
                value={draft.UserLastname}
                onChangeText={(value) => handleDraftChange('UserLastname', value)}
                style={styles.input}
                placeholder='Last name'
                placeholderTextColor='#94a3b8'
              />
            ) : (
              <Text style={styles.valueLeft}>{user.UserLastname || '-'}</Text>
            )}
          </View>

          <View style={styles.separator} />

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Username</Text>
            {isEditing ? (
              <TextInput
                value={draft.UserUsername}
                onChangeText={(value) => handleDraftChange('UserUsername', value)}
                style={styles.input}
                placeholder='Username'
                placeholderTextColor='#94a3b8'
                autoCapitalize='none'
              />
            ) : (
              <Text style={styles.valueLeft}>{user.UserUsername || '-'}</Text>
            )}
          </View>

          <View style={styles.separator} />

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Phone</Text>
            {isEditing ? (
              <TextInput
                value={draft.UserPhone}
                onChangeText={(value) => handleDraftChange('UserPhone', value)}
                style={styles.input}
                placeholder='Phone number'
                placeholderTextColor='#94a3b8'
                keyboardType='phone-pad'
              />
            ) : (
              <Text style={styles.valueLeft}>{user.UserPhone || 'N/A'}</Text>
            )}
          </View>
        </View>

        {isEditing ? (
          <View style={styles.actionRow}>
            <Button
              label='Cancel'
              icon={<Icons.Close />}
              onClick={handleCancelEdit}
              styleButton={styles.cancelEditButton}
              styleLabel={styles.cancelEditLabel}
            />
            <Button
              label={isSaving ? 'Saving...' : 'Save'}
              icon={<Icons.Submit />}
              onClick={isSaving ? () => {} : handleSave}
              styleButton={styles.saveButton}
              styleLabel={styles.saveLabel}
            />
          </View>
        ) : null}

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
  screen: {
    backgroundColor: '#0d0a04',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 110,
    paddingBottom: 28,
    gap: 12,
  },
  heroCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#261a0a',
    borderWidth: 1,
    borderColor: '#c4903a',
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
    backgroundColor: '#c4903a',
    opacity: 0.25,
  },
  heroOrbTwo: {
    position: 'absolute',
    bottom: -40,
    left: -18,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5a3a12',
    opacity: 0.35,
  },
  avatarWrap: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#f6ead0',
    borderWidth: 3,
    borderColor: '#d7b574',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 30,
    fontWeight: '700',
    color: '#f0d080',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  usernameChip: {
    marginTop: 8,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(196,144,58,0.2)',
    borderWidth: 1,
    borderColor: '#c4903a',
  },
  username: {
    fontSize: 14,
    color: '#f6e4bc',
    fontWeight: '600',
  },
  infoCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c4903a',
    backgroundColor: 'rgba(246,231,194,0.95)',
    padding: 16,
    gap: 8,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#7a5217',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  editButton: {
    flex: 0,
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderColor: '#caa45a',
    backgroundColor: '#f6ead0',
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c3b10',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 34,
  },
  fieldBlock: {
    gap: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#d6b573',
  },
  label: {
    fontSize: 14,
    color: '#6b4e2a',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f1b07',
    maxWidth: '65%',
    textAlign: 'right',
  },
  valueLeft: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f1b07',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0ab66',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2f1b07',
    backgroundColor: '#f8f1df',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelEditButton: {
    backgroundColor: '#f6ead0',
    borderColor: '#caa45a',
    borderWidth: 1.3,
    borderRadius: 12,
    minHeight: 48,
  },
  cancelEditLabel: {
    color: '#5c3b10',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#c4903a',
    borderColor: '#f0d080',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
  },
  saveLabel: {
    color: '#1a1105',
    fontWeight: '700',
  },
  backButton: {
    width: '100%',
    backgroundColor: '#f6ead0',
    borderColor: '#8a6224',
    borderWidth: 1.5,
    borderRadius: 12,
    minHeight: 50,
  },
  backLabel: {
    color: '#5c3b10',
    fontWeight: '700',
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#7f1d1d',
    borderColor: '#b45309',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 50,
  },
  logoutLabel: {
    color: 'white',
    fontWeight: '700',
  },
});

export default ProfileScreen;
