import {NavigationContainer} from '@react-navigation/native';
import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GetStartedScreen from './src/components/screens/GetStartedScreen';
import LoginScreen from './src/components/screens/LoginScreen';
import SignUpScreen from './src/components/screens/SignUpScreen';
import DashboardScreen from './src/components/screens/DashboardScreen';
import CreateEventScreen from './src/components/screens/CreateEventScreen';
import JoinEventScreen from './src/components/screens/JoinEventScreen';
import EventCacheListScreen from './src/components/screens/EventCacheListScreen';
import EventLeaderboardScreen from './src/components/screens/EventLeaderboardScreen';
import AddHuntLocationScreen from './src/components/screens/AddHuntLocationScreen';
import ProfileScreen from './src/components/screens/ProfileScreen';
import PublicCachesScreen from './src/components/screens/PublicCachesScreen';
import PublicLeaderboardScreen from './src/components/screens/PublicLeaderboardScreen';

const Stack = createNativeStackNavigator();

export const App=()=> {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name='GetStarted' component={GetStartedScreen}/>
        <Stack.Screen name='Login' component={LoginScreen} options={{title: 'Login', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen name='SignUp' component={SignUpScreen} options={{headerShown: true, title: '', headerTransparent: true, headerTintColor: 'white', headerShadowVisible: false}}/>
        <Stack.Screen name='Dashboard' component={DashboardScreen}/>
        <Stack.Screen name='ProfileScreen' component={ProfileScreen} options={{headerShown: true, title: 'Profile', headerTransparent: true, headerTintColor: 'white', headerShadowVisible: false}}/>
        <Stack.Screen name='CreateEventScreen' component={CreateEventScreen} options={{headerShown: true, title: 'Create Event', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen name='JoinEventScreen' component={JoinEventScreen} options={{headerShown: true, title: 'Join Event', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen
          name='PublicCachesScreen'
          component={PublicCachesScreen}
          options={{headerShown: true, title: 'Public Caches', headerTransparent: true, headerTintColor: 'white', headerShadowVisible: false}}
        />
        <Stack.Screen name='PublicLeaderboardScreen' component={PublicLeaderboardScreen} options={{headerShown: true, title: 'Public Leaderboard', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen
          name='EventCacheListScreen'
          component={EventCacheListScreen}
          options={{
            headerShown: true,
            title: 'Event',
            headerTransparent: true,
            headerTintColor: 'white',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name='AddHuntLocationScreen' component={AddHuntLocationScreen} options={{headerShown: true, title: 'Add Hunt Location', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen name='EventLeaderboardScreen' component={EventLeaderboardScreen} options={{headerShown: true, title: 'Leaderboard', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;