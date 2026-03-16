import {NavigationContainer} from '@react-navigation/native';
import 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GetStartedScreen from './src/components/screens/GetStartedScreen';
import LoginScreen from './src/components/screens/LoginScreen';
import DashboardScreen from './src/components/screens/DashboardScreen';
import CreateEventScreen from './src/components/screens/CreateEventScreen';
import JoinEventScreen from './src/components/screens/JoinEventScreen';
import EventCacheListScreen from './src/components/screens/EventCacheListScreen';
import EventLeaderboardScreen from './src/components/screens/EventLeaderboardScreen';

const Stack = createNativeStackNavigator();

export const App=()=> {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name='GetStarted' component={GetStartedScreen}/>
        <Stack.Screen name='Login' component={LoginScreen} options={{title: 'Login', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen name='Dashboard' component={DashboardScreen}/>
        <Stack.Screen name='CreateEventScreen' component={CreateEventScreen} options={{headerShown: true, title: 'Create Event', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen name='JoinEventScreen' component={JoinEventScreen} options={{headerShown: true, title: 'Join Event', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen name='EventCacheListScreen' component={EventCacheListScreen} options={{headerShown: true, title: 'Event', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
        <Stack.Screen name='EventLeaderboardScreen' component={EventLeaderboardScreen} options={{headerShown: true, title: 'Leaderboard', headerStyle: {backgroundColor: 'black'}, headerTintColor: 'white'}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;