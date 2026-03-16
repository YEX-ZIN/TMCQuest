import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Screen from '../layout/Screen';
import Form from '../UI/Form';
import Icons from '../UI/Icons';
import useEvents from '../store/useEvents';

const JoinEventScreen = ({navigation}) => {
  // Initialisations ---------------------
  // State -------------------------------
  const [code, setCode] = useState('');
  const [, , findEventByCode] = useEvents();
  // Handlers ----------------------------
  const handleJoin = () => {
    const event = findEventByCode(code);
    if (event) {
      navigation.replace('EventCacheListScreen', {event});
    } else {
      Alert.alert('Not Found', 'No event found with that invite code. Please check and try again.');
    }
  };

  const handleCancel = () => navigation.goBack();
  // View --------------------------------
  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Event</Text>
          <Text style={styles.subtitle}>Enter the invite code shared by the event owner.</Text>
        </View>
        <Form
          onSubmit={handleJoin}
          onCancel={handleCancel}
          submitLabel="Join"
          submitIcon={<Icons.Submit />}
        >
          <Form.InputText
            label="Invite Code"
            value={code}
            onChange={(value) => setCode(value.toUpperCase())}
          />
        </Form>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
  },
  subtitle: {
    fontSize: 15,
    color: 'grey',
    textAlign: 'center',
  },
});

export default JoinEventScreen;
