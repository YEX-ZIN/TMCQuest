
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


const useStore = (key,initialRecord) => {
  // Initialisations ---------------------
    //const [loggedinUser, setLoggedinUser] = useState(null);
    const [record, setRecord] = useState(initialRecord);
  // State -------------------------------
  // Handlers ----------------------------
    const loadRecord = async () => {
        try {
            const recoveredJSON = await AsyncStorage.getItem(key);
            if(recoveredJSON !== null){
                const record = JSON.parse(recoveredJSON);
                setRecord(record);
            }
        } catch (error) {
            Alert.alert(`Error loading ${key} record: ${error}`);
        }
    };
    
    const saveRecord = async (newRecord) => {
        try {
            const encodedRecord = JSON.stringify(newRecord);
            await AsyncStorage.setItem(key, encodedRecord);
            setRecord(newRecord);
        } catch (error) {
            Alert.alert(`Error saving ${key} record: ${error}`);
        }
    };

    useEffect(() => {
        loadRecord();
    }, []);

  // View --------------------------------
  return [record, saveRecord];
};

export default useStore;