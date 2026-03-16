import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Form from '../UI/Form.js';
import Icons from '../UI/Icons.js';

const LoginScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  const [credentials, setCredentials] = useState({email: '', password: ''});
  // Handlers ----------------------------
  const handleChange = (field, value) => setCredentials({...credentials, [field]: value});

  const handleLogin = () => navigation.replace('Dashboard');

  const handleCancel = () => navigation.replace('GetStarted');
  // View --------------------------------
  return (
    <View style={styles.screen}>
      <StatusBar style='dark' />
      <View style={styles.container}>

        <View style={styles.textBlock}>
          <Text style={styles.title}>Welcome Back</Text>
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
    backgroundColor: 'white',
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
    color: 'black',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: 'grey',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'black',
    padding: 20,
  },
  loginButton: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  loginLabel: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: 'black',
  },
  cancelLabel: {
    color: 'black',
  },
  inputLabel: {
    color: 'grey',
  },
  inputField: {
    backgroundColor: 'white',
    borderColor: 'lightgray',
    color: 'black',
  },
});

export default LoginScreen;
