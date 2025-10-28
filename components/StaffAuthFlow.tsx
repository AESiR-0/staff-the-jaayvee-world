"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Camera, CheckCircle, AlertCircle, ArrowRight, Mail, Lock } from "lucide-react";
import FaceLogin from "./FaceLogin";
import { API_ENDPOINTS, apiCall, staffLogin } from "@/lib/api";
import { getFaceDescriptor, validateFaceInImage, verifyFaceClient } from "@/lib/face-recognition-client";

// Use the correct endpoint names
const AUTH_INITIATE = API_ENDPOINTS.STAFF_AUTH_INITIATE;
const AUTH_VERIFY = API_ENDPOINTS.STAFF_AUTH_VERIFY;
import { 
  AuthInitiateRequest, 
  AuthInitiateResponse, 
  AuthVerifyRequest, 
  AuthVerifyResponse,
  FaceVerificationError 
} from "@/lib/types";

type AuthStep = 'login' | 'initiate' | 'verify' | 'success';

export default function StaffAuthFlow() {
  const [step, setStep] = useState<AuthStep>('login');
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffId, setStaffId] = useState("");
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [registeredFaceImage, setRegisteredFaceImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<FaceVerificationError | null>(null);
  const router = useRouter();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await staffLogin(email, password);
      
      if (response.success && response.data.token) {
        // Store token
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userSession", JSON.stringify({
          displayName: response.data.user.name,
          email: response.data.user.email,
          staffId: response.data.staffId,
          loginTime: new Date().toISOString(),
          affiliateCode: response.data.affiliateCode
        }));
        
        console.log('✅ Login successful');
        setStep('success');
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setError(response.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiate = async () => {
    if (!displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Extract face descriptor if image is provided
      let faceDescriptor = undefined;
      if (faceImage) {
        const descriptor = await getFaceDescriptor(faceImage);
        if (descriptor) {
          faceDescriptor = JSON.stringify(descriptor);
        }
      }

      const request: AuthInitiateRequest = {
        displayName: displayName.trim(),
        faceImageUrl: faceDescriptor
      };

      const response = await apiCall<AuthInitiateResponse>(AUTH_INITIATE, {
        method: 'POST',
        body: JSON.stringify(request)
      });

      if (response.success && response.staffId) {
        setStaffId(response.staffId);
        
        // Store token if provided
        if (response.token) {
          localStorage.setItem("authToken", response.token);
          console.log('✅ Auth token stored');
        }
        
        if (response.requiresVerification && response.registeredFaceImage) {
          console.log('📥 Received registered face from initiate:', {
            length: response.registeredFaceImage.length,
            preview: response.registeredFaceImage.substring(0, 100)
          });
          setRegisteredFaceImage(response.registeredFaceImage);
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
    console.log('🔍 handleVerify called', {
      hasStaffId: !!staffId,
      hasRegisteredFace: !!registeredFaceImage,
      imageLength: verifyImage?.length,
      imagePreview: verifyImage?.substring(0, 50)
    });
    
    if (!staffId) {
      setError("Staff ID not found. Please try again.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setVerificationError(null);

    try {
      // If no registered face (old format in database), skip client-side verification
      if (!registeredFaceImage) {
        console.log('⚠️ No registered face found, skipping client-side verification');
        // Proceed directly to server verification
      } else {
        // Verify face on client side using face-api.js
        console.log('📸 Starting client-side face verification...');
        console.log('📋 Registered face type check:', {
          isString: typeof registeredFaceImage === 'string',
          startsWithData: registeredFaceImage?.startsWith('data:image'),
          startsWithBracket: registeredFaceImage?.startsWith('['),
          startsWithCurly: registeredFaceImage?.startsWith('{'),
          preview: registeredFaceImage?.substring(0, 50)
        });
        
        const verification = await verifyFaceClient(verifyImage, registeredFaceImage);
        
        console.log('✅ Client-side verification result:', verification);
        
        if (!verification.match) {
          setError(verification.error || `Face verification failed. Confidence: ${verification.confidence}%`);
          return;
        }
      }

      // Get the descriptor and send to server (whether or not client-side verification ran)
      console.log('🎯 Extracting descriptor to send to server...');
      const validation = await validateFaceInImage(verifyImage);
      
      if (!validation.valid || !validation.descriptor) {
        setError("Failed to extract face descriptor");
        return;
      }

      // Log the descriptor for debugging
      console.log('📦 Extracted descriptor:', {
        length: validation.descriptor.length,
        firstFew: validation.descriptor.slice(0, 5)
      });

      // Send descriptor to API
      const request = {
        staffId,
        faceImageUrl: validation.descriptor // Send as array, will be stringified by fetchAPI
      };
      
      console.log('🚀 Calling verify API with:', {
        endpoint: AUTH_VERIFY,
        staffId: request.staffId,
        faceImageUrlLength: request.faceImageUrl.length,
        faceImageUrlPreview: request.faceImageUrl.slice(0, 5)
      });

      const response = await apiCall<AuthVerifyResponse>(AUTH_VERIFY, {
        method: 'POST',
        body: JSON.stringify(request)
      });
      
      console.log('📡 Verify API response:', response);

      if (response.success && response.token && response.staff) {
        handleSuccess(response);
      } else if ((response as any).needsReRegistration) {
        // Database has old format, need to delete and re-register
        setError("Face registration is outdated. Please re-register your face by restarting the process.");
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

  // Removed demo login - users must authenticate through proper flow

  const handleSuccess = (response: AuthVerifyResponse | AuthInitiateResponse) => {
    // Store authentication data with real staffId
    const finalStaffId = staffId || `staff_${(response as any).userId}` || `staff_${(response as any).staff?.id}`;
    
    // Use the token from response - must have a valid token
    const tokenToStore = (response as AuthVerifyResponse).token || (response as AuthInitiateResponse).token;
    
    if (!tokenToStore) {
      console.error('No token received from authentication');
      setError('Authentication failed - no token received');
      return;
    }
    
    localStorage.setItem("authToken", tokenToStore);
    localStorage.setItem("userSession", JSON.stringify({
      displayName: (response as any).displayName || displayName.trim(),
      loginTime: new Date().toISOString(),
      staffId: finalStaffId,
      affiliateCode: (response as AuthVerifyResponse).staff?.affiliateCode || (response as any).affiliateCode
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
        {step !== 'login' && (
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
        )}

        {/* Step Content */}
        <div className="card">
          {step === 'login' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={20} />
                  <input
                    type="email"
                    placeholder="staff@jaayvee.staff"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-fg mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={20} />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleEmailLogin}
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-primary-bg text-primary-muted">Or use face authentication</span>
                </div>
              </div>

              <button
                onClick={() => setStep('initiate')}
                className="w-full border border-primary-border text-primary-fg px-4 py-3 rounded-xl hover:bg-primary-accent hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Camera size={16} />
                Use Face Authentication
              </button>
            </div>
          )}

          {step === 'initiate' && (
            <div className="space-y-6">
              <button
                onClick={() => setStep('login')}
                className="w-full border border-primary-border text-primary-fg px-4 py-3 rounded-xl hover:bg-primary-accent hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Use Email/Password Login
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-primary-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-primary-bg text-primary-muted">Or continue with face</span>
                </div>
              </div>

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
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary-accent border-t-transparent rounded-full animate-spin" />
                      <p className="text-primary-muted">Verifying your face...</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-1.5 bg-primary-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary-accent animate-pulse" style={{ width: '60%' }} />
                      </div>
                      <p className="text-xs text-primary-muted">Comparing with registered face</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-primary-muted">Please capture a clear photo of your face for verification</p>
                )}
              </div>

              {!isLoading && (
                <FaceLogin 
                  onCapture={handleVerify}
                  onError={handleFaceError}
                  isVerifying={isLoading}
                />
              )}

              {isLoading && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mt-0.5" />
                    <div className="flex-1">
                      <p className="text-blue-700 font-medium mb-1">Processing Face Verification</p>
                      <p className="text-blue-600 text-sm mb-3">Please wait while we verify your identity...</p>
                      <div className="space-y-2 text-xs text-blue-500">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-green-600" />
                          <span>Extracting face features</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span>Comparing with registered face</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
        {step === 'login' && (
          <div className="text-center mt-8 text-sm text-primary-muted">
            <p>Default password for new staff: Welcome@123</p>
          </div>
        )}
        {step !== 'login' && (
          <div className="text-center mt-8 text-sm text-primary-muted">
            <p>Secure face authentication required</p>
          </div>
        )}
      </div>
    </div>
  );
}
