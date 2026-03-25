import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Form from '../UI/Form';
import Icons from '../UI/Icons';
import API from '../API/API';
import useCurrentUser from '../store/useCurrentUser';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const DEFAULT_PROFILE_IMAGE_URL = 'https://placehold.co/300x300/png';
const onlyDigits = (value) => `${value || ''}`.replace(/\D/g, '');
const toApiPhoneFallback = (digits) => {
  if (digits.length === 11 && digits.startsWith('0')) return `+44${digits.slice(1)}`;
  if (digits.length === 10) return `+44${digits}`;
  return digits;
};
const readCreatedUserID = (result) => {
  if (!result) return null;
  if (Array.isArray(result)) return readCreatedUserID(result[0]);
  if (typeof result === 'number' || typeof result === 'string') return result;
  return result.UserID || result.UserId || result.id || result.insertId || result.InsertId || null;
};

const resolveUserByUsername = async (username) => {
  const response = await API.get(API.geoQuest.users());
  if (!response.isSuccess) return null;

  const users = normaliseList(response.result);
  const matched = users
    .filter((item) => (item.UserUsername || '').toLowerCase() === username.toLowerCase())
    .sort((a, b) => Number(b.UserID || 0) - Number(a.UserID || 0))[0];

  return matched || null;
};

const SignUpScreen = ({navigation}) => {
  const [, saveCurrentUser] = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    UserFirstname: '',
    UserLastname: '',
    UserPhone: '',
    UserUsername: '',
    UserPassword: '',
    UserImageURL: '',
  });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSignUp = async () => {
    const firstName = form.UserFirstname.trim();
    const lastName = form.UserLastname.trim();
    const phone = form.UserPhone.trim();
    const phoneDigits = onlyDigits(phone);
    const username = form.UserUsername.trim();
    const password = form.UserPassword.trim();
    const imageURL = form.UserImageURL.trim();

    if (!firstName || !lastName || !phone || !username || !password) {
      Alert.alert('Missing Details', 'Complete all required fields before signing up.');
      return;
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      Alert.alert('Invalid Phone', 'Phone number must contain 10 or 11 digits.');
      return;
    }

    setIsSubmitting(true);

    const usersResponse = await API.get(API.geoQuest.users());
    if (!usersResponse.isSuccess) {
      setIsSubmitting(false);
      Alert.alert('Sign Up Failed', usersResponse.message || 'Could not reach the API.');
      return;
    }

    const existingUsers = normaliseList(usersResponse.result);
    const usernameTaken = existingUsers.some((user) => (user.UserUsername || '').toLowerCase() === username.toLowerCase());
    if (usernameTaken) {
      setIsSubmitting(false);
      Alert.alert('Username Taken', 'Choose a different username.');
      return;
    }

    const newUser = {
      UserFirstname: firstName,
      UserLastname: lastName,
      UserPhone: phone,
      UserUsername: username,
      UserPassword: password,
      UserLatitude: 0,
      UserLongitude: 0,
      UserTimestamp: Date.now(),
      UserImageURL: imageURL || DEFAULT_PROFILE_IMAGE_URL,
    };

    let createResponse = await API.post(API.geoQuest.users(), newUser);

    const phoneLengthError = (createResponse.message || '').toLowerCase().includes('userphone')
      && (createResponse.message || '').toLowerCase().includes('at least 12');

    if (!createResponse.isSuccess && phoneLengthError) {
      const retryPayload = {
        ...newUser,
        UserPhone: toApiPhoneFallback(phoneDigits),
      };
      createResponse = await API.post(API.geoQuest.users(), retryPayload);
      if (createResponse.isSuccess) {
        newUser.UserPhone = retryPayload.UserPhone;
      }
    }

    if (!createResponse.isSuccess) {
      setIsSubmitting(false);
      Alert.alert('Sign Up Failed', createResponse.message || 'Could not create your account.');
      return;
    }

    const createdResult = createResponse.result;
    const createdUserID = readCreatedUserID(createdResult);
    let createdUser = {
      ...newUser,
      UserID: createdUserID,
    };

    const resolvedUser = await resolveUserByUsername(username);
    if (resolvedUser) {
      createdUser = {
        ...createdUser,
        ...resolvedUser,
      };
    }

    await saveCurrentUser(createdUser);
    setIsSubmitting(false);
    navigation.replace('Dashboard');
  };

  const handleCancel = () => navigation.goBack();

  return (
    <View style={styles.screen}>
      <StatusBar style='light' />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowPrimary} />
          <View style={styles.heroGlowSecondary} />

          <View style={styles.brandPill}>
            <Icons.Map color='#f6e4bc' size={18} />
            <Text style={styles.brandPillText}>TMCQuest</Text>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Set up your TMCQuest profile and start building or joining quests.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sign Up</Text>
            <Text style={styles.cardSubtitle}>Your account will be created directly in the API and signed in automatically.</Text>
          </View>

          <Form
            onSubmit={handleSignUp}
            onCancel={handleCancel}
            submitLabel={isSubmitting ? 'Creating...' : 'Create Account'}
            submitIcon={<Icons.Add />}
            submitButtonStyle={styles.primaryButton}
            submitLabelStyle={styles.primaryLabel}
            cancelButtonStyle={styles.cancelButton}
            cancelLabelStyle={styles.cancelLabel}
          >
            <Form.InputText
              label='First Name'
              value={form.UserFirstname}
              onChange={(value) => handleChange('UserFirstname', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />
            <Form.InputText
              label='Last Name'
              value={form.UserLastname}
              onChange={(value) => handleChange('UserLastname', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />
            <Form.InputText
              label='Phone'
              value={form.UserPhone}
              onChange={(value) => handleChange('UserPhone', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />
            <Form.InputText
              label='Username'
              value={form.UserUsername}
              onChange={(value) => handleChange('UserUsername', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
              autoCapitalize='none'
              autoCorrect={false}
            />
            <Form.InputText
              label='Password'
              value={form.UserPassword}
              onChange={(value) => handleChange('UserPassword', value)}
              secureTextEntry={true}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
              autoCapitalize='none'
              autoCorrect={false}
            />
            <Form.InputText
              label='Profile Image URL (optional)'
              value={form.UserImageURL}
              onChange={(value) => handleChange('UserImageURL', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />
          </Form>
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
  container: {
    paddingHorizontal: 22,
    paddingTop: 110,
    paddingBottom: 28,
    gap: 18,
  },
  heroCard: {
    borderRadius: 26,
    backgroundColor: '#261a0a',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
    gap: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 7,
  },
  heroGlowPrimary: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -48,
    right: -40,
    backgroundColor: '#d4a843',
    opacity: 0.2,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -30,
    left: -15,
    backgroundColor: '#5a3a12',
    opacity: 0.35,
  },
  brandPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(212,168,67,0.16)',
    borderWidth: 1,
    borderColor: '#c4903a',
  },
  brandPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f6e4bc',
    letterSpacing: 0.5,
  },
  textBlock: {
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f0d080',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#d8bc87',
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(246,231,194,0.95)',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#c4903a',
    padding: 20,
    shadowColor: '#d4a843',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2f1b07',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b4e2a',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#c4903a',
    borderColor: '#f0d080',
    borderWidth: 1,
    borderRadius: 12,
  },
  primaryLabel: {
    color: '#1a1105',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#f6ead0',
    borderColor: '#caa45a',
    borderRadius: 12,
  },
  cancelLabel: {
    color: '#5c3b10',
    fontWeight: '600',
  },
  inputLabel: {
    color: '#5c3b10',
    fontWeight: '600',
  },
  inputField: {
    backgroundColor: '#f8f1df',
    borderColor: '#d8be86',
    color: '#2f1b07',
    borderRadius: 12,
  },
});

export default SignUpScreen;