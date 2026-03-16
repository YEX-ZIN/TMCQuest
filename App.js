import {NavigationContainer} from '@react-navigation/native';
import 'react-native-gesture-handler';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ModuleListScreen from './src/components/screens/ModuleListScreen';
import ModuleAddScreen from './src/components/screens/ModuleAddScreen';
import ModuleViewScreen from './src/components/screens/ModuleViewScreen';
import ModuleModifyScreen from './src/components/screens/ModuleModifyScreen';
import UserListScreen from './src/components/screens/UserListScreen';
import UserAddScreen from './src/components/screens/UserAddScreen';
import UserViewScreen from './src/components/screens/UserViewScreen';
import UserModifyScreen from './src/components/screens/UserModifyScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

export const App=()=> {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName = 'Modules' > 
        <Drawer.Screen name = 'Modules' component ={ModuleStack}/>
        <Drawer.Screen name = 'User' component ={UserStack}/>
      </Drawer.Navigator> 
    </NavigationContainer>
  );
};

function ModuleStack(){

  return (
<Stack.Navigator
      initialRouteName='ModuleListScreen'
      screenOptions={{
        headerStyle: {backgroundColor: 'black'},
        headerTintColor: 'white',
      }
    }
      >
        <Stack.Screen
        name='ModuleListScreen'
        component={ModuleListScreen}
        options={{title: 'List Modules'}}
        />
        <Stack.Screen
        name='ModuleAddScreen'
        component={ModuleAddScreen}
        options={{title: 'Add Modules'}}
        />
        <Stack.Screen
        name='ModuleModifyScreen'
        component={ModuleModifyScreen}
        options={{title: 'Modify Modules'}}
        />
        <Stack.Screen
        name='ModuleViewScreen'
        component={ModuleViewScreen}
        options={{title: 'View Modules'}}
        />
      </Stack.Navigator>
  )
}

function UserStack(){

  return (
<Stack.Navigator
      initialRouteName='UserListScreen'
      screenOptions={{
        headerStyle: {backgroundColor: 'black'},
        headerTintColor: 'white',
      }
    }
      >
        <Stack.Screen
        name='UserListScreen'
        component={UserListScreen}
        options={{title: 'List User'}}
        />
        <Stack.Screen
        name='UserAddScreen'
        component={UserAddScreen}
        options={{title: 'Add User'}}
        />
        <Stack.Screen
        name='UserModifyScreen'
        component={UserModifyScreen}
        options={{title: 'Modify User'}}
        />
        <Stack.Screen
        name='UserViewScreen'
        component={UserViewScreen}
        options={{title: 'View User'}}
        />
      </Stack.Navigator>
  )
}

export default App;