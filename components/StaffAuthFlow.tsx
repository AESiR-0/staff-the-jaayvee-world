"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Camera, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import FaceLogin from "./FaceLogin";
import { API_ENDPOINTS, apiCall } from "@/lib/api";
import { 
  AuthInitiateRequest, 
  AuthInitiateResponse, 
  AuthVerifyRequest, 
  AuthVerifyResponse,
  FaceVerificationError 
} from "@/lib/types";

type AuthStep = 'initiate' | 'verify' | 'success';

export default function StaffAuthFlow() {
  const [step, setStep] = useState<AuthStep>('initiate');
  const [displayName, setDisplayName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<FaceVerificationError | null>(null);
  const router = useRouter();

  const handleInitiate = async () => {
    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: AuthInitiateRequest = {
        displayName: displayName.trim(),
        faceImageUrl: faceImage || undefined
      };

      const response = await apiCall<AuthInitiateResponse>(API_ENDPOINTS.AUTH_INITIATE, {
        method: 'POST',
        body: JSON.stringify(request)
      });

      if (response.success && response.staffId) {
        setStaffId(response.staffId);
        if (response.requiresVerification) {
          setStep('verify');
        } else {
          // Direct success if no verification needed
          handleSuccess(response);
        }
      } else {
        setError(response.message || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Initiate error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (verifyImage: string) => {
    if (!staffId) {
      setError("Staff ID not found. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationError(null);

    try {
      const request: AuthVerifyRequest = {
        staffId,
        faceImageUrl: verifyImage
      };

      const response = await apiCall<AuthVerifyResponse>(API_ENDPOINTS.AUTH_VERIFY, {
        method: 'POST',
        body: JSON.stringify(request)
      });

      if (response.success && response.token && response.staff) {
        handleSuccess(response);
      } else {
        setError(response.message || "Face verification failed");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      console.error("Verify error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (response: AuthVerifyResponse | AuthInitiateResponse) => {
    // Store authentication data
    localStorage.setItem("authToken", (response as AuthVerifyResponse).token || "authenticated");
    localStorage.setItem("userSession", JSON.stringify({
      displayName: displayName.trim(),
      loginTime: new Date().toISOString(),
      staffId: staffId || (response as AuthVerifyResponse).staff?.id,
      affiliateCode: (response as AuthVerifyResponse).staff?.affiliateCode
    }));

    setStep('success');
    
    // Redirect to dashboard after a brief success message
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  const handleFaceError = (error: FaceVerificationError) => {
    setVerificationError(error);
  };

  const getErrorMessage = (error: FaceVerificationError) => {
    switch (error.code) {
      case 'NO_FACE_DETECTED':
        return "No face detected in the image. Please ensure your face is visible.";
      case 'MULTIPLE_FACES':
        return "Multiple faces detected. Please use a single face image.";
      case 'POOR_QUALITY':
        return "Image quality too poor. Please use a clearer image.";
      case 'LIGHTING_ISSUES':
        return "Poor lighting detected. Please try with better lighting.";
      case 'ANGLE_ISSUES':
        return "Face angle not suitable. Please face the camera directly.";
      default:
        return error.message;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-bg text-primary-fg p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">TJ</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Staff Authentication</h1>
          <p className="text-primary-muted">The Jaayvee World Portal</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'initiate' ? 'bg-primary-accent text-white' : 
              step === 'verify' || step === 'success' ? 'bg-green-500 text-white' : 
              'bg-primary-border text-primary-muted'
            }`}>
              <User size={16} />
            </div>
            <div className={`w-8 h-0.5 ${step === 'verify' || step === 'success' ? 'bg-primary-accent' : 'bg-primary-border'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'verify' ? 'bg-primary-accent text-white' : 
              step === 'success' ? 'bg-green-500 text-white' : 
              'bg-primary-border text-primary-muted'
            }`}>
              <Camera size={16} />
            </div>
            <div className={`w-8 h-0.5 ${step === 'success' ? 'bg-green-500' : 'bg-primary-border'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'success' ? 'bg-green-500 text-white' : 'bg-primary-border text-primary-muted'
            }`}>
              <CheckCircle size={16} />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          {step === 'initiate' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={20} />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Face Image (Optional)
                </label>
                <FaceLogin 
                  onCapture={setFaceImage}
                  onError={handleFaceError}
                />
              </div>

              {verificationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5" size={16} />
                    <div>
                      <p className="text-red-700 font-medium">Image Issue</p>
                      <p className="text-red-600 text-sm">{getErrorMessage(verificationError)}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleInitiate}
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-primary-fg mb-2">Face Verification</h2>
                <p className="text-primary-muted">Please capture a clear photo of your face for verification</p>
              </div>

              <FaceLogin 
                onCapture={handleVerify}
                onError={handleFaceError}
                isVerifying={isLoading}
              />

              {verificationError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5" size={16} />
                    <div>
                      <p className="text-red-700 font-medium">Verification Failed</p>
                      <p className="text-red-600 text-sm">{getErrorMessage(verificationError)}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-primary-fg">Authentication Successful!</h2>
              <p className="text-primary-muted">Redirecting to dashboard...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-primary-muted">
          <p>Secure face authentication required</p>
        </div>
      </div>
    </div>
  );
}
