"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { teamLogin } from "@/lib/api";

type AuthStep = 'login' | 'success';

export default function TeamAuthFlow() {
  const [step, setStep] = useState<AuthStep>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await teamLogin(email, password);
      
      if (response.success && response.data.token) {
        // Store token
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userSession", JSON.stringify({
          displayName: response.data.user.name,
          email: response.data.user.email,
          staffId: response.data.staffId, // Backend uses staffId
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('https://talaash.thejaayveeworld.com/Partners_patterns.webp')] text-primary-fg p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">TJ</span>
          </div>
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Team Authentication</h1>
          <p className="text-primary-muted">The Jaayvee World Portal</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={20} />
                <input
                  type="email"
                  placeholder="team@jaayvee.team"
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-muted hover:text-primary-fg transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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

          
          </div>
        </div>

        {/* Success State */}
        {step === 'success' && (
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-primary-fg">Authentication Successful!</h2>
            <p className="text-primary-muted">Redirecting to dashboard...</p>
          </div>
        )}

       
      </div>
    </div>
  );
}

