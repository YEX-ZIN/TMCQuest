import { StyleSheet, Text} from 'react-native';
import Screen from '../layout/Screen';
import ModuleForm from '../entity/modules/ModuleForm';

const ModuleModifyScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const {module, onModify} = route.params;
  // State -------------------------------
  // Handlers ----------------------------
  const handleCancel = navigation.goBack;
  // View --------------------------------
  return (
    <Screen>
      <ModuleForm originalModule={module} onSubmit={onModify} onCancel={handleCancel}/>
    </Screen>
  );
};

const styles = StyleSheet.create({});

export default ModuleModifyScreen;