'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Loader2, QrCode, Clock, Smartphone } from 'lucide-react';

interface QRUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (imageUrl: string) => void;
  type: 'studentId' | 'selfie';
}

interface SessionData {
  sessionId: string;
  uploadUrl: string;
  qrCode: string;
  type: string;
  expiresAt: string;
  message: string;
}

interface SessionStatus {
  sessionId: string;
  status: 'pending' | 'uploaded' | 'expired';
  type: string;
  uploadedImageUrl?: string;
  expiresAt: string;
}

const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  infoBox: "bg-blue-100 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
};

export default function QRUploadModal({ isOpen, onClose, onSuccess, type }: QRUploadModalProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<'generating' | 'ready' | 'waiting' | 'uploaded' | 'expired' | 'error'>('generating');
  const [message, setMessage] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  // Use refs to store interval IDs to avoid circular dependencies
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount or close
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setSessionData(null);
    setStatus('generating');
    setMessage('');
    setTimeRemaining(0);
  }, []);

  const generateQRCode = useCallback(async () => {
    try {
      console.log('[QR-MODAL] Starting QR code generation for type:', type);
      setStatus('generating');
      setMessage('Generating QR code...');

      const response = await fetch('/api/qr-upload/generate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      console.log('[QR-MODAL] Generate session response status:', response.status);
      console.log('[QR-MODAL] Generate session response ok:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('[QR-MODAL] Generate session error:', error);
        throw new Error(error.error || 'Failed to generate QR code');
      }

      const data = await response.json();
      console.log('[QR-MODAL] Generated session data:', data);
      setSessionData(data);
      setStatus('ready');
      setMessage('Scan the QR code with your phone to upload your image');

      // Calculate time remaining
      const expiresAt = new Date(data.expiresAt).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      console.log('[QR-MODAL] Session expires in:', remaining, 'seconds');
      setTimeRemaining(remaining);

    } catch (error) {
      console.error('[QR-MODAL] Error generating QR code:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to generate QR code');
    }
  }, [type]);

  const checkSessionStatus = useCallback(async (currentSessionData: SessionData) => {
    try {
      console.log('[QR-MODAL] Checking session status for:', currentSessionData.sessionId);
      
      const response = await fetch(`/api/qr-upload/generate-session?sessionId=${currentSessionData.sessionId}`);
      
      console.log('[QR-MODAL] Status check response status:', response.status);
      console.log('[QR-MODAL] Status check response ok:', response.ok);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[QR-MODAL] Status check error:', error);
        throw new Error('Failed to check session status');
      }

      const status: SessionStatus = await response.json();
      console.log('[QR-MODAL] Session status:', status);

      if (status.status === 'uploaded' && status.uploadedImageUrl) {
        console.log('[QR-MODAL] Image uploaded successfully:', status.uploadedImageUrl);
        setStatus('uploaded');
        setMessage('Image uploaded successfully!');
        
        // Clear polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Notify parent component
        setTimeout(() => {
          onSuccess(status.uploadedImageUrl!);
          onClose();
        }, 2000);
      } else if (status.status === 'expired') {
        console.log('[QR-MODAL] Session expired');
        setStatus('expired');
        setMessage('Session has expired. Please try again.');
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('[QR-MODAL] Error checking session status:', error);
      // Don't show error for polling failures to avoid spam
    }
  }, [onSuccess, onClose]);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && !sessionData) {
      generateQRCode();
    }
  }, [isOpen, sessionData, generateQRCode]);

  // Start polling and timer when session is ready
  useEffect(() => {
    if (status === 'ready' && sessionData) {
      // Start polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(() => {
        checkSessionStatus(sessionData);
      }, 2000); // Poll every 2 seconds

      // Start timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            setStatus('expired');
            setMessage('QR code has expired. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [status, sessionData, checkSessionStatus]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen, cleanup]);

  const handleRetry = () => {
    cleanup();
    generateQRCode();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 bg-transparent border-none shadow-none">
        <div className={cartoonStyle.card}>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl font-bold text-center text-gray-900">
              Upload {type === 'studentId' ? 'Student ID' : 'Selfie'}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 font-medium">
              Scan the QR code with your phone to upload your image
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6">
            {/* Status Messages */}
            {message && (
              <div className={`p-4 rounded-lg border-2 text-center ${
                status === 'uploaded' 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : status === 'error' || status === 'expired'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'bg-blue-50 border-blue-300 text-blue-700'
              }`}>
                <div className="flex items-center justify-center space-x-2">
                  {status === 'generating' && <Loader2 className="h-5 w-5 animate-spin" />}
                  {status === 'uploaded' && <CheckCircle className="h-5 w-5" />}
                  {(status === 'error' || status === 'expired') && <AlertCircle className="h-5 w-5" />}
                  {status === 'ready' && <QrCode className="h-5 w-5" />}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}

            {/* QR Code Display */}
            {status === 'ready' && sessionData && (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Image 
                    src={sessionData.qrCode} 
                    alt="QR Code" 
                    width={256}
                    height={256}
                    className="mx-auto"
                  />
                </div>
                
                {/* Timer */}
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Expires in: {formatTime(timeRemaining)}</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {status === 'generating' && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600 font-medium">Setting up your upload session...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'uploaded' && (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
                <p className="text-gray-600">Your image has been uploaded and will be processed shortly.</p>
              </div>
            )}

            {/* Instructions */}
            {status === 'ready' && (
              <div className={cartoonStyle.infoBox + " p-4"}>
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-6 w-6 text-blue-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-blue-900 mb-2">How to use:</h4>
                    <ol className="text-sm font-medium text-blue-800 space-y-1">
                      <li>1. Open your phone&apos;s camera app</li>
                      <li>2. Point the camera at the QR code</li>
                      <li>3. Tap the link that appears</li>
                      <li>4. Take or select your {type === 'studentId' ? 'student ID photo' : 'selfie'}</li>
                      <li>5. Upload the image</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {(status === 'error' || status === 'expired') && (
                <button
                  onClick={handleRetry}
                  className={`flex-1 px-4 py-3 font-bold ${cartoonStyle.buttonPrimary}`}
                >
                  Try Again
                </button>
              )}
              
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-3 font-bold text-black ${cartoonStyle.button}`}
              >
                {status === 'uploaded' ? 'Done' : 'Cancel'}
              </button>
            </div>

            {/* Session Info */}
            {sessionData && status === 'ready' && (
              <div className="text-center text-xs text-gray-500">
                <p>Session ID: {sessionData.sessionId.slice(0, 8)}...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 