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
  staffId?: string;
  requiresVerification?: boolean;
}

export interface AuthVerifyRequest {
  staffId: string;
  faceImageUrl: string;
}

export interface AuthVerifyResponse {
  success: boolean;
  message: string;
  token?: string;
  staff?: {
    id: string;
    displayName: string;
    affiliateCode: string;
  };
}

export interface FaceVerificationError {
  code: 'NO_FACE_DETECTED' | 'MULTIPLE_FACES' | 'POOR_QUALITY' | 'LIGHTING_ISSUES' | 'ANGLE_ISSUES';
  message: string;
}
