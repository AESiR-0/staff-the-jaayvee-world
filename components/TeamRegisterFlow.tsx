"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { teamRegister } from "@/lib/api";

type AuthStep = 'register' | 'success';

export default function TeamRegisterFlow() {
  const [step, setStep] = useState<AuthStep>('register');
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await teamRegister(fullName, email, password, phone);
      
      if (response.success) {
        console.log('✅ Registration successful');
        setStep('success');
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(response.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold text-primary-fg mb-2">Team Registration</h1>
          <p className="text-primary-muted">Join The Jaayvee World Portal</p>
        </div>

        {/* Register Form */}
        <div className="card">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={20} />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={20} />
                <input
                  type="email"
                  placeholder="team@jaayvee.world"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-primary-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  required
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
                  required
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

            <div>
              <label className="block text-sm font-medium text-primary-fg mb-2">
                Phone Number <span className="text-primary-muted text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted" size={20} />
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center text-sm text-primary-muted">
              <p>
                Already have an account?{" "}
                <a href="/login" className="text-primary-accent hover:underline">
                  Sign in here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {step === 'success' && (
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-primary-fg">Registration Successful!</h2>
            <p className="text-primary-muted">Redirecting to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
}


