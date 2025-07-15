'use client';


import { Upload, FileImage, AlertCircle, Camera } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import QRUploadModal from '@/components/QRUploadModal';

const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  uploadArea: "border-4 border-dashed border-black rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all",
  infoBox: "bg-blue-100 border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
};

// Interface for verification status
interface VerificationStatus {
  id?: number;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  studentIdImageUrl?: string;
  selfieImageUrl?: string;
}

export default function StudentIDPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // QR modal states
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrUploadType, setQrUploadType] = useState<'studentId' | 'selfie'>('studentId');
  
  // Store QR uploaded image URLs temporarily
  const [qrStudentIdUrl, setQrStudentIdUrl] = useState<string | null>(null);
  const [qrSelfieUrl, setQrSelfieUrl] = useState<string | null>(null);

  // Verification status and confirmation states
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeType, setRemoveType] = useState<'studentId' | 'selfie'>('studentId');
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Check if verification is already submitted to database
  const isVerificationSubmitted = verificationStatus !== null;

  // Allow resubmission if status is rejected
  const canResubmit = verificationStatus?.verificationStatus === 'rejected';
  const isSubmissionDisabled = isVerificationSubmitted && !canResubmit;

  // Fetch existing verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        const response = await fetch('/api/student-verification');
        
        if (response.ok) {
          const data = await response.json();
          if (data.verification) {
            setVerificationStatus(data.verification);
            
            // If verification exists, load the existing images
            if (data.verification.studentIdImageUrl) {
              setQrStudentIdUrl(data.verification.studentIdImageUrl);
              setPreviewUrl(data.verification.studentIdImageUrl);
              // Create a mock file for display
              const fileName = data.verification.studentIdImageUrl.split('/').pop() || 'student-id.jpg';
              const mockFile = new File([''], fileName, { type: 'image/jpeg' });
              setSelectedFile(mockFile);
            }
            
            if (data.verification.selfieImageUrl) {
              setQrSelfieUrl(data.verification.selfieImageUrl);
              setSelfiePreviewUrl(data.verification.selfieImageUrl);
              // Create a mock file for display
              const fileName = data.verification.selfieImageUrl.split('/').pop() || 'selfie.jpg';
              const mockFile = new File([''], fileName, { type: 'image/jpeg' });
              setSelfieFile(mockFile);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchVerificationStatus();
  }, []);

  // Function to upload file to API
  const uploadFile = async (file: File, type: 'studentId' | 'selfie') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/student-verification', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if verification is already submitted and not rejected
    if (isSubmissionDisabled) {
      setMessage({ 
        type: 'error', 
        text: 'Cannot change files after submission. Your verification is under review by admin.' 
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setQrStudentIdUrl(null); // Clear QR URL if file is selected instead
    setMessage(null);
  };

  // Handle remove file with confirmation
  const handleRemoveFile = () => {
    if (isSubmissionDisabled) {
      setMessage({ 
        type: 'error', 
        text: 'Cannot remove files after submission. Your verification is under review by admin.' 
      });
      return;
    }
    
    setRemoveType('studentId');
    setShowRemoveConfirm(true);
  };

  // Handle remove selfie with confirmation
  const handleRemoveSelfie = () => {
    if (isSubmissionDisabled) {
      setMessage({ 
        type: 'error', 
        text: 'Cannot remove files after submission. Your verification is under review by admin.' 
      });
      return;
    }
    
    setRemoveType('selfie');
    setShowRemoveConfirm(true);
  };

  // Confirm removal
  const confirmRemoval = () => {
    if (removeType === 'studentId') {
      setSelectedFile(null);
      setPreviewUrl(null);
      setQrStudentIdUrl(null);
    } else {
      setSelfieFile(null);
      setSelfiePreviewUrl(null);
      setQrSelfieUrl(null);
    }
    setShowRemoveConfirm(false);
    setMessage(null);
  };

  // Cancel removal
  const cancelRemoval = () => {
    setShowRemoveConfirm(false);
  };

  const handleTakePhoto = () => {
    if (isSubmissionDisabled) {
      setMessage({ 
        type: 'error', 
        text: 'Cannot change files after submission. Your verification is under review by admin.' 
      });
      return;
    }
    
    setQrUploadType('studentId');
    setIsQRModalOpen(true);
  };

  const handleTakeSelfie = () => {
    if (isSubmissionDisabled) {
      setMessage({ 
        type: 'error', 
        text: 'Cannot change files after submission. Your verification is under review by admin.' 
      });
      return;
    }
    
    setQrUploadType('selfie');
    setIsQRModalOpen(true);
  };

  // Handle QR upload success - just store temporarily
  const handleQRUploadSuccess = async (imageUrl: string) => {
    try {
      if (qrUploadType === 'studentId') {
        setQrStudentIdUrl(imageUrl);
        // Create a fake file object for display
        const fileName = imageUrl.split('/').pop() || 'student-id.jpg';
        const mockFile = new File([''], fileName, { type: 'image/jpeg' });
        setSelectedFile(mockFile);
        setPreviewUrl(imageUrl);
        setMessage({ 
          type: 'success', 
          text: 'Student ID captured successfully! Click Submit to save.' 
        });
      } else if (qrUploadType === 'selfie') {
        setQrSelfieUrl(imageUrl);
        // Create a fake file object for display
        const fileName = imageUrl.split('/').pop() || 'selfie.jpg';
        const mockFile = new File([''], fileName, { type: 'image/jpeg' });
        setSelfieFile(mockFile);
        setSelfiePreviewUrl(imageUrl);
        setMessage({ 
          type: 'success', 
          text: 'Selfie captured successfully! Click Submit to save.' 
        });
      }
    } catch (error) {
      console.error('Error handling QR upload:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to process captured image. Please try again.' 
      });
    }
  };

  // Handle form submission
  const handleSubmitVerification = async () => {
    if (!selectedFile || !selfieFile) {
      setMessage({ type: 'error', text: 'Please upload both student ID and selfie before submitting.' });
      return;
    }

    if (isSubmissionDisabled) {
      setMessage({ 
        type: 'error', 
        text: 'Verification already submitted. Please wait for admin review.' 
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      let studentIdUrl = qrStudentIdUrl;
      let selfieUrl = qrSelfieUrl;

      // Upload student ID if it's a file (not from QR)
      if (!qrStudentIdUrl && selectedFile) {
        const studentIdResult = await uploadFile(selectedFile, 'studentId');
        studentIdUrl = studentIdResult.url;
      }

      // Upload selfie if it's a file (not from QR)
      if (!qrSelfieUrl && selfieFile) {
        const selfieResult = await uploadFile(selfieFile, 'selfie');
        selfieUrl = selfieResult.url;
      }

      // Save verification record to database
      const response = await fetch('/api/student-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'verification',
          studentIdImageUrl: studentIdUrl,
          selfieImageUrl: selfieUrl
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Submission failed');
      }

      await response.json();
      
      const successMessage = canResubmit 
        ? 'Verification resubmitted successfully! Your new application is now under review.' 
        : 'Verification submitted successfully! Your application is now under review.';
      
      setMessage({ 
        type: 'success', 
        text: successMessage
      });

      // Update verification status to prevent further changes
      setVerificationStatus({
        verificationStatus: 'pending',
        submittedAt: new Date().toISOString(),
        studentIdImageUrl: studentIdUrl || undefined,
        selfieImageUrl: selfieUrl || undefined
      });

    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Submission failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 font-bold text-black">Loading verification status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className={`${cartoonStyle.heading} text-gray-900 mb-2`}>Student ID & Selfie Verification</h1>
        <p className="text-gray-600 text-lg font-medium">
          Upload your student ID card and take a selfie to verify your student status and complete your seller registration.
        </p>
        
        {/* Verification Status Display */}
        {verificationStatus && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            verificationStatus.verificationStatus === 'approved' ? 'bg-green-50 border-green-300' :
            verificationStatus.verificationStatus === 'rejected' ? 'bg-red-50 border-red-300' :
            'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-black">
                  Status: <span className="capitalize">{verificationStatus.verificationStatus}</span>
                </p>
                {verificationStatus.rejectionReason && (
                  <p className="text-red-600 text-sm mt-1">{verificationStatus.rejectionReason}</p>
                )}
                {canResubmit && (
                  <p className="text-blue-600 text-sm mt-2 font-medium">
                    ✨ You can now upload new images and resubmit your verification.
                  </p>
                )}
              </div>
              <div className="text-2xl">
                {verificationStatus.verificationStatus === 'approved' ? '✅' :
                 verificationStatus.verificationStatus === 'rejected' ? '❌' : 
                 '⏳'}
              </div>
            </div>
          </div>
        )}
        
        {/* Success/Error Message */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg border-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-300 text-green-700' 
              : 'bg-red-50 border-red-300 text-red-700'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}
      </div>

      <div className={cartoonStyle.card}>
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-2">
            <FileImage className="h-6 w-6" />
            Upload Student ID Card
          </h2>
          <p className="text-gray-600 font-medium">
            Please upload a clear photo of your student ID card. Make sure all information is visible and readable.
          </p>
        </div>
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="space-y-2">
            <label htmlFor="studentId" className="block text-lg font-bold text-gray-900">Student ID Card Image</label>
            <div className={`${cartoonStyle.uploadArea} p-6 text-center`}>
              {!selectedFile ? (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-gray-600" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      Choose how to add your student ID
                    </p>
                    <p className="text-sm font-medium text-gray-600 mt-1">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                  <input
                    id="studentId"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting || isSubmissionDisabled}
                  />
                  <div className="flex gap-3 justify-center">
                    <label
                      htmlFor="studentId"
                      className={`inline-flex items-center justify-center text-sm font-bold h-12 px-6 py-3 cursor-pointer ${
                        (isSubmitting || isSubmissionDisabled)
                          ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                          : cartoonStyle.buttonPrimary
                      }`}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </label>
                    <button
                      onClick={handleTakePhoto}
                      disabled={isSubmitting || isSubmissionDisabled}
                      className={`inline-flex items-center justify-center text-sm font-bold h-12 px-6 py-3 ${
                        (isSubmitting || isSubmissionDisabled)
                          ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                          : cartoonStyle.buttonSuccess
                      }`}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {previewUrl && (
                    <div className="relative">
                      <Image
                        src={previewUrl}
                        alt="Student ID Preview"
                        width={256}
                        height={256}
                        className="max-h-64 mx-auto rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-contain"
                      />
                      {/* Status indicator */}
                      <div className={`absolute -top-2 -right-2 text-white rounded-full p-2 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        isVerificationSubmitted ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        {isVerificationSubmitted ? '📋' : '📋'}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{selectedFile.name}</p>
                    <p className="text-sm font-medium text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className={`text-sm font-medium mt-1 ${
                      isSubmissionDisabled ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {isSubmissionDisabled ? 
                        '📋 Submitted for verification - Under admin review' : 
                        canResubmit ?
                        '📋 Ready to resubmit - Click "Resubmit for Verification" to save' :
                        '📋 Ready to submit - Click "Submit for Verification" to save'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    disabled={isSubmitting}
                    className={`mt-2 px-4 py-2 text-sm font-bold ${
                      isSubmitting 
                        ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                        : isSubmissionDisabled
                        ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                        : cartoonStyle.button + ' text-black'
                    }`}
                  >
                    Remove File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Selfie Verification */}
          <div className="space-y-2">
            <label className="block text-lg font-bold text-gray-900">Selfie Verification</label>
            <p className="text-sm font-medium text-gray-600 mb-4">
              Take a clear selfie photo for identity verification. Make sure your face is clearly visible and well-lit.
            </p>
            <div className={`${cartoonStyle.uploadArea} p-6 text-center`}>
              {!selfieFile ? (
                <div className="space-y-4">
                  <Camera className="h-12 w-12 mx-auto text-gray-600" />
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      Take a selfie for verification
                    </p>
                    <p className="text-sm font-medium text-gray-600 mt-1">
                      Make sure your face is clearly visible
                    </p>
                  </div>
                  <button
                    onClick={handleTakeSelfie}
                    disabled={isSubmitting || isSubmissionDisabled}
                    className={`inline-flex items-center justify-center text-sm font-bold h-12 px-6 py-3 ${
                      (isSubmitting || isSubmissionDisabled)
                        ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                        : cartoonStyle.buttonSuccess
                    }`}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Selfie
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selfiePreviewUrl && (
                    <div className="relative">
                      <Image
                        src={selfiePreviewUrl}
                        alt="Selfie Preview"
                        width={256}
                        height={256}
                        className="max-h-64 mx-auto rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-contain"
                      />
                      {/* Status indicator */}
                      <div className={`absolute -top-2 -right-2 text-white rounded-full p-2 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        isVerificationSubmitted ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        {isVerificationSubmitted ? '📋' : '📋'}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{selfieFile.name}</p>
                    <p className="text-sm font-medium text-gray-600">
                      {(selfieFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className={`text-sm font-medium mt-1 ${
                      isSubmissionDisabled ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {isSubmissionDisabled ? 
                        '📋 Submitted for verification - Under admin review' : 
                        canResubmit ?
                        '📋 Ready to resubmit - Click "Resubmit for Verification" to save' :
                        '📋 Ready to submit - Click "Submit for Verification" to save'
                      }
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleRemoveSelfie}
                      disabled={isSubmitting}
                      className={`px-4 py-2 text-sm font-bold ${
                        isSubmitting 
                          ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                          : isSubmissionDisabled
                          ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                          : cartoonStyle.button + ' text-black'
                      }`}
                    >
                      Remove Selfie
                    </button>
                    <button
                      onClick={handleTakeSelfie}
                      disabled={isSubmitting || isSubmissionDisabled}
                      className={`px-4 py-2 text-sm font-bold ${
                        (isSubmitting || isSubmissionDisabled)
                          ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                          : cartoonStyle.buttonSuccess
                      }`}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Retake Selfie
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className={`${cartoonStyle.infoBox} p-4`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2 text-lg">Verification Requirements:</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Student ID Card:</h4>
                    <ul className="text-sm font-medium text-blue-800 space-y-1 ml-2">
                      <li>• Clear, high-quality image of your student ID card</li>
                      <li>• All text and information must be readable</li>
                      <li>• Card should be flat and well-lit</li>
                      <li>• File size should not exceed 10MB</li>
                      <li>• Accepted formats: JPG, JPEG, PNG</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Selfie Verification:</h4>
                    <ul className="text-sm font-medium text-blue-800 space-y-1 ml-2">
                      <li>• Clear photo of your face</li>
                      <li>• Good lighting with no shadows</li>
                      <li>• Look directly at the camera</li>
                      <li>• No sunglasses or face coverings</li>
                      <li>• Match the photo on your student ID</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Examples for student ID */}
          <div className={`${cartoonStyle.card} bg-gray-50`}>
            <h3 className="font-bold text-gray-900 mb-4 text-xl text-center">Upload Examples For Student ID</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Good Example */}
              <div className="text-center">
                <div className="relative mb-3">
                  <div className="bg-white border-4 border-green-500 rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]">
                    <div className="bg-gray-200 border-2 border-gray-400 rounded-lg h-56 w-36 mx-auto overflow-hidden relative">
                      <Image 
                        src="/images/correct.jpg" 
                        alt="Good student ID example" 
                        fill
                        className="object-cover rounded-lg" 
                      />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ✓
                  </div>
                </div>
                <h4 className="font-bold text-green-700 text-lg mb-2">✅ CORRECT</h4>
                <ul className="text-sm font-medium text-green-600 text-left space-y-1">
                  <li>• Clear and readable text</li>
                  <li>• Good lighting</li>
                  <li>• Card is flat</li>
                  <li>• Sharp focus</li>
                </ul>
              </div>

              {/* Bad Example */}
              <div className="text-center">
                <div className="relative mb-3">
                  <div className="bg-white border-4 border-red-500 rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
                    <div className="bg-gray-200 border-2 border-gray-400 rounded-lg h-56 w-36 mx-auto overflow-hidden relative">
                      <Image 
                        src="/images/wrong.jpg" 
                        alt="Bad student ID example" 
                        fill
                        className="object-cover rounded-lg" 
                      />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ✗
                  </div>
                </div>
                <h4 className="font-bold text-red-700 text-lg mb-2">❌ INCORRECT</h4>
                <ul className="text-sm font-medium text-red-600 text-left space-y-1">
                  <li>• Blurry or unclear</li>
                  <li>• Poor lighting/shadows</li>
                  <li>• Card is bent/curved</li>
                  <li>• Text not readable</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Examples for selfie */}
          <div className={`${cartoonStyle.card} bg-gray-50`}>
            <h3 className="font-bold text-gray-900 mb-4 text-xl text-center">Upload Examples For Selfie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Good Example */}
              <div className="text-center">
                <div className="relative mb-3">
                  <div className="bg-white border-4 border-green-500 rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]">
                    <div className="bg-gray-200 border-2 border-gray-400 rounded-lg h-56 w-36 mx-auto overflow-hidden relative">
                      <Image 
                        src="/images/selfie.jpg" 
                        alt="Good selfie example" 
                        fill
                        className="object-cover rounded-lg" 
                      />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ✓
                  </div>
                </div>
                <h4 className="font-bold text-green-700 text-lg mb-2">✅ CORRECT</h4>
                <ul className="text-sm font-medium text-green-600 text-left space-y-1">
                  <li>• Face clearly visible</li>
                  <li>• No accessories</li>
                  <li>• Good lighting</li>
                  <li>• Neutral background</li>
                </ul>
              </div>

              {/* Bad Example */}
              <div className="text-center">
                <div className="relative mb-3">
                  <div className="bg-white border-4 border-red-500 rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
                    <div className="bg-gray-200 border-2 border-gray-400 rounded-lg h-56 w-36 mx-auto overflow-hidden relative">
                      <Image 
                        src="/images/selfiewrong.jpg" 
                        alt="Bad selfie example" 
                        fill
                        className="object-cover rounded-lg" 
                      />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ✗
                  </div>
                </div>
                <h4 className="font-bold text-red-700 text-lg mb-2">❌ INCORRECT</h4>
                <ul className="text-sm font-medium text-red-600 text-left space-y-1">
                  <li>• Blurry image</li>
                  <li>• Face not centered</li>
                  <li>• Poor lighting</li>
                  <li>• Wearing sunglasses</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmitVerification}
              disabled={!selectedFile || !selfieFile || isSubmitting || isSubmissionDisabled}
              className={`flex-1 px-6 py-3 font-bold text-lg ${
                (!selectedFile || !selfieFile || isSubmitting || isSubmissionDisabled)
                  ? 'bg-gray-300 text-gray-500 border-3 border-gray-400 rounded-lg cursor-not-allowed'
                  : cartoonStyle.buttonSuccess
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                  {canResubmit ? 'Resubmitting...' : 'Submitting...'}
                </>
              ) : isSubmissionDisabled ? (
                'Already Submitted'
              ) : canResubmit ? (
                'Resubmit for Verification'
              ) : (
                'Submit for Verification'
              )}
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-sm font-medium text-gray-600 text-center pt-4 border-t-4 border-black">
            <p>
              Your student ID and selfie will be securely processed for verification purposes only.
              <br />
              Processing typically takes 1-2 business days.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for File Removal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`${cartoonStyle.card} bg-white w-80 max-w-md`}>
            <h3 className="mb-4 text-lg font-extrabold text-black">Confirm Removal</h3>
            <p className="mb-6 text-gray-700 font-medium">
              Are you sure you want to remove this {removeType === 'studentId' ? 'Student ID' : 'selfie'} image? 
              You&apos;ll need to upload it again.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRemoval}
                className={cartoonStyle.button + " text-black px-4 py-2"}
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoval}
                className={cartoonStyle.buttonDanger + " px-4 py-2"}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* QR Upload Modal */}
      <QRUploadModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onSuccess={handleQRUploadSuccess}
        type={qrUploadType}
      />
    </div>
  );
}
