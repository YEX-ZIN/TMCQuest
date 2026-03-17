import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Screen from '../layout/Screen';
import Form from '../UI/Form';
import Icons from '../UI/Icons';
import API from '../API/API';

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const normaliseCreatedEvent = (result) => {
  if (!result) return {};
  if (Array.isArray(result)) return result[0] || {};
  if (typeof result === 'number') return { EventID: result };
  if (typeof result === 'string') {
    const parsed = Number(result);
    return Number.isNaN(parsed) ? {} : { EventID: parsed };
  }

  const eventID =
    result.EventID ||
    result.EventId ||
    result.id ||
    result.insertId ||
    result.InsertId ||
    null;

  return eventID ? { ...result, EventID: eventID } : result;
};

const defaultEvent = {
  EventID: null,
  EventName: '',
  EventDescription: '',
  EventOwnerID: 1,
  EventIspublic: false,
  EventStart: '',
  EventFinish: '',
  EventStatusID: 1,
  EventOwner: null,
  EventStatus: null,
  EventInviteCode: '',
  EventCaches: [],
  EventParticipants: [],
};

const CreateEventScreen = ({navigation}) => {
  // Initialisations ---------------------
  const eventsEndpoint = 'https://mark0s.com/geoquest/v1/api/events?key=16gv8f';
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  // State -------------------------------
  const [event, setEvent] = useState({
    ...defaultEvent,
    EventID: Math.floor(100000 + Math.random() * 900000),
    EventInviteCode: generateCode(),
    EventStart: now.toISOString(),
    EventFinish: oneHourLater.toISOString(),
  });
  const [startDate, setStartDate] = useState(now);
  const [finishDate, setFinishDate] = useState(oneHourLater);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showFinishPicker, setShowFinishPicker] = useState(false);
  // Handlers ----------------------------
  const handleChange = (field, value) => setEvent({...event, [field]: value});

  const handleStartChange = (_pickerEvent, selectedDate) => {
    if (Platform.OS === 'android') setShowStartPicker(false);
    if (!selectedDate) return;
    setStartDate(selectedDate);
    handleChange('EventStart', selectedDate.toISOString());
  };

  const handleFinishChange = (_pickerEvent, selectedDate) => {
    if (Platform.OS === 'android') setShowFinishPicker(false);
    if (!selectedDate) return;
    setFinishDate(selectedDate);
    handleChange('EventFinish', selectedDate.toISOString());
  };

  const handleSubmit = async () => {
    if (finishDate.getTime() <= startDate.getTime()) {
      Alert.alert('Invalid Date/Time', 'Finish time must be later than start time.');
      return;
    }

    const eventToSave = {
      ...event,
      EventStart: startDate.toISOString(),
      EventFinish: finishDate.toISOString(),
    };

    const response = await API.post(eventsEndpoint, eventToSave);
    if (response.isSuccess) {
      const createdPayload = normaliseCreatedEvent(response.result);
      const createdEventID = createdPayload.EventID || eventToSave.EventID;
      const createdEvent = {
        ...eventToSave,
        ...createdPayload,
        EventInviteCode: createdPayload.EventInviteCode || String(createdEventID),
      };
      navigation.replace('EventCacheListScreen', {event: createdEvent, isHost: true});
    } else {
      Alert.alert('Create Event Failed', response.message);
    }
  };

  const handleCancel = () => navigation.goBack();
  // View --------------------------------
  return (
    <Screen>
      <Form
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create"
        submitIcon={<Icons.Add />}
      >
        <Form.InputText
          label="Event Name"
          value={event.EventName}
          onChange={(value) => handleChange('EventName', value)}
        />
        <Form.InputText
          label="Description"
          value={event.EventDescription}
          onChange={(value) => handleChange('EventDescription', value)}
        />
        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Start Time</Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="compact"
              onChange={handleStartChange}
              style={styles.picker}
            />
          ) : (
            <>
              <Form.InputText
                label="Start"
                value={startDate.toLocaleString()}
                onChange={() => {}}
              />
              <Text style={styles.pickerAction} onPress={() => setShowStartPicker(true)}>
                Change Start Time
              </Text>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="datetime"
                  display="default"
                  onChange={handleStartChange}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Finish Time</Text>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={finishDate}
              mode="datetime"
              display="compact"
              onChange={handleFinishChange}
              style={styles.picker}
            />
          ) : (
            <>
              <Form.InputText
                label="Finish"
                value={finishDate.toLocaleString()}
                onChange={() => {}}
              />
              <Text style={styles.pickerAction} onPress={() => setShowFinishPicker(true)}>
                Change Finish Time
              </Text>
              {showFinishPicker && (
                <DateTimePicker
                  value={finishDate}
                  mode="datetime"
                  display="default"
                  onChange={handleFinishChange}
                />
              )}
            </>
          )}
        </View>
        <Form.InputText
          label="Invite Code (temporary local field)"
          value={event.EventInviteCode}
          onChange={(value) => handleChange('EventInviteCode', value)}
        />
      </Form>
    </Screen>
  );
};

const styles = StyleSheet.create({
  pickerSection: {
    gap: 6,
  },
  pickerLabel: {
    color: 'grey',
    fontSize: 16,
  },
  picker: {
    backgroundColor: 'white',
  },
  pickerAction: {
    color: 'black',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default CreateEventScreen;
