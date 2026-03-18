import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Form from '../UI/Form.js';
import Icons from '../UI/Icons.js';
import API from '../API/API.js';
import useCurrentUser from '../store/useCurrentUser.js';

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const LoginScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  const [credentials, setCredentials] = useState({email: '', password: ''});
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [, saveCurrentUser] = useCurrentUser();
  // Handlers ----------------------------
  const handleChange = (field, value) => setCredentials({...credentials, [field]: value});

  const handleLogin = async () => {
    const username = credentials.email.trim();
    const password = credentials.password;
    if (!username || !password) {
      Alert.alert('Missing Details', 'Enter your username and password.');
      return;
    }

    setIsLoggingIn(true);
    const response = await API.get(API.geoQuest.users());
    if (!response.isSuccess) {
      setIsLoggingIn(false);
      Alert.alert('Login Failed', response.message || 'Unable to reach the API right now.');
      return;
    }

    const users = normaliseList(response.result);
    const matchedUser = users.find((user) => {
      const matchesUsername = (user.UserUsername || '').toLowerCase() === username.toLowerCase();
      const matchesPassword = (user.UserPassword || '') === password;
      return matchesUsername && matchesPassword;
    });

    if (!matchedUser) {
      setIsLoggingIn(false);
      Alert.alert('Login Failed', 'Invalid username or password.');
      return;
    }

    await saveCurrentUser(matchedUser);
    setIsLoggingIn(false);
    navigation.replace('Dashboard');
  };

  const handleCancel = () => navigation.replace('GetStarted');
  const handleSignUp = () => navigation.navigate('SignUp');
  // View --------------------------------
  return (
    <View style={styles.screen}>
      <StatusBar style='light' />
      <View style={styles.container}>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowPrimary} />
          <View style={styles.heroGlowSecondary} />

          <View style={styles.brandPill}>
            <Icons.Map color='#f6e4bc' size={18} />
            <Text style={styles.brandPillText}>TMCQuest</Text>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your next campus quest.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Account Login</Text>
            <Text style={styles.cardSubtitle}>Use your TMCQuest username and password from the API dataset.</Text>
          </View>

          <Form
            onSubmit={handleLogin}
            onCancel={handleCancel}
            submitLabel={isLoggingIn ? 'Signing In...' : 'Login'}
            submitIcon={<Icons.Submit />}
            submitButtonStyle={styles.loginButton}
            submitLabelStyle={styles.loginLabel}
            cancelButtonStyle={styles.cancelButton}
            cancelLabelStyle={styles.cancelLabel}
          >
            <Form.InputText
              label="Username"
              value={credentials.email}
              onChange={(value) => handleChange('email', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />
            <Form.InputText
              label="Password"
              value={credentials.password}
              onChange={(value) => handleChange('password', value)}
              secureTextEntry={true}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />
          </Form>

          <View style={styles.helperBlock}>
            <Text style={styles.helperTitle}>Quick test account</Text>
            <Text style={styles.helperText}>Username: aishaahmed</Text>
            <Text style={styles.helperText}>Password: password</Text>
          </View>

          <Pressable onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Need an account? Create one</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d0a04',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 22,
    paddingVertical: 28,
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
  loginButton: {
    backgroundColor: '#c4903a',
    borderColor: '#f0d080',
    borderWidth: 1,
    borderRadius: 12,
  },
  loginLabel: {
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
  helperBlock: {
    borderRadius: 16,
    backgroundColor: '#f3e4c6',
    borderWidth: 1,
    borderColor: '#d8be86',
    padding: 14,
    gap: 4,
  },
  helperTitle: {
    fontSize: 13,
    color: '#5c3b10',
    fontWeight: '700',
    marginBottom: 2,
  },
  helperText: {
    fontSize: 13,
    color: '#6b4e2a',
  },
  signUpLink: {
    fontSize: 14,
    color: '#5c3b10',
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
