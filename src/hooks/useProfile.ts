import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Interface for user profile data
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  username: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  profileImage?: string;
  role: string;
}

// Interface for the data that can be updated
export interface ProfileUpdateData {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string | null;
  profileImage?: string;
}

export const useProfile = () => {
  const { status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the user's profile data
  const fetchProfile = useCallback(async () => {
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  // Function to update the user's profile
  const updateProfile = async (updateData: ProfileUpdateData) => {
    if (status !== 'authenticated') {
      throw new Error('You must be logged in to update your profile');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile image function
  const uploadProfileImage = async (file: File) => {
    if (status !== 'authenticated') {
      throw new Error('You must be logged in to upload an image');
    }

    if (!file) {
      throw new Error('No file provided');
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Note: You'll need to create an upload API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const { url } = await response.json();

      // Update the profile with the new image URL
      await updateProfile({ profileImage: url });
      return url;
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile data when the session changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    } else if (status === 'unauthenticated') {
      setProfile(null);
      setIsLoading(false);
    }
  }, [status, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    uploadProfileImage,
  };
}; 