import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../UI/Button';
import { StatusBar } from 'expo-status-bar';

const GetStartedScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  const handleGetStarted = () => navigation.replace('Login');
  const handleSignUp = () => navigation.navigate('SignUp');
  // View --------------------------------
  return (
    <ImageBackground
      source={require('../../assets/logo.png')}
      style={styles.screen}
      imageStyle={styles.backgroundLogo}
      resizeMode='cover'
      blurRadius={18}
    >
      <StatusBar style='light' />
      <View style={styles.overlay} />
      <View style={styles.container}>

        {/* Floating logo above card */}
        <View style={styles.logoRing}>
          <Image source={require('../../assets/logo.png')} style={styles.logoThumb} resizeMode='cover' />
        </View>

        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✦ TREASURE HUNT MODE ✦</Text>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title}>TMCQuest</Text>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerIcon}>⚓</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.tagline}>Set sail for hidden knowledge</Text>
            <Text style={styles.subtitle}>
              Follow your map through modules, uncover clues,{'\n'}and claim your academic treasure.
            </Text>
          </View>

          <Button
            label="⚔  Start Treasure Hunt"
            onClick={handleGetStarted}
            styleButton={styles.startButton}
            styleLabel={styles.startLabel}
          />

          <Pressable onPress={handleSignUp}>
            <Text style={styles.signupText}>New explorer? Join the crew</Text>
          </Pressable>
        </View>

      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d0a04',
  },
  backgroundLogo: {
    opacity: 0.55,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,6,2,0.62)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  logoRing: {
    width: 110,
    height: 110,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#d4a843',
    backgroundColor: '#1a1105',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d4a843',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 18,
    zIndex: 2,
    marginBottom: -30,
  },
  logoThumb: {
    width: 90,
    height: 90,
    borderRadius: 22,
  },
  card: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: 'rgba(38,26,10,0.92)',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#c4903a',
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 20,
    shadowColor: '#d4a843',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 16,
  },
  badge: {
    backgroundColor: '#c4903a',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  badgeText: {
    color: '#1a1105',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  textBlock: {
    alignItems: 'center',
    gap: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '70%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c4903a',
    opacity: 0.6,
  },
  dividerIcon: {
    fontSize: 14,
    color: '#c4903a',
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#f0d080',
    letterSpacing: 1,
    textShadowColor: 'rgba(200,140,30,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '600',
    color: '#e8c87a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#b89a68',
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#c4903a',
    borderColor: '#f0d080',
    borderWidth: 1,
    paddingHorizontal: 22,
    minHeight: 56,
    flex: 0,
    minWidth: 260,
    borderRadius: 12,
    shadowColor: '#f0d080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startLabel: {
    color: '#1a1105',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signupText: {
    fontSize: 14,
    color: '#c4903a',
    textDecorationLine: 'underline',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default GetStartedScreen;
