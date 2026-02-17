import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { StackNavigationProp } from '@react-navigation/stack';
import { API_URL, API_TIMEOUT } from '../config';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Verification: undefined;
};

type VerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Verification'>;

interface Props {
  navigation: VerificationScreenNavigationProp;
}

export default function VerificationScreen({ navigation }: Props) {
  const [type, setType] = useState(CameraType.front);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        setError('Failed to request camera permission');
      }
    })();
  }, []);

  const verifyFromPreview = async () => {
    if (!cameraRef.current) {
      setError('Camera not initialized');
      return;
    }
    
    try {
      setIsVerifying(true);
      setError(null);
      
      // Take a frame from the camera preview with correct orientation
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
        skipProcessing: true,
        
      });
      
      if (!photo.base64) {
        throw new Error('Failed to capture image');
      }
      
      await handleVerification(photo.base64);
    } catch (error: any) {
      console.error('Error during verification:', error);
      let errorMessage = 'Failed to verify face. Please try again.';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timed out. Please check your internet connection and try again.';
        } else if (error.response) {
          errorMessage = `Server error: ${error.response.data?.detail || error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'No response from server. Please check your connection and try again.';
        }
      }
      
      setError(errorMessage);
      Alert.alert('Verification Error', errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerification = async (base64Image: string) => {
    try {
      console.log('Starting verification process...');
      const formData = new FormData();
      const imageUri = `${FileSystem.documentDirectory}temp_photo.jpg`;
      
      await FileSystem.writeAsStringAsync(imageUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Failed to save image');
      }

      formData.append('file', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg'
      } as any);

      console.log('Sending verification request to:', `${API_URL}/verify`);
      const response = await axios.post(`${API_URL}/verify`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: API_TIMEOUT,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      console.log('Verification response:', response.data);

      if (response.data.verified) {
        Alert.alert(
          'Verification Successful',
          `Welcome back ${response.data.employee.first_name} ${response.data.employee.last_name}!`,
          [{ 
            text: 'OK',
            onPress: () => navigation.replace('Main')
          }]
        );
      } else {
        setError(response.data.error || 'Face not recognized. Please try again.');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          code: error.code,
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Verification timed out. Please check your connection and try again.';
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = 'Cannot connect to the server. Please check your internet connection.';
        } else if (error.response?.status === 404) {
          errorMessage = 'No matching face found in the system.';
        } else if (error.response?.data?.detail) {
          errorMessage = `Server error: ${error.response.data.detail}`;
        }
      }
      
      setError(errorMessage);
      Alert.alert('Verification Error', errorMessage);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Button 
          mode="contained" 
          onPress={async () => {
            try {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === 'granted');
            } catch (error) {
              console.error('Error requesting camera permission:', error);
              setError('Failed to request camera permission');
            }
          }}
        >
          Request Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.camera}>
        <Camera
          ref={cameraRef}
          style={styles.cameraPreview}
          type={CameraType.front}
        >
          <View style={styles.overlay}>
            <View style={styles.faceGuide} />
            <Text style={styles.instructionText}>
              Position your face in the center
            </Text>
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.captureButton,
                  isVerifying && styles.captureButtonDisabled
                ]}
                onPress={verifyFromPreview}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Text style={styles.captureText}>Verify Face</Text>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isVerifying}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraPreview: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  faceGuide: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    width: '70%',
    height: '50%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 200,
  },
  instructionText: {
    position: 'absolute',
    top: '15%',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
  captureButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    minWidth: 120,
  },
  captureText: {
    color: '#fff',
    fontSize: 18,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 5,
    zIndex: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    position: 'absolute',
    top: '80%',
    width: '100%',
    textAlign: 'center',
    color: '#ff6b6b',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
});
