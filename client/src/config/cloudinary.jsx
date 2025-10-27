// Cloudinary configuration for media uploads (images and videos)
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dut8xkqb8',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '966631731617248',
  // Note: API Secret should not be used in frontend for security
  uploadPreset: 'fanshub_posts' // We'll create this preset in Cloudinary dashboard
};

// Upload image or video to Cloudinary
export const uploadToCloudinary = async (file) => {
  try {
    console.log('Starting Cloudinary upload for file:', file.name, 'Type:', file.type);
    console.log('Cloud name:', CLOUDINARY_CONFIG.cloudName);
    
    // Determine if it's a video or image
    const isVideo = file.type.startsWith('video/');
    const uploadEndpoint = isVideo ? 'video/upload' : 'image/upload';
    
    // Try multiple upload presets in order of preference
    const presets = ['fanshub_posts', 'ml_default', 'unsigned_preset'];
    
    for (let i = 0; i < presets.length; i++) {
      const preset = presets[i];
      console.log(`Attempting ${isVideo ? 'video' : 'image'} upload with preset: ${preset} (attempt ${i + 1}/${presets.length})`);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);
        formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
        
        // Add tags for organization
        formData.append('tags', `fanshub,post,upload,${isVideo ? 'video' : 'image'}`);
        
        // Add a folder structure
        formData.append('folder', `fanshub/posts/${isVideo ? 'videos' : 'images'}`);

        // For videos, add additional parameters
        if (isVideo) {
          formData.append('resource_type', 'video');
          // Optimize video for web playback
          formData.append('quality', 'auto');
          formData.append('fetch_format', 'auto');
        }

        console.log(`Sending ${isVideo ? 'video' : 'image'} request to Cloudinary...`);
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${uploadEndpoint}`,
          {
            method: 'POST',
            body: formData,
          }
        );

        console.log(`Cloudinary response for ${preset}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Cloudinary upload successful with preset:', preset, data);
          
          return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
            resourceType: data.resource_type,
            createdAt: data.created_at,
            preset: preset // Track which preset worked
          };
        } else {
          const errorData = await response.text();
          console.warn(`Preset ${preset} failed:`, errorData);
          
          // If this is the last preset and it failed, we'll try without preset
          if (i === presets.length - 1) {
            console.log('All presets failed, trying upload without preset...');
            return await uploadToCloudinaryWithoutPreset(file);
          }
          
          // Continue to next preset
          continue;
        }
      } catch (error) {
        console.warn(`Error with preset ${preset}:`, error.message);
        // Continue to next preset
        continue;
      }
    }
    
    // If all presets failed, try without preset
    return await uploadToCloudinaryWithoutPreset(file);
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Fallback upload without preset
const uploadToCloudinaryWithoutPreset = async (file) => {
  try {
    console.log('Attempting upload without preset...');
    
    const formData = new FormData();
    formData.append('file', file);
    // Remove upload_preset entirely
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Upload without preset failed:', errorData);
      
      // Provide helpful error message
      throw new Error(`All upload methods failed. Please create an unsigned upload preset named 'fanshub_posts' in your Cloudinary dashboard. Latest error: ${errorData}`);
    }

    const data = await response.json();
    console.log('Upload without preset successful:', data);
    
    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      resourceType: data.resource_type,
      createdAt: data.created_at,
      preset: 'none' // Indicate no preset was used
    };
  } catch (error) {
    console.error('Upload without preset error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate optimized image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 'auto',
    format = 'auto'
  } = options;

  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/${publicId}`;
};

// Generate thumbnail URL
export const getThumbnailUrl = (publicId, size = 300) => {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${size},h_${size},c_fill,q_auto,f_auto/${publicId}`;
};

export default CLOUDINARY_CONFIG;
