import { Image } from 'react-native';

const DEFAULT_FALLBACK_IMAGE = 'https://placehold.co/600x400/png';

/**
 * Converts an image URI to base64 string
 * Handles both local file URIs and remote URLs
 */
export const convertImageToBase64 = async (uri) => {
  if (!uri) return null;

  try {
    // For remote URLs, return as-is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // For local files, convert to base64
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to convert image to base64:', error);
    return null;
  }
};

/**
 * Gets image dimensions from URI for validation
 */
export const getImageDimensions = (uri) => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
};

/**
 * Validates image URI and returns metadata
 */
export const validateImageURI = async (uri) => {
  if (!uri) return null;

  try {
    const dimensions = await getImageDimensions(uri);
    return {
      uri,
      width: dimensions.width,
      height: dimensions.height,
      isValid: true,
    };
  } catch (error) {
    console.warn('Image validation failed:', error);
    return {
      uri,
      isValid: false,
      error,
    };
  }
};

/**
 * Ensures an image URL is valid and accessible
 * Returns fallback if image fails validation
 */
export const ensureImageURL = async (imageURL) => {
  if (!imageURL) return DEFAULT_FALLBACK_IMAGE;

  try {
    // If it's a remote URL, validate it's accessible
    if (imageURL.startsWith('http')) {
      const response = await fetch(imageURL, { method: 'HEAD' });
      if (response.ok) return imageURL;
    }

    // For local URIs, just return them (will be converted to base64 during API submission)
    if (!imageURL.startsWith('http')) {
      return imageURL;
    }

    return DEFAULT_FALLBACK_IMAGE;
  } catch (error) {
    console.warn('Image URL validation failed:', error);
    return DEFAULT_FALLBACK_IMAGE;
  }
};

/**
 * Prepares find payload with image processing for API submission
 */
export const prepareFindPayload = async (find) => {
  if (!find || typeof find !== 'object') return find;

  const payload = { ...find };
  const fallbackImage = DEFAULT_FALLBACK_IMAGE;

  // Handle FindImageURL
  if (payload.FindImageURL) {
    const isLocal = !payload.FindImageURL.startsWith('http');
    if (isLocal) {
      // Convert local images to base64
      try {
        const base64 = await convertImageToBase64(payload.FindImageURL);
        if (base64) {
          payload.FindImageURL = base64;
        } else {
          payload.FindImageURL = fallbackImage;
        }
      } catch (error) {
        console.warn('Failed to process find image:', error);
        payload.FindImageURL = fallbackImage;
      }
    }
    // Remote URLs stay as-is
  } else {
    // Ensure there's always an image
    payload.FindImageURL = fallbackImage;
  }

  return payload;
};

/**
 * Gets display-friendly image URL
 * For local base64 data, returns it as-is
 * For remote URLs, returns the URL
 */
export const getImageDisplayURL = (uri) => {
  if (!uri) return DEFAULT_FALLBACK_IMAGE;
  return uri;
};

export default {
  convertImageToBase64,
  getImageDimensions,
  validateImageURI,
  ensureImageURL,
  prepareFindPayload,
  getImageDisplayURL,
  DEFAULT_FALLBACK_IMAGE,
};
