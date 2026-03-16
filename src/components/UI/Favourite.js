import { Alert, Text } from 'react-native';
import Selector from './Selector.js';
import Icons from './Icons.js';

const Favourite = ({ isFavourite, onSelect, style }) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  // View --------------------------------
  return (
    <Selector onPress={onSelect} style={style}>
        <Text>{isFavourite ? <Icons.Favorite/>:<Icons.NotFavorite/>}</Text>
    </Selector>
  );
};

export default Favourite;