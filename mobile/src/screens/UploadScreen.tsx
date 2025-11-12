import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import apiClient from '../api/client';
import { IS_TABLET, spacing, responsiveFontSize } from '../utils/responsive';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.content, IS_TABLET && styles.contentTablet]}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📦</Text>
        </View>

        <Text style={styles.title}>Import Anki Deck</Text>
        <Text style={styles.description}>
          Select an .apkg file from your device to import your Anki flashcards.
          {IS_TABLET && '\n'}Files up to 800MB+ are supported.
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
          <TouchableOpacity
            style={[styles.button, IS_TABLET && styles.buttonTablet]}
            onPress={pickDocument}
          >
            <Text style={styles.buttonIcon}>📁</Text>
            <Text style={styles.buttonText}>Select .apkg File</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.infoBox, IS_TABLET && styles.infoBoxTablet]}>
          <Text style={styles.infoTitle}>✨ Supported Features</Text>
          <View style={IS_TABLET ? styles.infoGrid : undefined}>
            <View style={IS_TABLET ? styles.infoColumn : styles.infoItem}>
              <Text style={styles.infoItemText}>📝 Basic flashcards</Text>
              <Text style={styles.infoItemText}>📚 Multiple decks</Text>
            </View>
            <View style={IS_TABLET ? styles.infoColumn : styles.infoItem}>
              <Text style={styles.infoItemText}>💾 Large files (800MB+)</Text>
              <Text style={styles.infoItemText}>🧠 Spaced repetition</Text>
            </View>
          </View>
        </View>

        {IS_TABLET && (
          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💡 Tips for iPad</Text>
            <Text style={styles.tipsText}>
              • Rotate your device for different layouts{'\n'}
              • Use split-screen for better multitasking{'\n'}
              • Larger cards make reviewing easier on iPad
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentTablet: {
    padding: spacing.xxl,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconText: {
    fontSize: IS_TABLET ? 96 : 64,
  },
  title: {
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: responsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: responsiveFontSize(24),
    maxWidth: IS_TABLET ? 600 : undefined,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: IS_TABLET ? 400 : undefined,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonTablet: {
    padding: spacing.xl,
    borderRadius: 16,
  },
  buttonIcon: {
    fontSize: IS_TABLET ? 56 : 48,
    marginBottom: spacing.md,
  },
  buttonText: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#fff',
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    width: '100%',
    maxWidth: IS_TABLET ? 500 : undefined,
  },
  uploadingText: {
    fontSize: responsiveFontSize(16),
    color: '#333',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: IS_TABLET ? 12 : 8,
    backgroundColor: '#e0e0e0',
    borderRadius: IS_TABLET ? 6 : 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: IS_TABLET ? 6 : 4,
  },
  progressText: {
    fontSize: responsiveFontSize(18),
    fontWeight: '600',
    color: '#007AFF',
  },
  infoBox: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    width: '100%',
    maxWidth: IS_TABLET ? 600 : undefined,
  },
  infoBoxTablet: {
    borderRadius: 16,
    padding: spacing.xl,
  },
  infoTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  infoColumn: {
    flex: 1,
  },
  infoItem: {
    marginBottom: spacing.xs,
  },
  infoItemText: {
    fontSize: responsiveFontSize(14),
    color: '#666',
    lineHeight: responsiveFontSize(22),
    marginBottom: spacing.xs,
  },
  tipsBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB800',
    width: '100%',
    maxWidth: 600,
  },
  tipsTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: spacing.sm,
  },
  tipsText: {
    fontSize: responsiveFontSize(14),
    color: '#666',
    lineHeight: responsiveFontSize(22),
  },
});
