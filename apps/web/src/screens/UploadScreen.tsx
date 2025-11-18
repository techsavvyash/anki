import { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import apiClient from '../services/api';
import { UPLOAD_LIMITS } from '@anki/constants';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const CHUNKED_UPLOAD_THRESHOLD = 50 * 1024 * 1024; // 50MB

export default function UploadScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file extension
    const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(fileExt as any)) {
      setError('Please select a valid .apkg file');
      return;
    }

    // Validate file size
    if (selectedFile.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
      setError(`File size must be less than ${UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
  };

  const uploadChunked = async (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let sessionId = '';

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const response = await apiClient.uploadChunk(
        chunk,
        sessionId,
        chunkIndex,
        totalChunks,
        file.name,
        (chunkProgress) => {
          const overallProgress =
            ((chunkIndex + chunkProgress / 100) / totalChunks) * 100;
          setProgress(Math.round(overallProgress));
        }
      );

      if (chunkIndex === 0 && response.session_id) {
        sessionId = response.session_id;
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      if (file.size >= CHUNKED_UPLOAD_THRESHOLD) {
        // Use chunked upload for large files
        await uploadChunked(file);
      } else {
        // Use direct upload for smaller files
        await apiClient.uploadApkg(file, (progress) => {
          setProgress(Math.round(progress));
        });
      }

      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Redirect to decks after a brief delay
      setTimeout(() => {
        navigate('/decks');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout title="Upload Deck">
      <div className="container-mobile py-6 space-y-6">
        {/* Instructions */}
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Import Anki Deck</h2>
          <p className="text-gray-600">
            Upload an .apkg file to import flashcards into your collection.
            Files up to 100MB are supported.
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Supports standard Anki .apkg files</li>
            <li>Large files are uploaded in chunks</li>
            <li>Processing happens in the background</li>
          </ul>
        </Card>

        {/* File Upload */}
        <Card className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    <span className="text-primary-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    .apkg files (up to 100MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".apkg"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>

            {file && !success && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="text-2xl">📄</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="ml-3 text-red-600 hover:text-red-700 p-2"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Uploading...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!uploading && (
                  <button
                    onClick={handleUpload}
                    className="w-full btn-primary"
                  >
                    Upload Deck
                  </button>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Error message */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Upload Failed</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Success message */}
        {success && (
          <Card className="bg-green-50 border-green-200 animate-slide-up">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">✅</div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Upload Successful!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your deck is being processed. Redirecting to decks...
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
