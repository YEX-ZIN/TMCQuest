import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import API from '../API/API.js';
import useStore from '../store/useStore.js';
import Screen from '../layout/Screen.js';
import Form from '../UI/Form.js';
import Icons from '../UI/Icons.js';

const loginEndpoint = 'https://softwarehub.uk/unibase/api/login';
const loggedinUserKey = 'loggedinUser';

const LoginScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  const [credentials, setCredentials] = useState({email: '', password: ''});
  const [loggedinUser, saveLoggedinUser] = useStore(loggedinUserKey, null);
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
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>
        <View style={styles.card}>
          <Form
            onSubmit={handleLogin}
            onCancel={handleCancel}
            submitLabel="Login"
            submitIcon={<Icons.Submit />}
          >
            <Form.InputText
              label="Email"
              value={credentials.email}
              onChange={(value) => handleChange('email', value)}
            />
            <Form.InputText
              label="Password"
              value={credentials.password}
              onChange={(value) => handleChange('password', value)}
              secureTextEntry={true}
            />
          </Form>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'grey',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'lightgray',
    padding: 20,
  },
});

export default LoginScreen;
