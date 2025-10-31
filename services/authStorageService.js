import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const USER_KEY = '@guardio_user';
const AUTH_TOKEN_KEY = '@guardio_auth_token';

/**
 * Save user data to AsyncStorage
 * @param {object} userData - User data to store
 * @returns {Promise<void>}
 */
export const saveUserToStorage = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    console.log('User data saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving user to AsyncStorage:', error);
    throw error;
  }
};

/**
 * Get user data from AsyncStorage
 * @returns {Promise<object|null>} - User data or null if not found
 */
export const getUserFromStorage = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    if (userData) {
      console.log('User data retrieved from AsyncStorage');
      return JSON.parse(userData);
    }
    console.log('No user data found in AsyncStorage');
    return null;
  } catch (error) {
    console.error('Error getting user from AsyncStorage:', error);
    return null;
  }
};

/**
 * Remove user data from AsyncStorage (logout)
 * @returns {Promise<void>}
 */
export const removeUserFromStorage = async () => {
  try {
    await AsyncStorage.multiRemove([USER_KEY, AUTH_TOKEN_KEY]);
    console.log('User data removed from AsyncStorage');
  } catch (error) {
    console.error('Error removing user from AsyncStorage:', error);
    throw error;
  }
};

/**
 * Save auth token to AsyncStorage
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    console.log('Auth token saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

/**
 * Get auth token from AsyncStorage
 * @returns {Promise<string|null>} - Auth token or null
 */
export const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Check if user is authenticated (has valid session)
 * @returns {Promise<boolean>}
 */
export const isUserAuthenticated = async () => {
  try {
    const userData = await getUserFromStorage();
    return userData !== null;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
