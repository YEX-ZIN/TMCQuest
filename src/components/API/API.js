const API = {};

const GEOQUEST_BASE_URL = process.env.EXPO_PUBLIC_GEOQUEST_API_BASE || 'https://mark0s.com/geoquest/v1/api';
const GEOQUEST_API_KEY = process.env.EXPO_PUBLIC_GEOQUEST_API_KEY || '16gv8f';

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

const callFetch = async (endpoint, method, dataObj = null) => {
  // Build request object
  let requestObj = { method: method }; // GET, POST, PUT or DELETE
  if (dataObj)
    requestObj = {
      ...requestObj,
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(dataObj),
    };

  // Call the fetch and process the return
  try {
    let result = null;
    const response = await fetch(endpoint, requestObj);
    if (response.status !== 204) result = await response.json();
    return response.status >= 200 && response.status < 300
      ? { isSuccess: true, result }
      : { isSuccess: false, message: `${result.message}` };
  } catch (error) {
    return { isSuccess: false, message: error.message };
  }
};
