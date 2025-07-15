'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { 
  ArrowLeft,
  Loader2,
  ShieldAlert,
  User,
  Calendar,
  Mail,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ScanText,
  Save,
  Edit3,
  Brain,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Tesseract from 'tesseract.js';

// Cartoon UI Style (matching admin page)
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

interface StudentVerification {
  id: number;
  studentIdImageUrl: string;
  selfieImageUrl: string;
  verificationStatus: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  studentIdNumber?: string;
  studentName?: string;
  university?: string;
  expiryDate?: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  createdAt: string;
}

interface OCRPageData {
  user: UserData;
  verification: StudentVerification | null;
}

interface ParsedData {
  name: string;
  studentNumber: string;
  university: string;
  isValidUniversity: boolean;
}

// Add interface for Tesseract logger message
interface TesseractLoggerMessage {
  status: string;
  progress: number;
  userJobId: string;
  jobId: string;
  workerId: string;
}

export default function OCRPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [data, setData] = useState<OCRPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // OCR state variables
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  
  // AI parsing state variables
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  
  // Editable fields state
  const [editableData, setEditableData] = useState({
    studentName: '',
    studentIdNumber: '',
    university: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Approval/Rejection state
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const userId = params?.userId as string;

  // OCR processing function for Student ID
  const processStudentIdOCR = async () => {
    if (!data?.verification?.studentIdImageUrl) {
      console.error('No student ID image URL available');
      return;
    }

    setIsOCRProcessing(true);
    setIsAIProcessing(true);
    setOcrProgress(0);
    setAiError(null);
    setParsedData(null);
    setUsedFallback(false);
    setSaveMessage(null);
    
    console.log('🔍 Starting OCR processing for Student ID...');
    console.log('📷 Image URL:', data.verification.studentIdImageUrl);

    try {
      // Step 1: OCR Processing
      const result = await Tesseract.recognize(
        data.verification.studentIdImageUrl,
        'eng',
        {
          logger: (m: TesseractLoggerMessage) => {
            console.log('📊 OCR Progress:', m);
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      console.log('✅ OCR Processing Complete!');
      console.log('📝 Raw OCR Text:');
      console.log('='.repeat(50));
      console.log(result.data.text);
      console.log('='.repeat(50));
      
      setIsOCRProcessing(false);
      
      // Step 2: AI Processing
      console.log('🤖 Starting AI analysis...');
      
      const aiResponse = await fetch('/api/admin/ocr-parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ocrText: result.data.text
        })
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        throw new Error(errorData.error || 'AI parsing failed');
      }

      const aiResult = await aiResponse.json();
      console.log('✅ AI Analysis Complete!', aiResult);
      
      if (aiResult.success) {
        setParsedData(aiResult.data);
        setUsedFallback(aiResult.fallback || false);
        
        // Pre-fill editable fields with parsed data
        setEditableData({
          studentName: aiResult.data.name || '',
          studentIdNumber: aiResult.data.studentNumber || '',
          university: aiResult.data.university || ''
        });
        
        setIsEditing(true); // Enable editing mode
      } else {
        throw new Error(aiResult.message || 'AI parsing failed');
      }

    } catch (error) {
      console.error('❌ Processing Error:', error);
      setAiError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsOCRProcessing(false);
      setIsAIProcessing(false);
      setOcrProgress(0);
    }
  };

  // Save parsed data to database
  const saveOCRData = async () => {
    if (!data?.user?.id) {
      setSaveMessage({ type: 'error', text: 'User ID not found' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/admin/ocr-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.user.id,
          studentName: editableData.studentName,
          studentIdNumber: editableData.studentIdNumber,
          university: editableData.university
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save data');
      }

      const result = await response.json();
      console.log('✅ Data saved successfully:', result);
      
      setSaveMessage({ type: 'success', text: 'OCR data saved successfully!' });
      
      // Update the local data state
      if (data && data.verification) {
        setData({
          ...data,
          verification: {
            ...data.verification,
            studentName: editableData.studentName,
            studentIdNumber: editableData.studentIdNumber,
            university: editableData.university
          }
        });
      }
      
      setIsEditing(false);

    } catch (error) {
      console.error('❌ Save Error:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save data' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle approve verification
  const handleApprove = async () => {
    if (!data?.user?.id) {
      setActionMessage({ type: 'error', text: 'User ID not found' });
      return;
    }

    setIsProcessingAction(true);
    setActionMessage(null);

    try {
      const response = await fetch('/api/admin/verification-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.user.id,
          action: 'approve'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve verification');
      }

      const result = await response.json();
      console.log('✅ Verification approved successfully:', result);
      
      setActionMessage({ type: 'success', text: 'Student verification approved successfully!' });
      
      // Update the local data state
      if (data && data.verification) {
        setData({
          ...data,
          verification: {
            ...data.verification,
            verificationStatus: 'approved',
            reviewedAt: new Date().toISOString(),
            rejectionReason: undefined
          }
        });
      }

    } catch (error) {
      console.error('❌ Approve Error:', error);
      setActionMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to approve verification' 
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle reject verification
  const handleReject = async () => {
    if (!data?.user?.id) {
      setActionMessage({ type: 'error', text: 'User ID not found' });
      return;
    }

    if (!rejectionReason.trim()) {
      setActionMessage({ type: 'error', text: 'Please provide a rejection reason' });
      return;
    }

    setIsProcessingAction(true);
    setActionMessage(null);

    try {
      const response = await fetch('/api/admin/verification-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: data.user.id,
          action: 'reject',
          rejectionReason: rejectionReason.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject verification');
      }

      const result = await response.json();
      console.log('✅ Verification rejected successfully:', result);
      
      setActionMessage({ type: 'success', text: 'Student verification rejected successfully!' });
      
      // Update the local data state
      if (data && data.verification) {
        setData({
          ...data,
          verification: {
            ...data.verification,
            verificationStatus: 'rejected',
            reviewedAt: new Date().toISOString(),
            rejectionReason: rejectionReason.trim()
          }
        });
      }

      // Close the modal and reset
      setShowRejectModal(false);
      setRejectionReason('');

    } catch (error) {
      console.error('❌ Reject Error:', error);
      setActionMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to reject verification' 
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof typeof editableData, value: string) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch user verification data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/sellers?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const result = await response.json();
        setData(result);
        
        // Pre-fill editable fields with existing data
        if (result.verification) {
          setEditableData({
            studentName: result.verification.studentName || '',
            studentIdNumber: result.verification.studentIdNumber || '',
            university: result.verification.university || ''
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user?.role === 'admin' && userId) {
      fetchUserData();
    }
  }, [status, session, userId]);

  // Auth check
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="font-bold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-6">You don&apos;t have permission to access this admin page.</p>
          <Button 
            onClick={() => router.push('/')} 
            className={cartoonStyle.buttonPrimary}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white border-2 border-black">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white border-2 border-black">Rejected</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-500 text-white border-2 border-black">Under Review</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 text-black border-2 border-black">Pending</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white border-2 border-black">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-4 text-black mb-6">
          <Button
            onClick={() => router.push('/admin/users')}
            className={cartoonStyle.button}
          >
            <ArrowLeft className="h-4 w-4 mr-2 text-black" />
            Back to Users
          </Button>
          <div>
            <h1 className={`${cartoonStyle.heading} text-black`}>Student Verification Review</h1>
            <p className="text-gray-700 mt-1 font-medium">Review student ID and selfie verification</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading verification data...</span>
          </div>
        ) : error ? (
          <Card className={cartoonStyle.card}>
            <CardContent className="text-center py-12">
              <div className="text-red-500 mb-4">Error: {error}</div>
              <Button 
                onClick={() => window.location.reload()} 
                className={cartoonStyle.buttonPrimary}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : data ? (
          <div className="space-y-6">
            {/* User Information */}
            <Card className={cartoonStyle.card}>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Username:</span>
                      <span className="text-gray-900">@{data.user.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="text-gray-900">{data.user.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Full Name:</span>
                      <span className="text-gray-900">{data.user.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Joined:</span>
                      <span className="text-gray-900">{new Date(data.user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            {data.verification ? (
              <>
                <Card className={cartoonStyle.card}>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
                      {getStatusIcon(data.verification.verificationStatus)}
                      Verification Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">Status:</span>
                          {getStatusBadge(data.verification.verificationStatus)}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Submitted:</span>
                          <span className="text-gray-900">{new Date(data.verification.submittedAt).toLocaleDateString()}</span>
                        </div>
                        {data.verification.reviewedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-700">Reviewed:</span>
                            <span className="text-gray-900">{new Date(data.verification.reviewedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {data.verification.studentIdNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-700">Student ID:</span>
                            <span className="text-gray-900">{data.verification.studentIdNumber}</span>
                          </div>
                        )}
                        {data.verification.university && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-700">University:</span>
                            <span className="text-gray-900">{data.verification.university}</span>
                          </div>
                        )}
                        {data.verification.rejectionReason && (
                          <div className="flex items-start gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-red-700">Rejection Reason:</span>
                              <p className="text-red-600 mt-1">{data.verification.rejectionReason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Action Buttons */}
                {data.verification.verificationStatus === 'pending' && (
                  <Card className={cartoonStyle.card}>
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Admin Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-gray-700 font-medium">
                          Review the student verification documents and decide whether to approve or reject this application.
                        </p>
                        
                        {/* Action Message */}
                        {actionMessage && (
                          <div className={`p-3 rounded-lg border-2 ${
                            actionMessage.type === 'success' 
                              ? 'bg-green-50 border-green-300 text-green-700' 
                              : 'bg-red-50 border-red-300 text-red-700'
                          }`}>
                            <p className="font-medium">{actionMessage.text}</p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={handleApprove}
                            disabled={isProcessingAction}
                            className={cartoonStyle.buttonSuccess}
                          >
                            {isProcessingAction ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Approve Application
                              </>
                            )}
                          </Button>
                          
                          <Button
                            onClick={() => setShowRejectModal(true)}
                            disabled={isProcessingAction}
                            className={cartoonStyle.buttonDanger}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Reject Application
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* OCR Analysis Results */}
                {(parsedData || aiError) && (
                  <Card className={cartoonStyle.card}>
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Analysis Results
                        {usedFallback && (
                          <Badge className="bg-orange-500 text-white border-2 border-black ml-2">
                            Fallback Used
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {aiError ? (
                        <div className="text-red-500 p-4 bg-red-50 rounded-lg border-2 border-red-300">
                          <p className="font-medium">AI Analysis Error:</p>
                          <p>{aiError}</p>
                        </div>
                      ) : parsedData ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-black">
                            <div className="space-y-2">
                              <Label htmlFor="studentName" className="text-sm font-medium text-gray-700">
                                Student Name
                              </Label>
                              <Input
                                id="studentName"
                                value={editableData.studentName}
                                onChange={(e) => handleInputChange('studentName', e.target.value)}
                                className={cartoonStyle.input}
                                placeholder="Enter student name"
                                disabled={!isEditing}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="studentIdNumber" className="text-sm font-medium text-gray-700">
                                Student ID Number
                              </Label>
                              <Input
                                id="studentIdNumber"
                                value={editableData.studentIdNumber}
                                onChange={(e) => handleInputChange('studentIdNumber', e.target.value)}
                                className={cartoonStyle.input}
                                placeholder="Enter student ID number"
                                disabled={!isEditing}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="university" className="text-sm font-medium text-gray-700">
                                University
                              </Label>
                              <Input
                                id="university"
                                value={editableData.university}
                                onChange={(e) => handleInputChange('university', e.target.value)}
                                className={cartoonStyle.input}
                                placeholder="Enter university name"
                                disabled={!isEditing}
                              />
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 text-black">
                            {isEditing ? (
                              <>
                                <Button
                                  onClick={saveOCRData}
                                  disabled={isSaving}
                                  className={cartoonStyle.buttonSuccess}
                                >
                                  {isSaving ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save Data
                                    </>
                                  )}
                                </Button>
                                <Button
                                  onClick={() => setIsEditing(false)}
                                  className={cartoonStyle.button + ' text-black'}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => setIsEditing(true)}
                                className={cartoonStyle.buttonPrimary}
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Data
                              </Button>
                            )}
                          </div>
                          
                          {/* Save Message */}
                          {saveMessage && (
                            <div className={`mt-4 p-3 rounded-lg border-2 ${
                              saveMessage.type === 'success' 
                                ? 'bg-green-50 border-green-300 text-green-700' 
                                : 'bg-red-50 border-red-300 text-red-700'
                            }`}>
                              <p className="font-medium">{saveMessage.text}</p>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )}

                {/* Images */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Student ID Card */}
                  <Card className={cartoonStyle.card}>
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Student ID Card
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="relative w-full h-96">
                            <Image
                              src={data.verification?.studentIdImageUrl || ''}
                              alt="Student ID Card"
                              fill
                              className="object-contain rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => setSelectedImage(data.verification?.studentIdImageUrl || null)}
                            />
                          </div>
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 border-2 border-black shadow-md">
                            <ImageIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <Button
                          onClick={() => setSelectedImage(data.verification?.studentIdImageUrl || null)}
                          className={`${cartoonStyle.button} w-full text-black`}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View Full Size
                        </Button>
                        <Button
                          onClick={processStudentIdOCR}
                          disabled={isOCRProcessing || isAIProcessing}
                          className={`${cartoonStyle.buttonPrimary} w-full ${(isOCRProcessing || isAIProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isOCRProcessing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              OCR Processing... {ocrProgress}%
                            </>
                          ) : isAIProcessing ? (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              AI Analyzing...
                            </>
                          ) : (
                            <>
                              <ScanText className="h-4 w-4 mr-2" />
                              OCR + AI Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selfie */}
                  <Card className={cartoonStyle.card}>
                    <CardHeader>
                      <CardTitle className="text-lg font-bold text-black flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Selfie Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="relative w-full h-96">
                            <Image
                              src={data.verification?.selfieImageUrl || ''}
                              alt="Selfie Verification"
                              fill
                              className="object-contain rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-500 transition-colors"
                              onClick={() => setSelectedImage(data.verification?.selfieImageUrl || null)}
                            />
                          </div>
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 border-2 border-black shadow-md">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <Button
                          onClick={() => setSelectedImage(data.verification?.selfieImageUrl || null)}
                          className={`${cartoonStyle.button} w-full text-black`}
                        >
                          <User className="h-4 w-4 mr-2" />
                          View Full Size
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card className={cartoonStyle.card}>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No Verification Data</h3>
                  <p className="text-gray-500">This seller has not submitted verification documents yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl max-h-full relative">
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage}
                alt="Full Size Image"
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <Button
              onClick={() => setSelectedImage(null)}
              className={`${cartoonStyle.button} absolute top-4 right-4`}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${cartoonStyle.card} bg-white w-full max-w-md`}>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                Reject Application
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 font-medium">
                  Please provide a reason for rejecting this student verification application. This will be shown to the student.
                </p>
                
                <div className="space-y-2 text-black">
                  <Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700">
                    Rejection Reason *
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={cartoonStyle.input + ' text-black'} 
                    placeholder="Enter the reason for rejection..."
                    rows={4}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className={cartoonStyle.button + ' text-black flex-1'}
                    disabled={isProcessingAction}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={isProcessingAction || !rejectionReason.trim()}
                    className={cartoonStyle.buttonDanger + ' flex-1'}
                  >
                    {isProcessingAction ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Reject Application
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  );
} 