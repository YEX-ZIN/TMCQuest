import useStore from './useStore';

const useCurrentUser = () => useStore('geoquest_current_user', null);

export default useCurrentUser;