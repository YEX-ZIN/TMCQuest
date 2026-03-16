import { StyleSheet } from 'react-native';
import Screen from '../layout/Screen';
import ModuleView from '../entity/modules/ModuleView';

const ModuleViewScreen = ({ navigation, route }) => {
  // Initialisations ---------------------
  const { module, onDelete, onModify } = route.params;
  // State -------------------------------
  // Handlers ----------------------------
  const gotoModifyScreen = () => navigation.replace('ModuleModifyScreen',{module,onModify});
  // View --------------------------------
  return (
    <Screen>
      <ModuleView module={module} onDelete={onDelete} onModify={gotoModifyScreen}/>
    </Screen>
  );
};

const styles = StyleSheet.create({

});

export default ModuleViewScreen;