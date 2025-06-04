'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  AlertTriangle,
  LogOut,
  X,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'next-auth/react';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
};

export default function SellerAccountSettings() {
  const router = useRouter();
  
  // State for user profile data
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Password changed modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // Add delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Make real API call to get user profile data
        const response = await fetch('/api/seller/profile');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile');
        }
        
        const data = await response.json();
        
        // Update form data with user information
        setUserData(prev => ({
          ...prev,
          fullName: data.fullName,
          email: data.email,
          username: data.username
        }));
      } catch (err) {
        setError('Failed to load user profile. Please try again.');
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      // Update profile information
      const response = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: userData.fullName,
          email: userData.email,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      setSuccessMessage('Profile updated successfully');
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      console.error('Error updating profile:', err);
      return false;
    }
  };
  
  // Handle password change
  const handlePasswordChange = async () => {
    try {
      // Validate passwords match
      if (userData.newPassword !== userData.confirmPassword) {
        throw new Error('New password and confirmation do not match');
      }
      
      // Call password change API
      const response = await fetch('/api/seller/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: userData.currentPassword,
          newPassword: userData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      // Show password changed modal
      setShowPasswordModal(true);
      
      // Clear password fields
      setUserData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      console.error('Error changing password:', err);
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Check if password is being changed
      const isChangingPasswordFields = userData.currentPassword && userData.newPassword;
      
      // Update profile information first
      await handleProfileUpdate();
      
      // If password fields are filled, change password
      if (isChangingPasswordFields) {
        if (userData.newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long');
        }
        
        await handlePasswordChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle logging out
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };
  
  // Add handleDeleteAccount function
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/profile/delete-account', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Successfully deleted
        signOut({ callbackUrl: '/login' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-6">
      {/* Header section */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            className={`${cartoonStyle.button} text-black hover:bg-gray-100`}
            onClick={() => router.push('/seller')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Badge className="bg-blue-500 text-white px-3 py-1 border-2 border-black font-bold text-lg">Account Settings</Badge>
        </div>
        
        <div className="mt-6">
          <h1 className={`${cartoonStyle.heading} text-black`}>Account Settings</h1>
          <p className="text-gray-700 font-medium mt-1">Manage your account information and password</p>
        </div>
      </div>
      
      {/* Content section */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
            <p className="font-bold text-black">Loading account information...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Profile Information Card */}
            <Card className={`${cartoonStyle.card} bg-white mb-6`}>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Profile Information</CardTitle>
                <CardDescription className="text-gray-700 font-medium">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Display error or success message if any */}
                {error && (
                  <div className="bg-red-100 border-3 border-red-500 text-red-600 p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <p className="font-bold">{error}</p>
                  </div>
                )}
                
                {successMessage && (
                  <div className="bg-green-100 border-3 border-green-500 text-green-600 p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <p className="font-bold">{successMessage}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="font-bold text-black">Full Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-700" />
                      <Input
                        id="fullName"
                        name="fullName"
                        value={userData.fullName}
                        onChange={handleInputChange}
                        className={`${cartoonStyle.input} pl-10 text-black`}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="username" className="font-bold text-black">Username</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-700" />
                      <Input
                        id="username"
                        name="username"
                        value={userData.username}
                        onChange={handleInputChange}
                        className={`${cartoonStyle.input} pl-10 text-black bg-gray-100`}
                        placeholder="Your username"
                        required
                        disabled
                      />
                    </div>
                    <p className="text-sm text-gray-700 mt-1">Username cannot be changed</p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="email" className="font-bold text-black">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-700" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        className={`${cartoonStyle.input} pl-10 text-black`}
                        placeholder="Your email address"
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Password Change Card */}
            <Card className={`${cartoonStyle.card} bg-white mb-6`}>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Change Password</CardTitle>
                <CardDescription className="text-gray-700 font-medium">
                  Update your password (leave blank to keep current password)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="font-bold text-black">Current Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-700" />
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={userData.currentPassword}
                      onChange={handleInputChange}
                      className={`${cartoonStyle.input} pl-10 text-black`}
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword" className="font-bold text-black">New Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-700" />
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={userData.newPassword}
                        onChange={handleInputChange}
                        className={`${cartoonStyle.input} pl-10 text-black`}
                        placeholder="Enter new password"
                      />
                    </div>
                    <p className="text-sm text-gray-700 mt-1">Minimum 8 characters</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="font-bold text-black">Confirm Password</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-700" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={userData.confirmPassword}
                        onChange={handleInputChange}
                        className={`${cartoonStyle.input} pl-10 text-black`}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Add the Privacy Settings Card */}
            <Card className={`${cartoonStyle.card} bg-white mb-6`}>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-black">Privacy Settings</CardTitle>
                <CardDescription className="text-gray-700 font-medium">
                  Manage your account privacy and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border-3 border-red-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-red-600 flex items-center">
                    <Trash2 className="mr-2 h-5 w-5" />
                    Delete Account
                  </h3>
                  <p className="text-gray-700 mb-4 mt-2">
                    Permanently delete your seller account and all associated data including your shop, products, and orders. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    onClick={() => setShowDeleteModal(true)}
                    type="button"
                  >
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Submit Button */}
            <div className="flex justify-end mb-8">
              <Button 
                type="submit" 
                className={cartoonStyle.buttonSuccess}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
      
      {/* Password Changed Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${cartoonStyle.card} bg-white max-w-md w-full`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 border-3 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">Password Changed Successfully</h3>
              <p className="text-gray-700 font-medium mb-6">Your password has been updated. For security reasons, you will need to log in again with your new password.</p>
              <Button 
                className={cartoonStyle.buttonPrimary}
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out Now
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${cartoonStyle.card} bg-white max-w-md w-full`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 border-3 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">Delete Your Seller Account?</h3>
              <p className="text-gray-700 font-medium mb-6">
                This will permanently delete your account and all associated data including:
                <ul className="list-disc text-left mt-2 space-y-1 pl-5">
                  <li>Your seller profile information</li>
                  <li>Your shop and all product listings</li>
                  <li>Your order history and customer data</li>
                  <li>Your shop reviews and ratings</li>
                </ul>
                <span className="block font-bold mt-3 text-red-600">This action cannot be undone.</span>
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className={`${cartoonStyle.button} text-black`}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  className="bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete My Account'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Notification */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border-3 border-red-500 text-red-600 p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
          <p className="font-bold">{deleteError}</p>
          <Button 
            variant="ghost" 
            className="absolute top-1 right-1 h-6 w-6 p-0"
            onClick={() => setDeleteError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
} 