import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { Button } from '../UI/Button';
import { saveEvidenceEntry } from '../store/evidenceStore';
import API from '../API/API';
import useCurrentUser from '../store/useCurrentUser';

const toRadians = (degrees) => degrees * (Math.PI / 180);
const toDegrees = (radians) => radians * (180 / Math.PI);

const distanceInMeters = (fromLat, fromLng, toLat, toLng) => {
  const earthRadius = 6371000;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const bearingToTarget = (fromLat, fromLng, toLat, toLng) => {
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);
  const deltaLng = toRadians(toLng - fromLng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2)
    - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
};

const normaliseAngle = (angle) => {
  const value = ((angle + 180) % 360 + 360) % 360 - 180;
  return value;
};

const getCacheID = (cache) => cache?.CacheID ?? cache?.CacheId ?? cache?.id;
const getPlayerID = (player) => player?.PlayerID || player?.PlayerId || player?.id || null;
const getFindPlayerID = (find) => find?.FindPlayerID || find?.FindPlayerId || find?.FindPlayer?.PlayerID || find?.FindPlayer?.PlayerId || null;
const getFindCacheID = (find) => find?.FindCacheID || find?.FindCacheId || find?.FindCache?.CacheID || find?.FindCache?.CacheId || null;
const getEventID = (event) => event?.EventID || event?.EventId || event?.id || null;

const normaliseList = (result) => {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.result)) return result.result;
  return [];
};

const normaliseCreatedID = (result, keyName) => {
  if (result === null || result === undefined) return null;
  if (typeof result === 'number' || typeof result === 'string') return result;
  if (Array.isArray(result)) return normaliseCreatedID(result[0], keyName);
  return result?.[keyName] || result?.id || result?.insertId || result?.InsertId || null;
};

const findPlayerForEvent = (players, userID, eventID) => players.find(
  (player) => String(player.PlayerUserID) === String(userID)
    && String(player.PlayerEventID) === String(eventID),
);

const ARCameraNavigatorScreen = ({ navigation, route }) => {
  const cache = route.params?.cache;
  const discoveryRadiusMeters = Number(route.params?.discoveryRadiusMeters || 30);
  const onEvidenceCaptured = route.params?.onEvidenceCaptured;
  const onDiscoveryLogged = route.params?.onDiscoveryLogged;
  const event = route.params?.event;
  const isPublic = route.params?.isPublic === true;
  const cacheLatitude = cache?.CacheLatitude ?? cache?.CacheLat;
  const cacheLongitude = cache?.CacheLongitude ?? cache?.CacheLng;
  const cacheID = getCacheID(cache);

  const cameraRef = useRef(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [coords, setCoords] = useState(null);
  const [capturedPhotoURI, setCapturedPhotoURI] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmittingFind, setIsSubmittingFind] = useState(false);
  const [currentUser] = useCurrentUser();

  useEffect(() => {
    let mounted = true;
    let headingSubscription = null;
    let locationSubscription = null;
    let motionSubscription = null;

    const setup = async () => {
      if (cacheLatitude === undefined || cacheLatitude === null || cacheLongitude === undefined || cacheLongitude === null) {
        Alert.alert('Navigation Unavailable', 'Selected cache does not have valid coordinates.');
        navigation.goBack();
        return;
      }

      const locationResult = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      setLocationPermission(locationResult.status);

      if (locationResult.status !== 'granted') {
        Alert.alert('Location Required', 'Location permission is needed for AR navigation.');
        navigation.goBack();
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      if (!mounted) return;
      setCoords(initialLocation.coords);

      headingSubscription = await Location.watchHeadingAsync((headingData) => {
        if (!mounted) return;
        const trueHeading = Number.isFinite(headingData.trueHeading) && headingData.trueHeading >= 0
          ? headingData.trueHeading
          : headingData.magHeading;
        if (Number.isFinite(trueHeading)) setHeading(trueHeading);
      });

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (position) => {
          if (!mounted) return;
          setCoords(position.coords);
        },
      );

      DeviceMotion.setUpdateInterval(250);
      motionSubscription = DeviceMotion.addListener((motionData) => {
        if (!mounted) return;
        const beta = motionData?.rotation?.beta;
        if (Number.isFinite(beta)) setPitch(beta);
      });
    };

    setup();

    return () => {
      mounted = false;
      headingSubscription?.remove?.();
      locationSubscription?.remove?.();
      motionSubscription?.remove?.();
    };
  }, [cacheLatitude, cacheLongitude, navigation]);

  const directionData = useMemo(() => {
    if (!coords || cacheLatitude === undefined || cacheLatitude === null || cacheLongitude === undefined || cacheLongitude === null) {
      return { metersLeft: null, relativeAngle: 0, hint: 'Waiting for location...' };
    }

    const metersLeft = distanceInMeters(coords.latitude, coords.longitude, cacheLatitude, cacheLongitude);
    const targetBearing = bearingToTarget(coords.latitude, coords.longitude, cacheLatitude, cacheLongitude);
    const relativeAngle = normaliseAngle(targetBearing - heading);

    let hint = 'Go straight';
    if (relativeAngle > 20) hint = 'Turn right';
    if (relativeAngle < -20) hint = 'Turn left';

    return {
      metersLeft,
      relativeAngle,
      hint,
    };
  }, [cacheLatitude, cacheLongitude, coords, heading]);

  const metersText = Number.isFinite(directionData.metersLeft)
    ? `${Math.round(directionData.metersLeft)} m left`
    : 'Locating...';
  const isUnlocked = Number.isFinite(directionData.metersLeft) && directionData.metersLeft <= discoveryRadiusMeters;

  const captureEvidencePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      if (photo?.uri) {
        setCapturedPhotoURI(photo.uri);
      }
    } catch (error) {
      Alert.alert('Capture Failed', error.message || 'Could not capture evidence photo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const attachEvidenceAndBack = () => {
    if (!capturedPhotoURI) {
      navigation.goBack();
      return;
    }

    const run = async () => {
      const payload = {
        cacheID,
        uri: capturedPhotoURI,
        capturedAt: new Date().toISOString(),
      };

      try {
        await saveEvidenceEntry({
          ...payload,
          eventID: event?.EventID || event?.EventId || event?.id || null,
          isPublic,
        });

        if (typeof onEvidenceCaptured === 'function') {
          onEvidenceCaptured(payload);
        }

        Alert.alert('Evidence Attached', 'Photo evidence was saved on this device.');
      } catch (error) {
        Alert.alert('Save Failed', error.message || 'Could not save evidence photo.');
      } finally {
        navigation.goBack();
      }
    };

    run();
  };

  const ensureEvidenceSaved = async () => {
    if (!capturedPhotoURI) return;

    const payload = {
      cacheID,
      uri: capturedPhotoURI,
      capturedAt: new Date().toISOString(),
    };

    await saveEvidenceEntry({
      ...payload,
      eventID: getEventID(event),
      isPublic,
    });

    if (typeof onEvidenceCaptured === 'function') {
      onEvidenceCaptured(payload);
    }
  };

  const logFoundFromAR = async () => {
    if (isSubmittingFind) return;
    if (isPublic) {
      Alert.alert('Unavailable', 'Found logging from AR is only available inside joined events.');
      return;
    }

    const eventID = getEventID(event);
    if (!currentUser?.UserID || !eventID || !cacheID) {
      Alert.alert('Log Failed', 'Missing user, event, or cache details for this discovery.');
      return;
    }

    if (!isUnlocked) {
      Alert.alert('Too Far Away', `Move within ${discoveryRadiusMeters} meters to log this find.`);
      return;
    }

    setIsSubmittingFind(true);

    try {
      await ensureEvidenceSaved();

      const playersByEventResponse = await API.get(API.geoQuest.playersByEvent(eventID));
      if (!playersByEventResponse.isSuccess) {
        Alert.alert('Log Failed', playersByEventResponse.message || 'Could not load event participants.');
        setIsSubmittingFind(false);
        return;
      }

      const players = normaliseList(playersByEventResponse.result);
      let playerRecord = findPlayerForEvent(players, currentUser.UserID, eventID);

      if (!playerRecord) {
        const createPlayerResponse = await API.post(API.geoQuest.players(), {
          PlayerUserID: currentUser.UserID,
          PlayerEventID: eventID,
        });

        if (!createPlayerResponse.isSuccess) {
          Alert.alert('Log Failed', createPlayerResponse.message || 'Could not join this event automatically.');
          setIsSubmittingFind(false);
          return;
        }

        const createdPlayerID = normaliseCreatedID(createPlayerResponse.result, 'PlayerID');
        if (createdPlayerID) {
          playerRecord = {
            PlayerID: createdPlayerID,
            PlayerUserID: currentUser.UserID,
            PlayerEventID: eventID,
          };
        } else {
          const refreshedPlayersResponse = await API.get(API.geoQuest.playersByEvent(eventID));
          if (refreshedPlayersResponse.isSuccess) {
            const refreshedPlayers = normaliseList(refreshedPlayersResponse.result);
            playerRecord = findPlayerForEvent(refreshedPlayers, currentUser.UserID, eventID);
          }
        }
      }

      const playerID = getPlayerID(playerRecord);
      if (!playerID) {
        Alert.alert('Log Failed', 'Could not resolve your player profile for this event.');
        setIsSubmittingFind(false);
        return;
      }

      let existingFinds = [];
      const findsByPlayerResponse = await API.get(API.geoQuest.findsByPlayer(playerID));
      if (findsByPlayerResponse.isSuccess) {
        existingFinds = normaliseList(findsByPlayerResponse.result);
      } else {
        const findsByEventResponse = await API.get(API.geoQuest.findsByEvent(eventID));
        if (findsByEventResponse.isSuccess) {
          existingFinds = normaliseList(findsByEventResponse.result).filter(
            (find) => String(getFindPlayerID(find)) === String(playerID),
          );
        }
      }

      const alreadyFound = existingFinds.some((find) => String(getFindCacheID(find)) === String(cacheID));
      if (alreadyFound) {
        Alert.alert('Already Logged', 'You already discovered this cache.');
        setIsSubmittingFind(false);
        return;
      }

      const payload = {
        FindPlayerID: playerID,
        FindCacheID: cacheID,
        FindDatetime: new Date().toISOString(),
      };
      if (capturedPhotoURI) payload.FindImageURL = capturedPhotoURI;

      let createFindResponse = await API.post(API.geoQuest.finds(), payload);
      if (!createFindResponse.isSuccess && capturedPhotoURI) {
        createFindResponse = await API.post(API.geoQuest.finds(), {
          FindPlayerID: playerID,
          FindCacheID: cacheID,
          FindDatetime: payload.FindDatetime,
        });
      }

      if (!createFindResponse.isSuccess) {
        Alert.alert('Log Failed', createFindResponse.message || 'Could not log this discovery right now.');
        setIsSubmittingFind(false);
        return;
      }

      if (typeof onDiscoveryLogged === 'function') {
        onDiscoveryLogged({
          cacheID,
          cacheName: cache?.CacheName || 'Treasure Cache',
          points: Number(cache?.CachePoints || 0),
        });
      }

      Alert.alert('Discovery Logged', 'Your find was saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      setIsSubmittingFind(false);
    } catch (error) {
      setIsSubmittingFind(false);
      Alert.alert('Log Failed', error.message || 'Something went wrong while logging your find.');
    }
  };

  if (!cameraPermission) {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size='small' color='white' />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
        <Text style={styles.permissionText}>Enable camera access to use AR navigation.</Text>
        <Button label='Allow Camera' onClick={requestCameraPermission} styleButton={styles.allowButton} styleLabel={styles.allowButtonLabel} />
      </View>
    );
  }

  if (locationPermission !== 'granted') {
    return (
      <View style={styles.centeredScreen}>
        <ActivityIndicator size='small' color='white' />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView ref={cameraRef} style={styles.camera} facing='back' />

      <View style={styles.hudTop}>
        <Text style={styles.cacheTitle}>{cache?.CacheName || 'Cache Target'}</Text>
        <Text style={styles.hintText}>{directionData.hint}</Text>
        <View style={[styles.unlockBadge, isUnlocked ? styles.unlockBadgeOn : styles.unlockBadgeOff]}>
          <Text style={[styles.unlockBadgeText, isUnlocked ? styles.unlockBadgeTextOn : styles.unlockBadgeTextOff]}>
            {isUnlocked
              ? `Unlocked - within ${discoveryRadiusMeters}m`
              : `Locked - move within ${discoveryRadiusMeters}m`}
          </Text>
        </View>
      </View>

      <View style={styles.arrowWrap}>
        <Text
          style={[
            styles.arrow,
            { transform: [{ rotate: `${directionData.relativeAngle}deg` }] },
          ]}
        >
          ^
        </Text>
      </View>

      <View style={styles.hudBottom}>
        <Text style={styles.distanceText}>{metersText}</Text>
        <Text style={styles.metaText}>Heading {Math.round(heading)} deg | Pitch {Math.round(pitch)} deg</Text>
        {capturedPhotoURI ? (
          <View style={styles.evidenceWrap}>
            <Text style={styles.evidenceLabel}>Evidence captured</Text>
            <Image source={{ uri: capturedPhotoURI }} style={styles.evidenceImage} />
          </View>
        ) : (
          <Text style={styles.evidenceHint}>Optional: capture a photo as evidence before logging discovery.</Text>
        )}
        <View style={styles.controlRow}>
          <Button
            label={isCapturing ? 'Capturing...' : (capturedPhotoURI ? 'Retake Photo' : 'Capture Evidence')}
            onClick={captureEvidencePhoto}
            styleButton={styles.captureButton}
            styleLabel={styles.captureButtonLabel}
          />
          {!isPublic ? (
            <Button
              label={isSubmittingFind ? 'Logging...' : 'Found'}
              onClick={logFoundFromAR}
              styleButton={styles.foundButton}
              styleLabel={styles.foundButtonLabel}
            />
          ) : null}
          <Button
            label={capturedPhotoURI ? 'Use Photo & Back' : 'Back To Map'}
            onClick={attachEvidenceAndBack}
            styleButton={styles.backButton}
            styleLabel={styles.backButtonLabel}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: '#101010',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    color: '#d3d3d3',
    textAlign: 'center',
    fontSize: 14,
  },
  allowButton: {
    maxWidth: 220,
    borderColor: '#1f7a4d',
    backgroundColor: '#2ba167',
    marginTop: 4,
  },
  allowButtonLabel: {
    color: 'white',
    fontWeight: '700',
  },
  hudTop: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    gap: 3,
  },
  cacheTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
  },
  hintText: {
    color: '#8ce5b0',
    fontSize: 14,
    fontWeight: '600',
  },
  unlockBadge: {
    marginTop: 7,
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  unlockBadgeOn: {
    backgroundColor: 'rgba(73, 186, 111, 0.22)',
    borderColor: 'rgba(97, 229, 145, 0.5)',
  },
  unlockBadgeOff: {
    backgroundColor: 'rgba(186, 73, 73, 0.22)',
    borderColor: 'rgba(238, 114, 114, 0.46)',
  },
  unlockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unlockBadgeTextOn: {
    color: '#8ef7b7',
  },
  unlockBadgeTextOff: {
    color: '#ffb1b1',
  },
  arrowWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#ffd166',
    fontSize: 120,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  hudBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    gap: 6,
  },
  distanceText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
  },
  metaText: {
    color: '#d8d8d8',
    fontSize: 12,
  },
  evidenceHint: {
    color: '#cfd3da',
    fontSize: 12,
  },
  evidenceWrap: {
    marginTop: 4,
    gap: 6,
  },
  evidenceLabel: {
    color: '#f4f4f4',
    fontSize: 12,
    fontWeight: '700',
  },
  evidenceImage: {
    width: 104,
    height: 104,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  captureButton: {
    flex: 1,
    backgroundColor: '#ffd166',
    borderColor: '#f2bd43',
  },
  captureButtonLabel: {
    color: '#2c1a00',
    fontWeight: '700',
    fontSize: 13,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#e8f0ff',
    borderColor: '#c4d5f5',
  },
  backButtonLabel: {
    color: '#1f2e4f',
    fontWeight: '700',
  },
  foundButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderColor: '#2e7d32',
  },
  foundButtonLabel: {
    color: 'white',
    fontWeight: '800',
  },
});

export default ARCameraNavigatorScreen;
