import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import apiClient from '../api/client';

type UploadScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Upload'>;

interface Props {
  navigation: UploadScreenNavigationProp;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export default function UploadScreen({ navigation }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // On iOS, this will allow .apkg files
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      if (!file.name.endsWith('.apkg')) {
        Alert.alert('Invalid File', 'Please select an .apkg file');
        return;
      }

      setFileName(file.name);

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(file.uri);

      if (!fileInfo.exists) {
        Alert.alert('Error', 'File not found');
        return;
      }

      const fileSize = fileInfo.size || 0;

      // Decide whether to use chunked upload
      if (fileSize > 50 * 1024 * 1024) { // 50MB
        Alert.alert(
          'Large File Detected',
          'This file is large and will be uploaded in chunks. This may take a while.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue', onPress: () => uploadChunked(file.uri, file.name, fileSize) },
          ]
        );
      } else {
        uploadFile(file.uri, file.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const uploadFile = async (fileUri: string, fileName: string) => {
    setUploading(true);
    setProgress(0);

    try {
      await apiClient.uploadApkg(fileUri, fileName, (progress) => {
        setProgress(progress);
      });

      Alert.alert(
        'Success',
        'File uploaded successfully! Processing will continue in the background.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Decks'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadChunked = async (fileUri: string, fileName: string, fileSize: number) => {
    setUploading(true);
    setProgress(0);

    try {
      const sessionId = `upload_${Date.now()}`;
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);

        // Read chunk
        const chunk = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: start,
          length: end - start,
        });

        // Convert base64 to blob (this is a simplified version)
        const blob = new Blob([chunk], { type: 'application/octet-stream' });

        // Upload chunk
        await apiClient.uploadChunk(
          blob,
          sessionId,
          i,
          totalChunks,
          fileName,
          (chunkProgress) => {
            const overallProgress = ((i + chunkProgress / 100) / totalChunks) * 100;
            setProgress(overallProgress);
          }
        );
      }

      Alert.alert(
        'Success',
        'File uploaded successfully! Processing will continue in the background.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Decks'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Chunked upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Import Anki Deck</Text>
        <Text style={styles.description}>
          Select an .apkg file from your device to import your Anki flashcards.
          Files up to 800MB+ are supported.
        </Text>

        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.uploadingText}>Uploading {fileName}...</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={pickDocument}>
            <Text style={styles.buttonIcon}>📁</Text>
            <Text style={styles.buttonText}>Select .apkg File</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Supported Features:</Text>
          <Text style={styles.infoText}>
            • Basic flashcards (front/back){'\n'}
            • Multiple decks{'\n'}
            • Large files (800MB+){'\n'}
            • Spaced repetition scheduling
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  uploadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoBox: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
