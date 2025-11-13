import * as faceapi from 'face-api.js';

let modelsLoaded = false;

/**
 * Load face-api.js models (called once on app init)
 */
export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoaded) {
    console.log('✅ Models already loaded');
    return true;
  }

  try {
    console.log('📥 Loading face-api.js models from /models...');
    
    // Use the correct model loading with verbose logging
    const modelsToLoad = [
      faceapi.nets.tinyFaceDetector.loadFromUri('/models').then(() => console.log('✅ TinyFaceDetector loaded')),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models').then(() => console.log('✅ FaceLandmark68 loaded')),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models').then(() => console.log('✅ FaceRecognitionNet loaded')),
    ];
    
    await Promise.all(modelsToLoad);

    modelsLoaded = true;
    console.log('✅ All face-api.js models loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading face-api.js models:', error);
    console.error('Error details:', error);
    return false;
  }
}

/**
 * Get face descriptor from image data URL
 */
export async function getFaceDescriptor(imageData: string): Promise<number[] | null> {
  try {
    console.log('🔍 getFaceDescriptor called, modelsLoaded:', modelsLoaded);
    
    if (!modelsLoaded) {
      console.log('📥 Models not loaded, loading now...');
      const loaded = await loadFaceModels();
      if (!loaded) {
        console.error('❌ Failed to load models');
        return null;
      }
      console.log('✅ Models loaded successfully');
    }

    // Create image element
    const img = document.createElement('img');
    img.src = imageData;

    console.log('🖼️ Created image element, waiting for load...');
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        console.log('✅ Image loaded successfully');
        resolve(null);
      };
      img.onerror = (err) => {
        console.error('❌ Image load error:', err);
        reject(err);
      };
    });

    console.log('🔍 Starting face detection...');
    
    // Detect face and get descriptor
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    console.log('📊 Detection result:', {
      detected: !!detection,
      hasLandmarks: !!detection?.landmarks,
      hasDescriptor: !!detection?.descriptor
    });

    if (!detection) {
      console.error('❌ No face detected');
      return null;
    }

    // Convert Float32Array to regular array for JSON
    const descriptor = Array.from(detection.descriptor);
    console.log('✅ Descriptor extracted:', {
      length: descriptor.length,
      firstFew: descriptor.slice(0, 5)
    });
    
    return descriptor;
  } catch (error) {
    console.error('❌ Error getting face descriptor:', error);
    console.error('Error stack:', error);
    return null;
  }
}

/**
 * Validate that an image contains exactly one face
 */
export async function validateFaceInImage(imageData: string): Promise<{
  valid: boolean;
  error?: string;
  descriptor?: number[];
}> {
  try {
    const descriptor = await getFaceDescriptor(imageData);

    if (!descriptor) {
      return {
        valid: false,
        error: 'No face detected in the image'
      };
    }

    return {
      valid: true,
      descriptor
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Face validation failed'
    };
  }
}

/**
 * Compare two face descriptors (client-side comparison)
 * @param descriptor1 - First face descriptor as array
 * @param descriptor2 - Second face descriptor as array
 * @returns Distance between the descriptors (lower is better)
 */
export function compareFaceDescriptors(descriptor1: number[], descriptor2: number[]): number {
  return faceapi.euclideanDistance(new Float32Array(descriptor1), new Float32Array(descriptor2));
}

/**
 * Verify face on client side by comparing with registered face
 */
export async function verifyFaceClient(
  capturedImage: string, 
  registeredDescriptorString: string
): Promise<{
  match: boolean;
  confidence: number;
  error?: string;
}> {
  try {
    console.log('🔐 verifyFaceClient started');
    
    // Ensure models are loaded
    if (!modelsLoaded) {
      console.log('📥 Models not loaded, loading now...');
      const loaded = await loadFaceModels();
      if (!loaded) {
        console.error('❌ Failed to load models');
        return {
          match: false,
          confidence: 0,
          error: 'Face recognition models not loaded'
        };
      }
      console.log('✅ Models loaded');
    }
    
    // Get descriptor from captured image
    console.log('📸 Getting descriptor from captured image...');
    const capturedDescriptor = await getFaceDescriptor(capturedImage);
    
    if (!capturedDescriptor) {
      console.error('❌ No face detected in captured image');
      return {
        match: false,
        confidence: 0,
        error: 'No face detected in captured image'
      };
    }
    
    console.log('✅ Captured descriptor extracted');

    // Parse registered descriptor
    console.log('📋 Parsing registered descriptor...');
    console.log('Registered descriptor string length:', registeredDescriptorString?.length);
    console.log('Registered descriptor preview:', registeredDescriptorString?.substring(0, 100));
    
    let registeredDescriptor;
    
    // Check if it's an image data URL or a descriptor string
    if (registeredDescriptorString.startsWith('data:image')) {
      console.log('⚠️ Registered face is an image, extracting descriptor...');
      // It's an image, extract the descriptor first
      registeredDescriptor = await getFaceDescriptor(registeredDescriptorString);
      if (!registeredDescriptor) {
        return {
          match: false,
          confidence: 0,
          error: 'Could not extract descriptor from registered face image'
        };
      }
      console.log('✅ Registered descriptor extracted from image, length:', registeredDescriptor.length);
    } else {
      // It's a descriptor string, parse it
      try {
        registeredDescriptor = JSON.parse(registeredDescriptorString);
        console.log('✅ Registered descriptor parsed, length:', registeredDescriptor?.length);
      } catch (parseError) {
        console.error('❌ Failed to parse registered descriptor:', parseError);
        return {
          match: false,
          confidence: 0,
          error: 'Invalid registered face data'
        };
      }
    }

    // Compare using face-api.js
    console.log('🔍 Comparing descriptors...');
    const distance = compareFaceDescriptors(capturedDescriptor, registeredDescriptor);
    console.log('📊 Distance:', distance);

    // Threshold for face-api.js (0.6 is typical)
    const THRESHOLD = 0.6;
    const confidence = Math.max(0, 100 * (1 - distance / THRESHOLD));
    const isMatch = distance < THRESHOLD;
    
    console.log('🎯 Verification result:', {
      match: isMatch,
      confidence: Math.round(confidence),
      distance
    });

    return {
      match: isMatch,
      confidence: Math.round(confidence)
    };
  } catch (error: any) {
    console.error('❌ verifyFaceClient error:', error);
    return {
      match: false,
      confidence: 0,
      error: error.message || 'Face verification failed'
    };
  }
}


