import { addDoc, collection, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection name
const USERS_COLLECTION = 'users';

/**
 * Save user profile data to Firestore
 * @param {string} userId - Unique user ID
 * @param {object} profileData - User profile data
 * @returns {Promise<string>} - Document ID
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    console.log('Attempting to save user profile...');
    console.log('User ID:', userId);
    console.log('Profile data keys:', Object.keys(profileData));
    
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    
    const userData = {
      ...profileData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      profileCompleted: true,
    };
    
    console.log('Saving to Firestore...');
    await setDoc(userDocRef, userData);
    console.log('User profile saved successfully with ID:', userId);
    return userId;
  } catch (error) {
    console.error('Error saving user profile:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new Error(`Failed to save user profile: ${error.message}`);
  }
};

/**
 * Get user profile data from Firestore
 * @param {string} userId - Unique user ID
 * @returns {Promise<object|null>} - User profile data or null if not found
 */
export const getUserProfile = async (userId) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(userDocRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No user profile found for ID:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
};

/**
 * Update user profile data in Firestore
 * @param {string} userId - Unique user ID
 * @param {object} updatedData - Updated profile data
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, updatedData) => {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    
    const updateData = {
      ...updatedData,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(userDocRef, updateData);
    console.log('User profile updated successfully for ID:', userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

/**
 * Create a new user profile document
 * @param {object} profileData - User profile data
 * @returns {Promise<string>} - Document ID
 */
export const createUserProfile = async (profileData) => {
  try {
    const userData = {
      ...profileData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      profileCompleted: true,
    };
    
    const docRef = await addDoc(collection(db, USERS_COLLECTION), userData);
    console.log('User profile created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
};
