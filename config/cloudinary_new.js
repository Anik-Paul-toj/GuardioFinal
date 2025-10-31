// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: 'dapalnm6r',
  apiKey: '463174385936929',
  apiSecret: 'Ueq99NIXDLchPR_v16HDYqHauCY',
  uploadPreset: 'guardio_unsigned', // You need to create this in Cloudinary dashboard
};

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

/**
 * Upload image to Cloudinary using unsigned upload preset
 * To create the preset:
 * 1. Go to Cloudinary Dashboard → Settings → Upload
 * 2. Click "Add upload preset"
 * 3. Set Name: "guardio_unsigned"
 * 4. Set Signing Mode: "Unsigned" 
 * 5. Set folder: "guardio/profiles"
 * 6. Save
 */
export const uploadToCloudinaryWithPreset = async (imageUri) => {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `profile_${Date.now()}.jpg`,
    });
    formData.append('upload_preset', 'guardio_unsigned');

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Simple image upload to Cloudinary (for demo purposes)
 * Falls back to local URI if Cloudinary upload fails
 * @param {string} imageUri - Local image URI
 * @returns {Promise<string>} - Cloudinary image URL or local URI as fallback
 */
export const uploadImageSimple = async (imageUri) => {
  try {
    // First try with unsigned preset
    return await uploadToCloudinaryWithPreset(imageUri);
  } catch (error) {
    console.log('Cloudinary upload failed, using local image URI as fallback');
    console.error('Error uploading image to Cloudinary:', error);
    // Return local URI as fallback for demo purposes
    return imageUri;
  }
};
