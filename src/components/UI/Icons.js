import { MaterialIcons } from '@expo/vector-icons';

const Icons = {};

const Add = () => <MaterialIcons name='add' size={16} />;
const Close = () => <MaterialIcons name='close' size={16} />;
const Delete = () => <MaterialIcons name='delete' size={16} />;
const Edit = () => <MaterialIcons name='edit' size={16} />;
const Favorite = () => <MaterialIcons name='favorite' size={18} color='crimson' />;
const NotFavorite = () => <MaterialIcons name='favorite-border' size={18} color='grey' />;
const Submit = () => <MaterialIcons name='check' size={16} />;

// Compose
Icons.Add = Add;
Icons.Close = Close;
Icons.Delete = Delete;
Icons.Edit = Edit;
Icons.Favorite = Favorite;
Icons.NotFavorite = NotFavorite;
Icons.Submit = Submit;

export default Icons;
