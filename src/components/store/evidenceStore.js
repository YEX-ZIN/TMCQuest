import AsyncStorage from '@react-native-async-storage/async-storage';

const EVIDENCE_STORE_KEY = 'geoquest_evidence_photos';

const parseEvidenceMap = (json) => {
  if (!json) return {};

  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
};

export const loadEvidenceMap = async () => {
  const json = await AsyncStorage.getItem(EVIDENCE_STORE_KEY);
  return parseEvidenceMap(json);
};

export const saveEvidenceEntry = async ({
  cacheID,
  uri,
  capturedAt,
  eventID = null,
  isPublic = false,
}) => {
  if (cacheID === null || cacheID === undefined || !uri) return null;

  const map = await loadEvidenceMap();
  const cacheKey = String(cacheID);
  const entry = {
    cacheID,
    uri,
    capturedAt: capturedAt || new Date().toISOString(),
    eventID,
    isPublic: Boolean(isPublic),
  };

  const updated = {
    ...map,
    [cacheKey]: entry,
  };

  await AsyncStorage.setItem(EVIDENCE_STORE_KEY, JSON.stringify(updated));
  return entry;
};

export const clearEvidenceForEvent = async (eventID) => {
  if (eventID === null || eventID === undefined) return;

  const map = await loadEvidenceMap();
  const eventKey = String(eventID);

  const filteredEntries = Object.entries(map).filter(([, entry]) => {
    const entryEventID = entry?.eventID;
    if (entryEventID === null || entryEventID === undefined) return true;
    return String(entryEventID) !== eventKey;
  });

  const updated = Object.fromEntries(filteredEntries);
  await AsyncStorage.setItem(EVIDENCE_STORE_KEY, JSON.stringify(updated));
};
