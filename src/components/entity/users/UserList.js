import { ScrollView, StyleSheet } from 'react-native';
import UserItem from './UserItem';

const UserList = ({users, onSelect, onFavourite}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  // View --------------------------------
  return (
        <ScrollView style={styles.container}>
            {users.map((user)=>{
                return <UserItem key={user.UserID} user={user} onSelect={onSelect} onFavourite={onFavourite}/>;
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
});

export default UserList;
