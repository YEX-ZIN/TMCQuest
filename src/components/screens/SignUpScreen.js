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
    const username = form.UserUsername.trim();
    const password = form.UserPassword;

    if (!firstName || !lastName || !phone || !username || !password) {
      Alert.alert('Missing Details', 'Complete all required fields before signing up.');
      return;
    }

    setIsSubmitting(true);

    const usersResponse = await API.get('https://mark0s.com/geoquest/v1/api/users?key=16gv8f');
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
      UserImageURL: form.UserImageURL.trim(),
    };

    const createResponse = await API.post('https://mark0s.com/geoquest/v1/api/users?key=16gv8f', newUser);
    if (!createResponse.isSuccess) {
      setIsSubmitting(false);
      Alert.alert('Sign Up Failed', createResponse.message || 'Could not create your account.');
      return;
    }

    const createdResult = createResponse.result;
    const createdUserID = createdResult?.UserID || createdResult?.id || createdResult?.insertId || createdResult?.InsertId || null;
    const createdUser = {
      ...newUser,
      UserID: createdUserID,
    };

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
            <Icons.Map color='white' size={18} />
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
            />
            <Form.InputText
              label='Password'
              value={form.UserPassword}
              onChange={(value) => handleChange('UserPassword', value)}
              secureTextEntry={true}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
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
    backgroundColor: '#eaf1f8',
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 118,
    paddingBottom: 28,
    gap: 18,
  },
  heroCard: {
    borderRadius: 26,
    backgroundColor: '#0f172a',
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
    backgroundColor: '#2563eb',
    opacity: 0.28,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -30,
    left: -15,
    backgroundColor: '#22d3ee',
    opacity: 0.18,
  },
  brandPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  brandPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  textBlock: {
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#dbe3ec',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
    borderRadius: 12,
  },
  primaryLabel: {
    color: 'white',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 12,
  },
  cancelLabel: {
    color: '#334155',
    fontWeight: '600',
  },
  inputLabel: {
    color: '#475569',
    fontWeight: '600',
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderColor: '#d7e0ea',
    color: '#0f172a',
    borderRadius: 12,
  },
});

export default SignUpScreen;