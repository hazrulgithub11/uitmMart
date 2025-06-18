"use client";

import { useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User, Mail, ShoppingBag, Edit, ArrowLeft, AlertTriangle, X, LogOut } from 'lucide-react';
import { useProfile, ProfileUpdateData } from '@/hooks/useProfile';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { Button } from '@/components/ui/button';

// Cartoon UI Style
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonPrimary: "bg-blue-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonSuccess: "bg-emerald-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonDanger: "bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  heading: "text-3xl font-extrabold tracking-wide",
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full px-3 py-2",
  navItem: "flex items-center gap-2 px-4 py-3 hover:bg-gray-100 transition-colors rounded-lg",
  navItemActive: "flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 font-medium border-3 border-black rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
  avatar: "bg-blue-100 rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { profile, isLoading: profileLoading, error: profileError, updateProfile, uploadProfileImage } = useProfile();
  
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formError, setFormError] = useState('');

  // Add state for email change functionality
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangeError, setEmailChangeError] = useState('');
  
  // Add this state at the top where other states are defined
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check authentication status when component mounts
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    }
  }, [status, router]);

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.fullName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setGender(profile.gender as 'Male' | 'Female' | 'Other' | '' || '');
      
      // Handle date format conversion for the date input
      if (profile.dateOfBirth) {
        // Convert the date to YYYY-MM-DD format for the date input
        const date = new Date(profile.dateOfBirth);
        const formattedDate = date.toISOString().split('T')[0];
        setDateOfBirth(formattedDate);
      } else {
        setDateOfBirth(null);
      }
      
      setProfileImage(profile.profileImage || null);
    }
  }, [profile]);
  
  // Initialize form with user data if available from session
  useEffect(() => {
    if (session?.user && !profile) {
      setName(session.user.name || '');
    }
  }, [session, profile]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    
    try {
      setSaving(true);
      
      const updateData: ProfileUpdateData = {
        fullName: name,
        phoneNumber: phoneNumber || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth,
      };
      
      await updateProfile(updateData);
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      setFormError('');
      
      // Upload the image
      const imageUrl = await uploadProfileImage(file);
      setProfileImage(imageUrl);
      
      setSuccessMessage('Profile image uploaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setFormError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle clicking the Select Image button
  const handleSelectImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to handle email change
  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setEmailChangeError('Please enter a valid email address');
      return;
    }
    
    setEmailChangeError('');
    
    try {
      setSaving(true);
      
      const updateData: ProfileUpdateData = {
        email: newEmail,
      };
      
      await updateProfile(updateData);
      setSuccessMessage('Email updated successfully!');
      setIsChangingEmail(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating email:', error);
      
      // Make the error message more user-friendly
      if ((error as Error)?.message?.includes('email') && (error as Error)?.message?.includes('unique')) {
        setEmailChangeError('This email is already in use. Please try another email address.');
      } else {
        setEmailChangeError(error instanceof Error ? error.message : 'Failed to update email');
      }
    } finally {
      setSaving(false);
    }
  };

  // Fix the error in handleDeleteAccount function
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

  // Add this state for delete errors
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Content rendering logic
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className={`${cartoonStyle.card} mb-6`}>
            <h1 className={`${cartoonStyle.heading} mb-1 text-black`}>My Profile</h1>
            <p className="text-gray-600 text-sm mb-6 border-b-3 border-black pb-3">Manage and protect your account</p>

            {/* Success message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border-3 border-black rounded-lg text-green-700 font-medium">
                {successMessage}
              </div>
            )}

            {/* Error message */}
            {(formError || profileError) && (
              <div className="mb-4 p-3 bg-red-100 border-3 border-black rounded-lg text-red-700 font-medium">
                {formError || profileError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-[1fr_2fr] gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-black">Username</label>
                    <div className="bg-gray-100 border-3 border-black rounded-lg px-3 py-2 text-black">
                      {profile?.username || session?.user?.email?.split('@')[0] || ''}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-black">Name</label>
                    <input
                      type="text"
                      className={`${cartoonStyle.input} text-black`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-black">Email</label>
                    {isChangingEmail ? (
                      <div className="space-y-2">
                        <input
                          type="email"
                          className={`${cartoonStyle.input} text-black`}
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email"
                          required
                        />
                        {emailChangeError && (
                          <p className="text-red-500 text-sm">{emailChangeError}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleEmailChange}
                            disabled={saving}
                            className={`${cartoonStyle.buttonPrimary} px-3 py-1 text-sm`}
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingEmail(false);
                              setNewEmail('');
                              setEmailChangeError('');
                            }}
                            className={`${cartoonStyle.button} px-3 py-1 text-sm text-black`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="bg-gray-100 border-3 border-black rounded-lg px-3 py-2 flex-grow text-black">
                          {profile?.email || session?.user?.email || ''}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsChangingEmail(true);
                            setNewEmail(profile?.email || session?.user?.email || '');
                          }}
                          className={`${cartoonStyle.buttonPrimary} ml-2 px-3 py-1 text-sm`}
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-black">Phone Number</label>
                    <input
                      type="tel"
                      className={`${cartoonStyle.input} text-black`}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-black">Gender</label>
                    <div className="flex gap-6 mt-2">
                      <label className="flex items-center border-3 border-black rounded-lg px-3 py-2 bg-white text-black">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="Male" 
                          checked={gender === 'Male'} 
                          onChange={() => setGender('Male')} 
                          className="mr-2"
                        />
                        Male
                      </label>
                      <label className="flex items-center border-3 border-black rounded-lg px-3 py-2 bg-white text-black">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="Female" 
                          checked={gender === 'Female'} 
                          onChange={() => setGender('Female')} 
                          className="mr-2"
                        />
                        Female
                      </label>
                      <label className="flex items-center border-3 border-black rounded-lg px-3 py-2 bg-white text-black">
                        <input 
                          type="radio" 
                          name="gender" 
                          value="Other" 
                          checked={gender === 'Other'} 
                          onChange={() => setGender('Other')} 
                          className="mr-2"
                        />
                        Other
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-black">Date of birth</label>
                    <input
                      type="date"
                      className={`${cartoonStyle.input} text-black`}
                      value={dateOfBirth || ''}
                      onChange={(e) => setDateOfBirth(e.target.value || null)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className={`${cartoonStyle.buttonDanger} py-2 px-6 text-white font-bold`}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>

                <div className="flex flex-col items-center justify-start space-y-4">
                  <div className={`${cartoonStyle.avatar} w-40 h-40 flex items-center justify-center bg-blue-100 overflow-hidden`}>
                    {profileImage ? (
                      <Image 
                        src={profileImage}
                        alt="Profile"
                        width={160}
                        height={160}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User size={64} className="text-blue-600" />
                    )}
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg, image/png"
                    onChange={handleImageUpload}
                  />
                  
                  <button 
                    type="button"
                    onClick={handleSelectImageClick}
                    disabled={uploadingImage}
                    className={`${cartoonStyle.button} px-4 py-2 text-sm font-bold text-black`}
                  >
                    {uploadingImage ? 'Uploading...' : 'Select Image'}
                  </button>
                  
                  <div className="text-xs text-gray-600 text-center font-medium border-3 border-black rounded-lg p-3 bg-gray-100">
                    <p>File size: maximum 1 MB</p>
                    <p>File extension: JPEG, PNG</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        );
      
      case 'password':
        return (
          <div className={`${cartoonStyle.card} mb-6`}>
            <h1 className={`${cartoonStyle.heading} mb-1 text-black`}>Change Password</h1>
            <p className="text-gray-600 text-sm mb-6 border-b-3 border-black pb-3">Update your password to keep your account secure</p>
            
            <ChangePasswordForm onCancel={() => setActiveSection('profile')} />
          </div>
        );
      
      case 'banks':
        return (
          <div className={`${cartoonStyle.card} mb-6`}>
            <h1 className={`${cartoonStyle.heading} mb-1 text-black`}>Banks & Cards</h1>
            <p className="text-gray-600 text-sm mb-6 border-b-3 border-black pb-3">Manage your payment methods</p>
            
            <div className="p-6 bg-gray-100 border-3 border-black rounded-lg text-center">
              <p className="text-gray-600 font-medium">This feature is coming soon!</p>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className={`${cartoonStyle.card} mb-6`}>
            <h1 className={`${cartoonStyle.heading} mb-1 text-black`}>Notification Settings</h1>
            <p className="text-gray-600 text-sm mb-6 border-b-3 border-black pb-3">Manage your notification preferences</p>
            
            <div className="p-6 bg-gray-100 border-3 border-black rounded-lg text-center">
              <p className="text-gray-600 font-medium">This feature is coming soon!</p>
            </div>
          </div>
        );
      
      case 'privacy':
        return (
          <div className={`${cartoonStyle.card} mb-6`}>
            <h1 className={`${cartoonStyle.heading} mb-1 text-black`}>Privacy Settings</h1>
            <p className="text-gray-600 text-sm mb-6 border-b-3 border-black pb-3">Control your privacy preferences</p>
            
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black">Privacy Settings</h2>
              <p className="text-gray-700">Manage your account privacy and data settings</p>
              
              <div className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mt-6">
                <h3 className="text-xl font-bold text-black mb-4">Delete Account</h3>
                <p className="text-gray-700 mb-6">
                  This action will permanently delete your account and all associated data. This cannot be undone.
                </p>
                <Button 
                  variant="destructive" 
                  className="bg-red-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete My Account
                </Button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Show loading state while checking authentication or loading profile
  if (status === 'loading' || profileLoading) {
    return (
      <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black"></div>
      </div>
    );
  }

  // If not authenticated (this shouldn't render, but just in case)
  if (status === 'unauthenticated') {
    return null; // This will not render as we redirect in the useEffect
  }

  // If authenticated, show profile
  return (
    <div className="min-h-screen bg-[url('/images/backuitm.png')] bg-cover bg-center p-4">
      {/* Back button */}
      <Link 
        href="/main" 
        className={`${cartoonStyle.button} fixed top-4 left-4 p-2 z-20 flex items-center gap-2`}
      >
        <ArrowLeft size={18} className="text-black" />
        <span className="hidden sm:inline font-bold text-black">Back to Main</span>
      </Link>
      
      <div className="max-w-7xl mx-auto pt-12">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar with User Info & Navigation */}
          <div className="w-full md:w-1/4">
            <div className={`${cartoonStyle.card} mb-6`}>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className={`w-20 h-20 ${cartoonStyle.avatar} flex items-center justify-center overflow-hidden`}>
                    {profileImage ? (
                      <Image 
                        src={profileImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <User size={40} className="text-blue-600" />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-black">{profile?.fullName || session?.user?.name || ''}</p>
                  <button
                    onClick={handleSelectImageClick}
                    className={`${cartoonStyle.button} flex items-center gap-1 text-sm mx-auto mt-2 px-3 py-1`}
                  >
                    <Edit size={14} className="text-black" />
                    <span className="text-black">Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`${cartoonStyle.card} mb-6`}>
              <div className="font-bold flex items-center gap-2 border-b-3 border-black pb-2 mb-3">
                <User size={18} className="text-black" />
                <span className="text-black">My Account</span>
              </div>
              <div className="space-y-2 text-black">
                <Link 
                  href="#profile" 
                  className={activeSection === 'profile' ? cartoonStyle.navItemActive : cartoonStyle.navItem}
                  onClick={() => setActiveSection('profile')}
                >
                  Profile
                </Link>
                <Link 
                  href="#banks" 
                  className={activeSection === 'banks' ? cartoonStyle.navItemActive : cartoonStyle.navItem}
                  onClick={() => setActiveSection('banks')}
                >
                  Banks & Cards
                </Link>
                <Link 
                  href="/profile/addresses" 
                  className={activeSection === 'addresses' ? cartoonStyle.navItemActive : cartoonStyle.navItem}
                >
                  Addresses
                </Link>
                <Link 
                  href="#password" 
                  className={activeSection === 'password' ? cartoonStyle.navItemActive : cartoonStyle.navItem}
                  onClick={() => setActiveSection('password')}
                >
                  Change Password
                </Link>
                <Link 
                  href="#notifications" 
                  className={activeSection === 'notifications' ? cartoonStyle.navItemActive : cartoonStyle.navItem}
                  onClick={() => setActiveSection('notifications')}
                >
                  Notification Settings
                </Link>
                <Link 
                  href="#privacy" 
                  className={activeSection === 'privacy' ? cartoonStyle.navItemActive : cartoonStyle.navItem}
                  onClick={() => setActiveSection('privacy')}
                >
                  Privacy Settings
                </Link>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <Link href="/profile/purchases" className={`${cartoonStyle.card} flex items-center gap-3`}>
                <div className="p-2 bg-blue-100 rounded-full border-2 border-black">
                  <ShoppingBag size={20} className="text-blue-600" />
                </div>
                <span className="font-medium text-black">My Purchases</span>
              </Link>
              
              <Link href="/chat/conversations" className={`${cartoonStyle.card} flex items-center gap-3`}>
                <div className="p-2 bg-blue-100 rounded-full border-2 border-black">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <span className="font-medium text-black">Messages</span>
              </Link>
              
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })} 
                className={`${cartoonStyle.card} flex items-center gap-3 w-full`}
              >
                <div className="p-2 bg-red-100 rounded-full border-2 border-black">
                  <LogOut size={20} className="text-red-600" />
                </div>
                <span className="font-medium text-black">Log Out</span>
              </button>
            </div>
          </div>

          {/* Main Content - Profile Settings */}
          <div className="w-full md:w-3/4">
            {renderContent()}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${cartoonStyle.card} bg-white max-w-md w-full`}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 border-3 border-black flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-black">Delete Your Account?</h3>
              <p className="text-gray-700 font-medium mb-6">
                This will permanently delete your account and all associated data including:
                <ul className="list-disc text-left mt-2 space-y-1 pl-5">
                  <li>Your profile information</li>
                  <li>Your order history</li>
                  <li>Your saved addresses</li>
                  <li>Your product reviews</li>
                  {session?.user?.role === 'SELLER' && <li>Your seller shop and listings</li>}
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