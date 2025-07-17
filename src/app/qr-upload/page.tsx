'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const mobileStyle = {
  card: "bg-white border-2 border-gray-300 rounded-xl shadow-lg p-4 m-4",
  button: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors",
  buttonSecondary: "w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors",
  buttonSuccess: "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors",
  uploadArea: "border-2 border-dashed border-gray-400 rounded-lg p-6 text-center bg-gray-50"
};

interface SessionInfo {
  sessionId: string;
  type: 'studentId' | 'selfie';
  status: 'pending' | 'uploaded' | 'expired';
  expiresAt: string;
}

function QRUploadContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session');
  
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchSessionInfo = useCallback(async () => {
    try {
      console.log('[QR-UPLOAD-CLIENT] Fetching session info for sessionId:', sessionId);
      
      const response = await fetch(`/api/qr-upload/upload?sessionId=${sessionId}`);
      
      console.log('[QR-UPLOAD-CLIENT] Response status:', response.status);
      console.log('[QR-UPLOAD-CLIENT] Response ok:', response.ok);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[QR-UPLOAD-CLIENT] Error response:', error);
        throw new Error(error.error || 'Failed to fetch session info');
      }
      
      const data = await response.json();
      console.log('[QR-UPLOAD-CLIENT] Session data received:', data);
      setSessionInfo(data);
      
      if (data.status === 'uploaded') {
        setMessage({ 
          type: 'success', 
          text: `${data.type === 'studentId' ? 'Student ID' : 'Selfie'} has already been uploaded successfully!` 
        });
      } else if (data.status === 'expired') {
        setMessage({ type: 'error', text: 'This upload session has expired' });
      }
    } catch (error) {
      console.error('[QR-UPLOAD-CLIENT] Error fetching session info:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load session' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Fetch session info on component mount
  useEffect(() => {
    if (!sessionId) {
      setMessage({ type: 'error', text: 'No session ID provided in URL' });
      setIsLoading(false);
      return;
    }

    fetchSessionInfo();
  }, [sessionId, fetchSessionInfo]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMessage(null);
  };

  const handleTakePhoto = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleSelectFromGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !sessionInfo) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sessionId', sessionInfo.sessionId);

      const response = await fetch('/api/qr-upload/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setMessage({ 
        type: 'success', 
        text: result.message || 'Upload successful!' 
      });
      
      // Update session info
      setSessionInfo(prev => prev ? { ...prev, status: 'uploaded' } : null);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Upload failed' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className={mobileStyle.card}>
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading upload session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className={mobileStyle.card}>
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Session Not Found</h2>
              <p className="text-gray-600">
                {message?.text || 'The upload session could not be found or has expired.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionInfo.status === 'uploaded') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className={mobileStyle.card}>
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Complete!</h2>
              <p className="text-gray-600">
                Your {sessionInfo.type === 'studentId' ? 'student ID' : 'selfie'} has been uploaded successfully.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                You can now close this page and return to the main application.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Card className={mobileStyle.card}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Upload {sessionInfo.type === 'studentId' ? 'Student ID' : 'Selfie'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {sessionInfo.type === 'studentId' 
                ? 'Take a clear photo of your student ID card' 
                : 'Take a clear selfie for verification'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Success/Error Message */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : message.type === 'error'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-blue-50 border-blue-300 text-blue-700'
              }`}>
                <p className="font-medium text-center">{message.text}</p>
              </div>
            )}

            {/* Upload Area */}
            {!selectedFile ? (
              <div className={mobileStyle.uploadArea}>
                <div className="space-y-4">
                  <Camera className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Choose Upload Method
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Take a photo with your camera or select from your gallery
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleTakePhoto}
                      disabled={isUploading}
                      className={mobileStyle.button}
                    >
                      <Camera className="h-5 w-5 mr-2 inline" />
                      Take Photo with Camera
                    </button>
                    
                    <button
                      onClick={handleSelectFromGallery}
                      disabled={isUploading}
                      className={mobileStyle.buttonSecondary}
                    >
                      <Upload className="h-5 w-5 mr-2 inline" />
                      Select from Gallery
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                {previewUrl && (
                  <div className="relative">
                    <div className="relative w-full h-64">
                      <Image
                        src={previewUrl}
                        alt="Selected image"
                        fill
                        className="object-cover rounded-lg border-2 border-gray-300"
                      />
                    </div>
                  </div>
                )}
                
                {/* File Info */}
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={mobileStyle.buttonSuccess}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 inline animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2 inline" />
                        Upload Image
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={removeFile}
                    disabled={isUploading}
                    className={mobileStyle.buttonSecondary}
                  >
                    Choose Different Image
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {sessionInfo.type === 'studentId' ? (
                  <>
                    <li>• Ensure all text is clearly readable</li>
                    <li>• Keep the card flat and well-lit</li>
                    <li>• Avoid shadows and glare</li>
                    <li>• Make sure the entire card is visible</li>
                  </>
                ) : (
                  <>
                    <li>• Face the camera directly</li>
                    <li>• Ensure good lighting</li>
                    <li>• Remove sunglasses or face coverings</li>
                    <li>• Keep a neutral expression</li>
                  </>
                )}
              </ul>
            </div>

            {/* Session Info */}
            <div className="text-center text-xs text-gray-500">
              <p>Session expires at: {new Date(sessionInfo.expiresAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className={mobileStyle.card}>
        <CardContent className="flex flex-col items-center space-y-4 pt-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function QRUploadPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <QRUploadContent />
    </Suspense>
  );
} 