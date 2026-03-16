import { StyleSheet, Text, View } from 'react-native';
import Selector from '../../UI/Selector';
import Favourite from '../../UI/Favourite';

const UserItem = ({user, onSelect, onFavourite}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  const handleSelect = () => onSelect(user);
  const handleFavourite = () => onFavourite(user);
  // View --------------------------------
  return (
  <Selector onPress={() => onSelect(user)} pressedStyle={styles.pressedItem}>
            <View style={styles.item}>
                <Favourite isFavourite={user.UserFavourite} onSelect={handleFavourite}/>
                <Text style={styles.text}>
                    {user.UserID} {user.UserFirstname} {user.UserLastname} (
          {user.UserUsertypeName})
                </Text>
            </View>
        </Selector>
    );
};

const styles = StyleSheet.create({
    item:{
        paddingVertical: 15,
        borderTopWidth: 1,
        borderColor: 'lightgray',
        flexDirection: 'row',
    },
    text:{
        fontSize: 16,
        paddingLeft: 10,
    },
    pressedItem:{
        backgroundColor: 'azure',
    },
});

export default UserItem;
