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

// Add logging for debugging
console.log('[QR-SESSIONS] Session storage initialized');

// Clean up expired sessions periodically
const cleanupInterval = setInterval(() => {
  const now = new Date();
  const beforeSize = uploadSessions.size;
  
  for (const [sessionId, session] of uploadSessions.entries()) {
    if (session.expiresAt < now) {
      console.log('[QR-SESSIONS] Cleaning up expired session:', sessionId);
      uploadSessions.delete(sessionId);
    }
  }
  
  const afterSize = uploadSessions.size;
  if (beforeSize !== afterSize) {
    console.log('[QR-SESSIONS] Cleanup completed. Sessions before:', beforeSize, 'after:', afterSize);
  }
}, 60000); // Clean up every minute

// Add a function to get session info for debugging
export function getSessionInfo() {
  const sessions = Array.from(uploadSessions.entries()).map(([id, session]) => ({
    id,
    type: session.type,
    status: session.status,
    userId: session.userId,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    isExpired: session.expiresAt < new Date()
  }));
  
  console.log('[QR-SESSIONS] Current sessions:', sessions);
  return sessions;
}

// Graceful cleanup on process exit
process.on('exit', () => {
  clearInterval(cleanupInterval);
  console.log('[QR-SESSIONS] Cleanup interval cleared');
}); 