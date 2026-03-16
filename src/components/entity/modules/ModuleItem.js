import { StyleSheet, Text, View } from 'react-native';
import Selector from '../../UI/Selector';
import Favourite from '../../UI/Favourite';

const ModuleItem = ({module, onSelect, onFavourite}) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  const handleSelect = () => onSelect(module);
  const handleFavourite = () => onFavourite(module);
  // View --------------------------------
  return (
  <Selector onPress={() => onSelect(module)} pressedStyle={styles.pressedItem}>
            <View style={styles.item}>
                <Favourite isFavourite={module.ModuleFavourite} onSelect={handleFavourite}/>
                <Text style={styles.text}>
                    {module.ModuleCode} {module.ModuleName}
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

export default ModuleItem;
