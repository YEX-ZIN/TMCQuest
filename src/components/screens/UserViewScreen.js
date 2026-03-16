import { StyleSheet } from 'react-native';
import Screen from '../layout/Screen';
import UserView from '../entity/users/UserView';

const UserViewScreen = ({ navigation, route }) => {
  // Initialisations ---------------------
  const { user, onDelete, onModify } = route.params;
  // State -------------------------------
  // Handlers ----------------------------
  const gotoModifyScreen = () => navigation.replace('UserModifyScreen',{user,onModify});
  // View --------------------------------
  return (
    <Screen>
      <UserView user={user} onDelete={onDelete} onModify={gotoModifyScreen}/>
    </Screen>
  );
};

const styles = StyleSheet.create({

});

export default UserViewScreen;
