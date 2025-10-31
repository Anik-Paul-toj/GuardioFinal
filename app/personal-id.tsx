import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { uploadImageSimple } from '../config/cloudinary';
import { auth } from '../config/firebase';
import { saveUserProfile } from '../services/userService';

export default function PersonalIdentificationScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    nationality: '',
    passportNumber: '',
    governmentId: '',
    age: '',
    gender: '',
    photo: null as string | null,
  });
  const [loading, setLoading] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = auth.currentUser;
      console.log('Personal ID Screen - Current user:', currentUser);
      
      if (!currentUser) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to access your personal identification form.',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/auth'),
            },
          ]
        );
      }
    };

    checkAuth();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera permissions to take your photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, photo: result.assets[0].uri }));
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add your photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    const { fullName, nationality, passportNumber, age, gender, photo } = formData;
    
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    
    if (!nationality.trim()) {
      Alert.alert('Error', 'Please enter your nationality');
      return false;
    }
    
    if (!passportNumber.trim()) {
      Alert.alert('Error', 'Please enter your passport number');
      return false;
    }
    
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) {
      Alert.alert('Error', 'Please enter a valid age');
      return false;
    }
    
    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return false;
    }
    
    if (!photo) {
      Alert.alert('Error', 'Please add your photo for ID verification');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      console.log('Current user:', currentUser);
      console.log('User authenticated:', !!currentUser);
      console.log('User UID:', currentUser?.uid);
      
      if (!currentUser) {
        setLoading(false);
        Alert.alert(
          'Authentication Required',
          'Please sign in again to save your profile.',
          [
            {
              text: 'Sign In',
              onPress: () => router.replace('/auth'),
            },
          ]
        );
        return;
      }
      
      const userId = currentUser.uid;
      console.log('Using authenticated user ID:', userId);
      
      let profileDataToSave = { ...formData };
      
      // Upload image to Cloudinary if photo exists
      if (formData.photo) {
        try {
          console.log('Uploading image...');
          const uploadedUrl = await uploadImageSimple(formData.photo);
          profileDataToSave.photo = uploadedUrl;
          
          // Check if it's a Cloudinary URL or local fallback
          if (uploadedUrl.includes('cloudinary.com')) {
            console.log('Image uploaded to Cloudinary successfully:', uploadedUrl);
          } else {
            console.log('Using local image URI as fallback:', uploadedUrl);
          }
        } catch (imageError) {
          console.error('Error with image:', imageError);
          // Use the original photo URI as fallback
          profileDataToSave.photo = formData.photo;
        }
      }
      
      // Save user profile to Firebase
      await saveUserProfile(userId, profileDataToSave);
      
      setLoading(false);
      Alert.alert(
        'Digital Tourist ID Created!',
        'Your profile has been saved successfully to Firebase database. Your digital tourist ID has been created and registered.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Error',
        'Failed to create your digital tourist ID. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Error saving profile:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#667eea']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Digital Tourist ID</Text>
            <Text style={styles.subtitle}>
              Create your blockchain-based identification
            </Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={24} color="#667eea" />
              <Text style={styles.sectionTitle}>Personal Identification</Text>
            </View>

            {/* Photo Upload */}
            <View style={styles.photoSection}>
              <Text style={styles.fieldLabel}>Tourist Photo *</Text>
              <TouchableOpacity style={styles.photoContainer} onPress={showPhotoOptions}>
                {formData.photo ? (
                  <Image source={{ uri: formData.photo }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera-outline" size={48} color="#888" />
                    <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.fieldNote}>
                Required for ID verification. Photo will be securely stored on blockchain.
              </Text>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Full Name (as per passport) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full legal name"
                  placeholderTextColor="#888"
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Nationality */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Nationality / Country of Origin *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="flag-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., United States, United Kingdom"
                  placeholderTextColor="#888"
                  value={formData.nationality}
                  onChangeText={(value) => handleInputChange('nationality', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Passport Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Passport Number *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter passport number"
                  placeholderTextColor="#888"
                  value={formData.passportNumber}
                  onChangeText={(value) => handleInputChange('passportNumber', value.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Government ID (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Government ID (Optional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Driver's license, National ID, etc."
                  placeholderTextColor="#888"
                  value={formData.governmentId}
                  onChangeText={(value) => handleInputChange('governmentId', value)}
                />
              </View>
            </View>

            {/* Age and Gender Row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.fieldLabel}>Age *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    placeholderTextColor="#888"
                    value={formData.age}
                    onChangeText={(value) => handleInputChange('age', value)}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.fieldLabel}>Gender *</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowGenderPicker(!showGenderPicker)}
                >
                  <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                  <Text style={[styles.input, { paddingTop: 15, color: formData.gender ? '#333' : '#888' }]}>
                    {formData.gender || 'Select gender'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Gender Picker */}
            {showGenderPicker && (
              <View style={styles.genderPicker}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.genderOption}
                    onPress={() => {
                      handleInputChange('gender', option);
                      setShowGenderPicker(false);
                    }}
                  >
                    <Text style={styles.genderOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Blockchain Notice */}
            <View style={styles.blockchainNotice}>
              <Ionicons name="shield-checkmark" size={24} color="#28a745" />
              <View style={styles.noticeTextContainer}>
                <Text style={styles.noticeTitle}>Blockchain Security</Text>
                <Text style={styles.noticeText}>
                  Your digital ID will be securely stored on blockchain technology, ensuring immutability and privacy protection.
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Digital ID...' : 'Create Digital Tourist ID'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  photoSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  genderPicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: -10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  genderOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  blockchainNotice: {
    flexDirection: 'row',
    backgroundColor: '#f8fff9',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#d4edda',
  },
  noticeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#155724',
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
