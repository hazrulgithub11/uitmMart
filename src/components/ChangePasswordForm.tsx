"use client";

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChangePasswordFormProps {
  onCancel: () => void;
}

// Cartoon UI Style for consistency
const cartoonStyle = {
  card: "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 transition-all hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.8)]", 
  input: "bg-white border-3 border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full px-3 py-2",
  button: "bg-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
  buttonConfirm: "bg-coral-500 text-white border-3 border-black rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)] transition-all active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
};

export default function ChangePasswordForm({ onCancel }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationStep, setVerificationStep] = useState(true);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      setError('Please enter your current password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Verify current password
      const response = await fetch('/api/profile/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: currentPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify password');
      }
      
      // If verification successful, move to change password step
      setVerificationStep(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password inputs
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Send request to change password
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          currentPassword, 
          newPassword 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      // Success - show toast and close the form
      toast.success('Password changed successfully!');
      onCancel();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${cartoonStyle.card} md:max-w-md mx-auto`}>
      {verificationStep ? (
        // First step: Verify current password
        <>
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h2 className="text-xl font-bold text-black">Enter Your Password</h2>
          </div>
          
          <div className="bg-orange-50 border-3 border-black rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              To protect your account security, please verify your identity first.
            </p>
          </div>
          
          <form onSubmit={handleVerifyPassword}>
            <div className="mb-6">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${cartoonStyle.input} text-black pr-10`}
                  placeholder="Input your current password to verify"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`${cartoonStyle.buttonConfirm} w-full py-3 text-center font-bold !text-black`}
            >
              {loading ? "Verifying..." : "CONFIRM"}
            </button>
            
            <div className="mt-6 text-sm">
              <div className="border-t-2 border-gray-200 pt-4">
                <h3 className="font-bold text-gray-700 mb-1">Why am I asked to verify my password?</h3>
                <p className="text-gray-600">Your account security is important to us. We ask for verification to protect your account from unauthorized changes.</p>
              </div>
              
              <div className="mt-4">
                <h3 className="font-bold text-gray-700 mb-1">What if I forgot my password?</h3>
                <p className="text-gray-600">Please use the &quot;Forgot Password&quot; function on the login page to reset your password.</p>
              </div>
            </div>
          </form>
        </>
      ) : (
        // Second step: Change password
        <>
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => setVerificationStep(true)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h2 className="text-xl font-bold text-black">Change Password</h2>
          </div>
          
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-black">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`${cartoonStyle.input} text-black pr-10`}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2 text-black">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`${cartoonStyle.input} text-black`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              
              <div className="bg-blue-50 border-3 border-black rounded-lg p-3 text-sm text-gray-700">
                <p className="font-bold mb-1">Password requirements:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Include both letters and numbers</li>
                  <li>Avoid easily guessed passwords</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className={`${cartoonStyle.buttonConfirm} flex-1 py-3 text-center font-bold !text-black`}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className={`${cartoonStyle.button} flex-1 py-3 text-center font-bold text-black`}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
} 