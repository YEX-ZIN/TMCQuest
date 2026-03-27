import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Screen from '../layout/Screen';
import Form from '../UI/Form';
import Icons from '../UI/Icons';
import API from '../API/API';
import useCurrentUser from '../store/useCurrentUser';

const generateSystemEventCode = () => Math.random().toString(36).slice(2, 8).toLowerCase();
const sanitiseCode = (value) => `${value || ''}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const GROUP_PRIVATE_CODE = 'n9suok';

const parseDateSafe = (value, fallbackDate) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallbackDate : parsed;
};

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

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const resolveCreatedEvent = async (createdPayload, eventToSave, ownerID) => {
  if (createdPayload?.EventID || createdPayload?.EventId || createdPayload?.id) {
    return { ...eventToSave, ...createdPayload };
  }

  const response = await API.get(API.geoQuest.eventsByUser(ownerID));
  if (!response.isSuccess) return { ...eventToSave, ...createdPayload };

  const ownerEvents = normaliseList(response.result)
    .filter((item) => String(item.EventOwnerID) === String(ownerID));

  const exactMatch = ownerEvents.find((item) => (
    (item.EventName || '') === (eventToSave.EventName || '')
      && (item.EventDescription || '') === (eventToSave.EventDescription || '')
      && (item.EventStart || '') === (eventToSave.EventStart || '')
      && (item.EventFinish || '') === (eventToSave.EventFinish || '')
  ));

  if (exactMatch) return { ...eventToSave, ...createdPayload, ...exactMatch };

  const fuzzyMatch = ownerEvents
    .filter((item) => (item.EventName || '') === (eventToSave.EventName || ''))
    .sort((a, b) => new Date(b.EventStart || 0) - new Date(a.EventStart || 0))[0];

  return fuzzyMatch
    ? { ...eventToSave, ...createdPayload, ...fuzzyMatch }
    : { ...eventToSave, ...createdPayload };
};

const defaultEvent = {
  EventID: null,
  EventName: '',
  EventDescription: '',
  EventOwnerID: null,
  EventIspublic: false,
  EventStart: '',
  EventFinish: '',
  EventStatusID: 1,
  EventOwner: null,
  EventStatus: null,
  EventCaches: [],
  EventParticipants: [],
};

const CreateEventScreen = ({navigation, route}) => {
  // Initialisations ---------------------
  const eventsEndpoint = API.geoQuest.events();
  const editingEvent = route?.params?.event || null;
  const isEditMode = route?.params?.mode === 'edit' && !!editingEvent;
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const initialStartDate = parseDateSafe(editingEvent?.EventStart, now);
  const initialFinishDate = parseDateSafe(editingEvent?.EventFinish, oneHourLater);
  const initialCustomCode = sanitiseCode(editingEvent?.EventInviteCode) || GROUP_PRIVATE_CODE;
  const [currentUser] = useCurrentUser();
  // State -------------------------------
  const [event, setEvent] = useState({
    ...defaultEvent,
    EventID: editingEvent?.EventID || editingEvent?.EventId || editingEvent?.id || Math.floor(100000 + Math.random() * 900000),
    EventName: editingEvent?.EventName || '',
    EventDescription: editingEvent?.EventDescription || '',
    EventOwnerID: editingEvent?.EventOwnerID || currentUser?.UserID || null,
    EventIspublic: editingEvent?.EventIspublic ?? false,
    EventStart: initialStartDate.toISOString(),
    EventFinish: initialFinishDate.toISOString(),
    EventStatusID: editingEvent?.EventStatusID || 1,
    EventInviteCode: editingEvent?.EventInviteCode || '',
  });
  const [startDate, setStartDate] = useState(initialStartDate);
  const [finishDate, setFinishDate] = useState(initialFinishDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showFinishPicker, setShowFinishPicker] = useState(false);
  const [systemCode, setSystemCode] = useState(generateSystemEventCode());
  const [customCode, setCustomCode] = useState(initialCustomCode);
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

    const desiredCode = sanitiseCode(customCode) || systemCode;
    if (!/^[a-z0-9]{4,12}$/.test(desiredCode)) {
      Alert.alert('Invalid Code', 'Event code must be 4 to 12 letters/numbers.');
      return;
    }

    const existingEventsResponse = await API.get(eventsEndpoint);
    if (!existingEventsResponse.isSuccess) {
      Alert.alert('Create Event Failed', existingEventsResponse.message || 'Unable to validate event code right now.');
      return;
    }

    const existingEvents = normaliseList(existingEventsResponse.result);
    const currentEventID = event.EventID || event.EventId || event.id;
    const codeInUse = existingEvents.some(
      (item) => {
        const itemEventID = item.EventID || item.EventId || item.id;
        const sameEvent = isEditMode && String(itemEventID) === String(currentEventID);
        return !sameEvent && sanitiseCode(item.EventInviteCode) === desiredCode;
      },
    );
    if (codeInUse) {
      Alert.alert('Code Unavailable', 'That event code is already in use. Choose another one.');
      return;
    }

    const eventToSave = {
      ...event,
      EventOwnerID: currentUser?.UserID || event.EventOwnerID,
      EventStart: startDate.toISOString(),
      EventFinish: finishDate.toISOString(),
      EventInviteCode: desiredCode,
    };

    if (!eventToSave.EventOwnerID) {
      Alert.alert('Login Required', 'Log in before creating an event.');
      return;
    }

    const requestEndpoint = isEditMode
      ? API.geoQuest.events(currentEventID)
      : eventsEndpoint;
    const response = isEditMode
      ? await API.put(requestEndpoint, eventToSave)
      : await API.post(requestEndpoint, eventToSave);

    if (response.isSuccess) {
      if (isEditMode) {
        navigation.replace('EventCacheListScreen', { event: { ...editingEvent, ...eventToSave }, isHost: true });
        return;
      }

      const createdPayload = normaliseCreatedEvent(response.result);
      const createdEvent = await resolveCreatedEvent(createdPayload, eventToSave, eventToSave.EventOwnerID);
      navigation.replace('EventCacheListScreen', { event: createdEvent, isHost: true });
    } else {
      Alert.alert(isEditMode ? 'Update Event Failed' : 'Create Event Failed', response.message);
    }
  };

  const handleCancel = () => navigation.goBack();
  // View --------------------------------
  return (
    <Screen style={styles.screen} statusBarStyle='light'>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Event' : 'Create Event'}</Text>
          <Text style={styles.headerSubtitle}>
            {isEditMode ? 'Update your event details and save changes.' : 'Set your event details and prepare the hunt.'}
          </Text>
        </View>

        <View style={styles.formCard}>
          <Form
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel={isEditMode ? 'Save' : 'Create'}
            submitIcon={<Icons.Add />}
            submitButtonStyle={styles.submitButton}
            submitLabelStyle={styles.submitLabel}
            cancelButtonStyle={styles.cancelButton}
            cancelLabelStyle={styles.cancelLabel}
          >
            <Form.InputText
              label="Event Name"
              value={event.EventName}
              onChange={(value) => handleChange('EventName', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />
            <Form.InputText
              label="Description"
              value={event.EventDescription}
              onChange={(value) => handleChange('EventDescription', value)}
              labelStyle={styles.inputLabel}
              inputStyle={styles.inputField}
            />

            <View style={styles.codeCard}>
              <Text style={styles.codeTitle}>Event Code</Text>
              <Text style={styles.codeHint}>System code is auto-generated. You can enter your own.</Text>

              <View style={styles.systemCodeRow}>
                <Text style={styles.systemCodeLabel}>System Code</Text>
                <Text style={styles.systemCodeValue}>{systemCode.toUpperCase()}</Text>
              </View>
              <Text style={styles.regenerateCodeText} onPress={() => setSystemCode(generateSystemEventCode())}>
                Generate New System Code
              </Text>

              <Form.InputText
                label="Custom Code (optional)"
                value={customCode}
                onChange={setCustomCode}
                placeholder="e.g. n9suok"
                labelStyle={styles.inputLabel}
                inputStyle={styles.inputField}
              />
              <Text style={styles.codePreview}>Code that will be used: {(sanitiseCode(customCode) || systemCode).toUpperCase()}</Text>
            </View>

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
                    labelStyle={styles.inputLabel}
                    inputStyle={styles.inputField}
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
                    labelStyle={styles.inputLabel}
                    inputStyle={styles.inputField}
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
          </Form>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#0d0a04',
  },
  container: {
    flex: 1,
    gap: 12,
    paddingTop: 70,
  },
  headerCard: {
    borderRadius: 18,
    backgroundColor: '#261a0a',
    borderWidth: 1,
    borderColor: '#c4903a',
    padding: 14,
    gap: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#f0d080',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#d8bc87',
  },
  formCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(246,231,194,0.95)',
    borderWidth: 1.5,
    borderColor: '#c4903a',
    padding: 10,
  },
  inputLabel: {
    color: '#5c3b10',
    fontWeight: '600',
  },
  inputField: {
    backgroundColor: '#f8f1df',
    borderColor: '#d8be86',
    color: '#2f1b07',
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: '#c4903a',
    borderColor: '#f0d080',
    borderWidth: 1,
    borderRadius: 10,
  },
  submitLabel: {
    color: '#1a1105',
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#f6ead0',
    borderColor: '#8a6224',
    borderWidth: 1,
    borderRadius: 10,
  },
  cancelLabel: {
    color: '#5c3b10',
    fontWeight: '600',
  },
  pickerSection: {
    gap: 6,
  },
  codeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8be86',
    backgroundColor: '#f8f1df',
    padding: 10,
    gap: 6,
  },
  codeTitle: {
    color: '#5c3b10',
    fontSize: 16,
    fontWeight: '700',
  },
  codeHint: {
    color: '#7a5217',
    fontSize: 12,
  },
  systemCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8be86',
    backgroundColor: '#f3e5c2',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  systemCodeLabel: {
    color: '#5c3b10',
    fontSize: 13,
    fontWeight: '600',
  },
  systemCodeValue: {
    color: '#2f1b07',
    fontSize: 16,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  regenerateCodeText: {
    color: '#7a5217',
    fontSize: 13,
    textDecorationLine: 'underline',
    alignSelf: 'flex-start',
  },
  codePreview: {
    color: '#6b4e2a',
    fontSize: 12,
    fontWeight: '600',
  },
  pickerLabel: {
    color: '#5c3b10',
    fontSize: 16,
    fontWeight: '600',
  },
  picker: {
    backgroundColor: '#f8f1df',
  },
  pickerAction: {
    color: '#7a5217',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default CreateEventScreen;
