import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
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

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && !formData.photo) {
      Alert.alert('Photo Required', 'Please add your photo to continue.');
      return;
    }
    if (currentStep === 2 && (!formData.fullName || !formData.nationality)) {
      Alert.alert('Required Fields', 'Please fill in your name and nationality.');
      return;
    }
    if (currentStep === 3 && !formData.passportNumber) {
      Alert.alert('Required Field', 'Please enter your passport number.');
      return;
    }
    if (currentStep === 4 && (!formData.age || !formData.gender)) {
      Alert.alert('Required Fields', 'Please fill in your age and gender.');
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
        'Profile Created! 🎉',
        'Your profile has been saved successfully. Welcome to Guardio!',
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
        'Failed to create your profile. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Error saving profile:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#7C3AED', '#9333EA']}
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
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Step {currentStep} of {totalSteps}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
            </View>
            <View style={styles.stepsIndicator}>
              {[1, 2, 3, 4].map((step) => (
                <View key={step} style={styles.stepDot}>
                  <View style={[
                    styles.stepCircle,
                    currentStep >= step && styles.stepCircleActive,
                    currentStep === step && styles.stepCircleCurrent
                  ]}>
                    {currentStep > step ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                        {step}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Step 1: Photo Upload */}
            {currentStep === 1 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="camera-outline" size={24} color="#7C3AED" />
                  <Text style={styles.sectionTitle}>Profile Photo</Text>
                </View>

                <View style={styles.photoSection}>
                  <Text style={styles.fieldLabel}>Profile Photo *</Text>
                  <TouchableOpacity style={styles.photoContainer} onPress={showPhotoOptions}>
                    {formData.photo ? (
                      <Image source={{ uri: formData.photo }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.photoPlaceholderText}>Add your photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.fieldNote}>
                    This helps us verify your identity
                  </Text>
                </View>
              </>
            )}

            {/* Step 2: Name and Nationality */}
            {currentStep === 2 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-circle-outline" size={24} color="#7C3AED" />
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                </View>

                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Full Name *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#7C8BA0" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9CA3AF"
                      value={formData.fullName}
                      onChangeText={(value) => handleInputChange('fullName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Nationality */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Nationality *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="flag-outline" size={20} color="#7C8BA0" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your country"
                      placeholderTextColor="#9CA3AF"
                      value={formData.nationality}
                      onChangeText={(value) => handleInputChange('nationality', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </>
            )}

            {/* Step 3: Passport and Government ID */}
            {currentStep === 3 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={24} color="#7C3AED" />
                  <Text style={styles.sectionTitle}>Identity Documents</Text>
                </View>

                {/* Passport Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Passport Number *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="document-outline" size={20} color="#7C8BA0" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Passport number"
                      placeholderTextColor="#9CA3AF"
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
                    <Ionicons name="card-outline" size={20} color="#7C8BA0" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="National ID, Driver's license, etc."
                      placeholderTextColor="#9CA3AF"
                      value={formData.governmentId}
                      onChangeText={(value) => handleInputChange('governmentId', value)}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Step 4: Age and Gender */}
            {currentStep === 4 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person-outline" size={24} color="#7C3AED" />
                  <Text style={styles.sectionTitle}>Additional Details</Text>
                </View>

                {/* Age and Gender Row */}
                <View style={styles.rowContainer}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.fieldLabel}>Age *</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#7C8BA0" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Age"
                        placeholderTextColor="#9CA3AF"
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
                      <Ionicons name="person-outline" size={20} color="#7C8BA0" style={styles.inputIcon} />
                      <Text style={[styles.input, { paddingTop: 15, color: formData.gender ? '#1A1A2E' : '#9CA3AF' }]}>
                        {formData.gender || 'Select'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#7C8BA0" />
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

                {/* Security Notice */}
                <View style={styles.securityNotice}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
                  <View style={styles.noticeTextContainer}>
                    <Text style={styles.noticeTitle}>Secure & Private</Text>
                    <Text style={styles.noticeText}>
                      Your information is encrypted and stored securely. We protect your privacy.
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={[styles.navButton, styles.previousButton]}
                  onPress={handlePrevious}
                >
                  <Text style={[styles.navButtonText, styles.previousButtonText]}>Previous</Text>
                </TouchableOpacity>
              )}
              
              {currentStep < totalSteps ? (
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton, currentStep === 1 && { flex: 1 }]}
                  onPress={handleNext}
                >
                  <Text style={[styles.navButtonText, styles.nextButtonText]}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.navButton, styles.nextButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={[styles.navButtonText, styles.nextButtonText]}>
                    {loading ? 'Saving...' : 'Complete Profile'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 20,
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
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginLeft: 12,
  },
  photoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  fieldNote: {
    fontSize: 12,
    color: '#7C8BA0',
    marginTop: 8,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F7FA',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 13,
    color: '#7C8BA0',
    marginTop: 8,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#1A1A2E',
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
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 18,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  noticeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#7C3AED',
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
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Progress bar styles
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  stepDot: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#fff',
  },
  stepCircleCurrent: {
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  stepNumberActive: {
    color: '#7C3AED',
  },
  // Navigation button styles
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previousButtonText: {
    color: '#6B7280',
  },
  nextButtonText: {
    color: '#fff',
  },
});
