import { MaterialIcons } from '@expo/vector-icons';

const Icons = {};

const Add = () => <MaterialIcons name='add' size={16} />;
const Close = () => <MaterialIcons name='close' size={16} />;
const Delete = () => <MaterialIcons name='delete' size={16} />;
const Edit = () => <MaterialIcons name='edit' size={16} />;
const Favorite = () => <MaterialIcons name='favorite' size={18} color='crimson' />;
const NotFavorite = () => <MaterialIcons name='favorite-border' size={18} color='grey' />;
const Submit = () => <MaterialIcons name='check' size={16} />;
const MyLocation = ({size = 16, color = 'white'}) => <MaterialIcons name='my-location' size={size} color={color} />;
const Navigation = ({size = 16, color = 'black'}) => <MaterialIcons name='near-me' size={size} color={color} />;
const Leaderboard = ({size = 18, color = 'white'}) => <MaterialIcons name='emoji-events' size={size} color={color} />;
const Clock = ({size = 14, color = '#333333'}) => <MaterialIcons name='schedule' size={size} color={color} />;
const CacheBox = ({size = 14, color = '#222222'}) => <MaterialIcons name='inventory-2' size={size} color={color} />;
const Map = ({size = 22, color = 'black'}) => <MaterialIcons name='map' size={size} color={color} />;
const Key = ({size = 22, color = 'black'}) => <MaterialIcons name='vpn-key' size={size} color={color} />;

// Compose
Icons.Add = Add;
Icons.Close = Close;
Icons.Delete = Delete;
Icons.Edit = Edit;
Icons.Favorite = Favorite;
Icons.NotFavorite = NotFavorite;
Icons.Submit = Submit;
Icons.MyLocation = MyLocation;
Icons.Navigation = Navigation;
Icons.Leaderboard = Leaderboard;
Icons.Clock = Clock;
Icons.CacheBox = CacheBox;
Icons.Map = Map;
Icons.Key = Key;

export default Icons;
