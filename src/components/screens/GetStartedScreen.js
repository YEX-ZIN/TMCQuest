import { Image, StyleSheet, Text, View } from 'react-native';
import Screen from '../layout/Screen';
import { Button } from '../UI/Button';

const GetStartedScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  const handleGetStarted = () => navigation.replace('Login');
  // View --------------------------------
  return (
    <Screen>
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Manage your TMC quests</Text>
        <Button label="Get Started" onClick={handleGetStarted} styleButton={styles.startButton} styleLabel={styles.startLabel}/>
        <Text style={styles.signupText}>Sign Up</Text>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    paddingHorizontal: 30,
  },
  logo: {
    width: 280,
    height: 280,
  },
  subtitle: {
    fontSize: 18,
    color: 'grey',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: 'black',
    borderColor: 'black',
    paddingHorizontal: 20,
    flex: 0,
    minWidth: 180,
  },
  startLabel: {
    color: 'white',
    fontSize: 18,
  },
  signupText: {
    fontSize: 16,
    color: 'grey',
    textDecorationLine: 'underline',
  },
});

export default GetStartedScreen;
