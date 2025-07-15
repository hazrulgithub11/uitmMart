// In-memory storage for upload sessions (in production, you might want to use Redis)
export interface UploadSession {
  id: string;
  userId: number;
  type: 'studentId' | 'selfie';
  status: 'pending' | 'uploaded' | 'expired';
  uploadedImageUrl?: string;
  createdAt: Date;
  expiresAt: Date;
}

// Global variable to store sessions in memory
export const uploadSessions: Map<string, UploadSession> = new Map();

// Clean up expired sessions periodically
setInterval(() => {
  const now = new Date();
  for (const [sessionId, session] of uploadSessions.entries()) {
    if (session.expiresAt < now) {
      uploadSessions.delete(sessionId);
    }
  }
}, 60000); // Clean up every minute 