import { Image, StyleSheet, Text, View } from 'react-native';
import { Button } from '../UI/Button';
import { StatusBar } from 'expo-status-bar';

const GetStartedScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  const handleGetStarted = () => navigation.replace('Login');
  // View --------------------------------
  return (
    <View style={styles.screen}>
      <StatusBar style='dark' />
      <View style={styles.container}>

        <View style={styles.logoFrame}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>TMCQuest</Text>
            <Text style={styles.tagline}>Your quest begins here</Text>
          <Text style={styles.subtitle}>Explore modules, discover knowledge,{'\n'}and conquer your academic journey.</Text>
        </View>

        <Button
          label="Begin Quest"
          onClick={handleGetStarted}
          styleButton={styles.startButton}
          styleLabel={styles.startLabel}
        />

        <Text style={styles.signupText}>New adventurer? Sign Up</Text>

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
    alignItems: 'center',
    gap: 28,
    paddingHorizontal: 30,
  },
  logoFrame: {
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'black',
    padding: 8,
    backgroundColor: 'white',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 12,
  },
  logo: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'black',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 15,
    color: 'black',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: 'grey',
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: 'black',
    borderColor: 'black',
    paddingHorizontal: 20,
    flex: 0,
    minWidth: 200,
  },
  startLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupText: {
    fontSize: 15,
    color: 'black',
    textDecorationLine: 'underline',
  },
});

export default GetStartedScreen;
