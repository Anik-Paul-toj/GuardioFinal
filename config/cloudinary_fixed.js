// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: 'dapalnm6r',
  apiKey: '463174385936929',
  apiSecret: 'Ueq99NIXDLchPR_v16HDYqHauCY',
};

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

/**
 * Simple image upload to Cloudinary (for demo purposes)
 * Falls back to local URI if Cloudinary upload fails
 * @param {string} imageUri - Local image URI
 * @returns {Promise<string>} - Cloudinary image URL or local URI as fallback
 */
export const uploadImageSimple = async (imageUri) => {
  try {
    // For demo, let's try a simple approach with just the file
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `profile_${Date.now()}.jpg`,
    });
    
    // Try with the default ml_default preset (which is usually enabled)
    formData.append('upload_preset', 'ml_default');

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.error) {
      console.log('Cloudinary upload failed:', data.error.message);
      // Return local URI as fallback
      return imageUri;
    }

    console.log('Image uploaded to Cloudinary successfully:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.log('Cloudinary upload failed, using local image URI as fallback');
    console.error('Error uploading image to Cloudinary:', error);
    // Return local URI as fallback for demo purposes
    return imageUri;
  }
};
