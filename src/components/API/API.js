const API = {};

const GEOQUEST_BASE_URL = process.env.EXPO_PUBLIC_GEOQUEST_API_BASE || 'https://mark0s.com/geoquest/v1/api';
const GEOQUEST_API_KEY = process.env.EXPO_PUBLIC_GEOQUEST_API_KEY || 'n9suok';

const withKey = (url, key = GEOQUEST_API_KEY) => {
  if (/([?&])key=/.test(url)) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}key=${encodeURIComponent(key)}`;
};

const geoQuestEndpoint = (path = '', key = GEOQUEST_API_KEY) => {
  const safePath = `${path}`.startsWith('/') ? `${path}` : `/${path}`;
  return withKey(`${GEOQUEST_BASE_URL}${safePath}`, key);
};

API.geoQuest = {
  baseUrl: GEOQUEST_BASE_URL,
  key: GEOQUEST_API_KEY,
  endpoint: geoQuestEndpoint,
  users: (userID = null) => geoQuestEndpoint(userID ? `/users/${userID}` : '/users'),
  events: (eventID = null) => geoQuestEndpoint(eventID ? `/events/${eventID}` : '/events'),
  eventsByUser: (userID) => geoQuestEndpoint(`/events/users/${userID}`),
  status: () => geoQuestEndpoint('/status'),
  players: (playerID = null) => geoQuestEndpoint(playerID ? `/players/${playerID}` : '/players'),
  playersByEvent: (eventID) => geoQuestEndpoint(`/players/events/${eventID}`),
  caches: (cacheID = null) => geoQuestEndpoint(cacheID ? `/caches/${cacheID}` : '/caches'),
  cachesByEvent: (eventID) => geoQuestEndpoint(`/caches/events/${eventID}`),
  finds: (findID = null) => geoQuestEndpoint(findID ? `/finds/${findID}` : '/finds'),
  findsByEvent: (eventID) => geoQuestEndpoint(`/finds/events/${eventID}`),
  findsByPlayer: (playerID) => geoQuestEndpoint(`/finds/players/${playerID}`),
};

API.get = (endpoint) => callFetch(endpoint, 'GET');
API.post = (endpoint, data) => callFetch(endpoint, 'POST', data);
API.put = (endpoint, data) => callFetch(endpoint, 'PUT', data);
API.delete = (endpoint) => callFetch(endpoint, 'DELETE');

export default API;

const normaliseFindPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...payload };

  // GeoQuest spec uses FindImageURL for evidence media.
  if (next.FindEvidenceURL && !next.FindImageURL) {
    next.FindImageURL = next.FindEvidenceURL;
  }
  delete next.FindEvidenceURL;

  return next;
};

const normaliseCachePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...payload };

  if (next.CachePoints !== undefined) next.CachePoints = Number(next.CachePoints);
  if (next.CacheLatitude !== undefined) next.CacheLatitude = Number(next.CacheLatitude);
  if (next.CacheLongitude !== undefined) next.CacheLongitude = Number(next.CacheLongitude);

  return next;
};

const normaliseEventPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...payload };

  const toISO = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  };

  if (next.EventStart !== undefined) next.EventStart = toISO(next.EventStart);
  if (next.EventFinish !== undefined) next.EventFinish = toISO(next.EventFinish);

  return next;
};

const normaliseRequestPayload = (endpoint, payload) => {
  if (!payload || typeof payload !== 'object') return payload;

  if (endpoint.includes('/finds')) return normaliseFindPayload(payload);
  if (endpoint.includes('/caches')) return normaliseCachePayload(payload);
  if (endpoint.includes('/events')) return normaliseEventPayload(payload);
  return payload;
};

const readResponseBody = async (response) => {
  if (response.status === 204) return null;

  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return raw;
  }
};

const callFetch = async (endpoint, method, dataObj = null) => {
  // Build request object
  let requestObj = { method: method }; // GET, POST, PUT or DELETE
  if (dataObj) {
    const normalisedPayload = normaliseRequestPayload(endpoint, dataObj);
    requestObj = {
      ...requestObj,
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(normalisedPayload),
    };
  }

  // Call the fetch and process the return
  try {
    let result = null;
    const response = await fetch(endpoint, requestObj);
    result = await readResponseBody(response);

    const readMessage = (payload) => {
      if (!payload) return 'Request failed';
      if (typeof payload === 'string') return payload;
      if (Array.isArray(payload)) return payload.map((item) => `${item}`).join('\n');
      const msg = payload.message;
      if (Array.isArray(msg)) return msg.map((item) => `${item}`).join('\n');
      if (typeof msg === 'string') return msg;
      if (msg && typeof msg === 'object') return JSON.stringify(msg);
      return 'Request failed';
    };

    if (response.status >= 200 && response.status < 300) {
      return { isSuccess: true, result };
    }

    return {
      isSuccess: false,
      message: `${readMessage(result)}${response.status ? ` (HTTP ${response.status})` : ''}`,
    };
  } catch (error) {
    return { isSuccess: false, message: error.message };
  }
};
