import { useEffect } from 'react';
import { ActivityIndicator, Alert, LogBox, StyleSheet, Text, View } from 'react-native';
import useLoad from '../API/useLoad.js';
import useStore from '../store/useStore.js';
import API from '../API/API.js';
import Screen from '../layout/Screen.js';
import ModuleList from '../entity/modules/ModuleList.js';
import RenderCount from '../UI/RenderCount.js';
import Icons from '../UI/Icons.js';
import { Button, ButtonTray } from '../UI/Button.js';

const ModuleListScreen = ({navigation}) => {
  // Initialisations ---------------------
  LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);
  const modulesEndpoint = 'https://softwarehub.uk/unibase/api/modules';
  const loggedinUserKey = 'loggedinUser';
  const favouritesKey = 'moduleFavourites';
  // State -------------------------------
  const [modules, setModules, isLoading, loadModules] = useLoad(modulesEndpoint);
  const [loggedinUser, saveLoggedinUser] = useStore(loggedinUserKey, null);
  const [favourites, saveFavourites] = useStore(favouritesKey, []);


  const augmentModulesWithFavourites = () => {
    const modifyModule = (module) => 
      ({...module, ModuleFavourite: favourites.includes(module.ModuleID)});
    const augmentedModules = modules.map(modifyModule);
    augmentedModules.length > 0 && setModules(augmentedModules);
  };

  useEffect(() => {
    augmentModulesWithFavourites();
  }, [isLoading]);

  // Handlers ----------------------------
    const handleFavourite = (module) => {
      // Update the module state
      const isFavourite = !module.ModuleFavourite;
      const updatedModule = (item) => 
        item.ModuleID === module.ModuleID ? 
      {...item, ModuleFavourite: isFavourite} : item;
      const updatedModuleList = modules.map(updatedModule);
      setModules(updatedModuleList);

      // save the new favourites
      const updatedFavouritesList = updatedModuleList.filter((item) => item.ModuleFavourite).map((item) =>item.ModuleID);
      saveFavourites(updatedFavouritesList);
    };

    const onDelete = async (module) => {
      const deleteEndpoint = `${modulesEndpoint}/${module.ModuleID}`;
      //const result = await API.delete(deleteEndpoint);
      const result = await API.delete(deleteEndpoint, module);
      if(result.isSuccess){
        loadModules(modulesEndpoint);
        navigation.goBack();
      }
      else
        Alert.alert (result.message);      
    };

    const onAdd = async (module) => {
      const result = await API.post(modulesEndpoint, module);
      if(result.isSuccess){
        loadModules(modulesEndpoint);
        navigation.goBack();
      }
      else
        Alert.alert (result.message);
    };

    const onModify = async (module) => {
      const putEndpoint = `${modulesEndpoint}/${module.ModuleID}`;
      const result = await API.put(putEndpoint, module);
      if(result.isSuccess){
        loadModules(modulesEndpoint);
        navigation.replace('ModuleViewScreen',{module,onDelete,onModify});
      }else
        Alert.alert (result.message);
    }; 

    const gotoViewScreen = (module) =>navigation.navigate('ModuleViewScreen', {module, onDelete, onModify} );
    const gotoAddScreen = () => navigation.navigate('ModuleAddScreen', {onAdd});
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
          <Text>Retrieving records from {modulesEndpoint} ...</Text>
          <ActivityIndicator size="large" />
        </View>
      )}
      <ModuleList modules={modules} onSelect={gotoViewScreen} onFavourite={handleFavourite}/>
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

export default ModuleListScreen;