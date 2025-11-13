// API Response Types
export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  status: "upcoming" | "ongoing" | "completed";
}

export interface AffiliateStats {
  affiliateCode: string;
  totalClicks: number;
  totalSignups: number;
  totalCommission: number;
  recentClicks: number;
  recentSignups: number;
}

export interface AuthInitiateRequest {
  displayName: string;
  faceImageUrl?: string;
}

export interface AuthInitiateResponse {
  success: boolean;
  message: string;
  token?: string;
  teamId?: string; // Backend uses teamId (backward compatible with staffId)
  staffId?: string; // Backward compatibility alias
  userId?: string;
  displayName?: string;
  email?: string;
  affiliateCode?: string;
  requiresVerification?: boolean;
  registeredFaceImage?: string;
}

export interface AuthVerifyRequest {
  staffId: string; // Backend uses staffId
  faceImageUrl: string;
}

export interface AuthVerifyResponse {
  success: boolean;
  message: string;
  token?: string;
  team?: {
    id: string;
    displayName: string;
    affiliateCode: string;
  };
  staff?: { // Backward compatibility alias
    id: string;
    displayName: string;
    affiliateCode: string;
  };
}

export interface FaceVerificationError {
  code: 'NO_FACE_DETECTED' | 'MULTIPLE_FACES' | 'POOR_QUALITY' | 'LIGHTING_ISSUES' | 'ANGLE_ISSUES';
  message: string;
}

