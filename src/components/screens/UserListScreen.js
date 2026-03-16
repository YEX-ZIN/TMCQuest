import { useEffect } from 'react';
import { ActivityIndicator, Alert, LogBox, StyleSheet, Text, View } from 'react-native';
import useLoad from '../API/useLoad.js';
import useStore from '../store/useStore.js';
import API from '../API/API.js';
import Screen from '../layout/Screen.js';
import UserList from '../entity/users/UserList.js';
//import RenderCount from '../UI/RenderCount.js';
import Icons from '../UI/Icons.js';
import { Button, ButtonTray } from '../UI/Button.js';

const UserListScreen = ({navigation}) => {

  // Initialisations ---------------------
  LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);
  const usersEndpoint = 'https://softwarehub.uk/unibase/api/users';
  const loggedinUserKey = 'loggedinUser';
  const favouritesKey = 'userFavourites';

  // State -------------------------------
  const [users, setUsers, isLoading, loadUsers] = useLoad(usersEndpoint);
  const [loggedinUser, saveLoggedinUser] = useStore(loggedinUserKey, null);
  const [favourites, saveFavourites] = useStore(favouritesKey, []);


  const augmentUsersWithFavourites = () => {
    const modifyUser = (user) => 
      ({...user, UserFavourite: favourites.includes(user.UserID)});
    const augmentedUsers = users.map(modifyUser);
    augmentedUsers.length > 0 && setUsers(augmentedUsers);
    //setUsers(augmentedUsers);
  };

  useEffect(() => {
    augmentUsersWithFavourites();
  }, [isLoading]);

  // Handlers ----------------------------
    const handleFavourite = (user) => {
      // Update the user state
      const isFavourite = !user.UserFavourite;
      const updatedUser = (item) => 
        item.UserID === user.UserID ? 
      {...item, UserFavourite: isFavourite} : item;
      const updatedUserList = users.map(updatedUser);
      setUsers(updatedUserList);

      // save the new favourites
      const updatedFavouritesList = updatedUserList.filter((item) => item.UserFavourite).map((item) =>item.UserID);
      saveFavourites(updatedFavouritesList);
    };

    const onDelete = async (user) => {
      const deleteEndpoint = `${usersEndpoint}/${user.UserID}`;
      const result = await API.delete(deleteEndpoint, user);
      if(result.isSuccess){
        loadUsers(usersEndpoint);
        navigation.goBack();
      }
      else
        Alert.alert (result.message);      
    };

    const onAdd = async (user) => {
      const result = await API.post(usersEndpoint, user);
      if(result.isSuccess){
        loadUsers(usersEndpoint);
        navigation.goBack();
      }
      else
        Alert.alert (result.message);
    };

    const onModify = async (user) => {
      const putEndpoint = `${usersEndpoint}/${user.UserID}`;
      const result = await API.put(putEndpoint, user);
      if(result.isSuccess){
        const refreshed = await loadUsers(usersEndpoint);
        const updatedUser = refreshed.find((user) => user.UserID === user.UserID);
        navigation.replace('UserViewScreen',{user: updatedUser,onDelete,onModify});
      }else
        Alert.alert (result.message);
    }; 

    const gotoViewScreen = (user) =>navigation.navigate('UserViewScreen', {user, onDelete, onModify} );
    const gotoAddScreen = () => navigation.navigate('UserAddScreen', {onAdd});

  // View --------------------------------
  return (
    <Screen>
      {loggedinUser && <Text style={styles.welcome}>Welcome {loggedinUser.UserFirstname}</Text>}
      <ButtonTray>
        <Button label="Add" icon={<Icons.Add/>} onClick={gotoAddScreen}/>
      </ButtonTray>
      {
        isLoading &&(
        <View style={styles.loading}>
          <Text>Retrieving records from {usersEndpoint} ...</Text>
          <ActivityIndicator size="large" />
        </View>
      )}
      <UserList users={users} onSelect={gotoViewScreen} onFavourite={handleFavourite}/>
    </Screen>
  );
};

const styles = StyleSheet.create({
  welcome:{
    marginTop: 5,
    marginBottom: 5,
  },
  loading:{
    height: 100,
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container:{},
});

export default UserListScreen;