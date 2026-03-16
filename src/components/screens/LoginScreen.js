import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import API from '../API/API.js';
import useStore from '../store/useStore.js';
import Form from '../UI/Form.js';
import Icons from '../UI/Icons.js';

const LoginScreen = ({navigation}) => {
  // Initialisations ---------------------
  const loginEndpoint = 'https://softwarehub.uk/unibase/api/login';
  const loggedinUserKey = 'loggedinUser';
  // State -------------------------------
  const [credentials, setCredentials] = useState({email: '', password: ''});
  const [, saveLoggedinUser] = useStore(loggedinUserKey, null);
  // Handlers ----------------------------
  const handleChange = (field, value) => setCredentials({...credentials, [field]: value});

  const handleLogin = async () => {
    const response = await API.post(loginEndpoint, credentials);
    if (response.isSuccess) {
      await saveLoggedinUser(response.result);
      navigation.replace('Main');
    } else {
      Alert.alert('Login Failed', response.message);
    }
  };

  const handleCancel = () => navigation.replace('GetStarted');
  // View --------------------------------
  return (
    <View style={styles.screen}>
      <StatusBar style='light' />
      <View style={styles.container}>

        <View style={styles.textBlock}>
          <Text style={styles.title}>⚔️  Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue your quest</Text>
        </View>

        <View style={styles.card}>
          <Form
            onSubmit={handleLogin}
            onCancel={handleCancel}
            submitLabel="Login"
            submitIcon={<Icons.Submit />}
            submitButtonStyle={styles.loginButton}
            submitLabelStyle={styles.loginLabel}
            cancelButtonStyle={styles.cancelButton}
            cancelLabelStyle={styles.cancelLabel}
          >
            <Form.InputText
              label="Email"
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
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1a1205',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 30,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#c9a84c',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#9e8c6a',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a1f0a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#c9a84c',
    padding: 20,
  },
  loginButton: {
    backgroundColor: '#c9a84c',
    borderColor: '#a0802e',
  },
  loginLabel: {
    color: '#1a1205',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: '#c9a84c',
  },
  cancelLabel: {
    color: '#c9a84c',
  },
  inputLabel: {
    color: '#e8d5a3',
  },
  inputField: {
    backgroundColor: '#1a1205',
    borderColor: '#c9a84c',
    color: '#e8d5a3',
  },
});

export default LoginScreen;
