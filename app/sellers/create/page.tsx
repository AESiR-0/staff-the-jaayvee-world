"use client";
import { useState, useEffect } from "react";
import { CheckCircle, UserPlus, Phone, User, Key, Users, Sparkles, Store, UserCheck, Shield, Eye, EyeOff, RefreshCw, Building2, Globe, Instagram, Youtube, Copy, Check } from "lucide-react";
import { fetchAPI, API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { authenticatedFetch, getTeamSession, getAuthToken } from "@/lib/auth-utils";

type RoleType = 'affiliate' | 'agent' | 'seller' | 'influencer' | 'staff';

interface BaseFormData {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface SellerFormData extends BaseFormData {
  businessName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface InfluencerFormData extends BaseFormData {
  instagramHandle: string;
  youtubeHandle: string;
  instagramFollowers: string;
  youtubeSubscribers: string;
  tier: string;
}



// Password strength calculator
function calculatePasswordStrength(password: string): { strength: number; label: string; color: string } {
  if (!password) return { strength: 0, label: '', color: '' };
  
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  
  if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
  if (strength <= 4) return { strength, label: 'Medium', color: 'bg-yellow-500' };
  if (strength <= 5) return { strength, label: 'Strong', color: 'bg-blue-500' };
  return { strength, label: 'Very Strong', color: 'bg-green-500' };
}

// Generate secure random password
function generatePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Referral Code Display Component
function ReferralCodeDisplay({ code, role }: { code: string; role: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const roleLabel = role === 'affiliate' ? 'Affiliate Code' : 
                   role === 'agent' ? 'Agent Referral Code' :
                   role === 'influencer' ? 'Influencer Referral Code' :
                   role === 'seller' ? 'Seller Referral Code' :
                   role === 'staff' ? 'Staff Referral Code' :
                   'Referral Code';

  return (
    <div className="col-span-2">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-1">{roleLabel}:</span>
            <span className="text-lg font-mono font-bold text-blue-700 bg-white px-3 py-2 rounded border border-blue-200 inline-block">
              {code}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            title="Copy referral code"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600">Copy</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this code with users to track referrals and build your downline
        </p>
      </div>
    </div>
  );
}

export default function CreateUserPage() {
  const [activeTab, setActiveTab] = useState<RoleType>('seller');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserReferralCode, setCurrentUserReferralCode] = useState<string | null>(null);
  const [canCreateStaff, setCanCreateStaff] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data for each role type
  const [sellerFormData, setSellerFormData] = useState<SellerFormData>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [agentFormData, setAgentFormData] = useState<BaseFormData>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [affiliateFormData, setAffiliateFormData] = useState<BaseFormData>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [influencerFormData, setInfluencerFormData] = useState<InfluencerFormData>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    instagramHandle: '',
    youtubeHandle: '',
    instagramFollowers: '',
    youtubeSubscribers: '',
    tier: 'Bronze'
  });

  const [staffFormData, setStaffFormData] = useState<BaseFormData>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Get current user info and referral code
  useEffect(() => {
    const checkAdminStatus = async () => {
      const session = getTeamSession();
      if (session?.email) {
        setCurrentUserEmail(session.email);
        
        // Check if user can create staff accounts (requires super admin)
        try {
          const token = getAuthToken();
          if (token) {
            const { checkHasAccessClient } = require('@/lib/permissions');
            const result = await checkHasAccessClient(session.email, '', token, true);
            setCanCreateStaff(result.hasAccess && result.reason === 'super_admin');
          } else {
            setCanCreateStaff(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setCanCreateStaff(false);
        }
        
        // Fetch user's referral code
        fetch(`${API_BASE_URL}/api/staff/affiliate`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data?.referralCode) {
              setCurrentUserReferralCode(data.data.referralCode);
            }
          })
          .catch(err => console.error('Failed to fetch referral code:', err));
      }
    };
    
    checkAdminStatus();
  }, []);

  const tabs = [
    { id: 'affiliate' as RoleType, name: 'Affiliate', icon: UserCheck },
    { id: 'agent' as RoleType, name: 'Agent', icon: Users },
    { id: 'seller' as RoleType, name: 'Seller', icon: Store },
    { id: 'influencer' as RoleType, name: 'Influencer', icon: Sparkles },
    ...(canCreateStaff ? [{ id: 'staff' as RoleType, name: 'Team', icon: Shield }] : []),
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    formType: RoleType
  ) => {
    const { name, value } = e.target;
    
    switch (formType) {
      case 'seller':
        setSellerFormData(prev => ({ ...prev, [name]: value }));
        break;
      case 'agent':
        setAgentFormData(prev => ({ ...prev, [name]: value }));
        break;
      case 'affiliate':
        setAffiliateFormData(prev => ({ ...prev, [name]: value }) as BaseFormData);
        break;
      case 'influencer':
        setInfluencerFormData(prev => ({ ...prev, [name]: value }));
        break;
      case 'staff':
        setStaffFormData(prev => ({ ...prev, [name]: value }));
        break;
    }
  };

  const generatePasswordForForm = (formType: RoleType) => {
    const newPassword = generatePassword(16);
    
    switch (formType) {
      case 'seller':
        setSellerFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
        break;
      case 'agent':
        setAgentFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
        break;
      case 'affiliate':
        setAffiliateFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }) as BaseFormData);
        break;
      case 'influencer':
        setInfluencerFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
        break;
      case 'staff':
        setStaffFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
        break;
    }
  };

  const resetForm = (roleType: RoleType) => {
    switch (roleType) {
      case 'seller':
        setSellerFormData({
          email: '',
          fullName: '',
          phone: '',
          password: '',
          confirmPassword: '',
          businessName: '',
          address: '',
          city: '',
          state: '',
          pincode: ''
        });
        break;
      case 'agent':
      case 'staff':
        const resetData = {
          email: '',
          fullName: '',
          phone: '',
          password: '',
          confirmPassword: ''
        };
        if (roleType === 'agent') setAgentFormData(resetData);
        if (roleType === 'staff') setStaffFormData(resetData);
        break;
      case 'affiliate':
        setAffiliateFormData({
          email: '',
          fullName: '',
          phone: '',
          password: '',
          confirmPassword: '',
        });
        break;
      case 'influencer':
        setInfluencerFormData({
          email: '',
          fullName: '',
          phone: '',
          password: '',
          confirmPassword: '',
          instagramHandle: '',
          youtubeHandle: '',
          instagramFollowers: '',
          youtubeSubscribers: '',
          tier: 'Bronze'
        });
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent, roleType: RoleType) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let formData: any;
    let endpoint: string;
    let payload: any;

    switch (roleType) {
      case 'seller':
        formData = sellerFormData;
        endpoint = API_ENDPOINTS.CREATE_SELLER;
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }

        payload = {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          password: formData.password,
          businessName: formData.businessName || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          pincode: formData.pincode || undefined
        };
        break;

      case 'agent':
        formData = agentFormData;
        endpoint = `${API_BASE_URL}/api/agents/create`;
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }

        payload = {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          password: formData.password,
        };
        break;

      case 'affiliate':
        formData = affiliateFormData;
        endpoint = `${API_BASE_URL}/api/affiliates/register`;
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }

        payload = {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          password: formData.password,  
        };
        break;

      case 'influencer':
        formData = influencerFormData;
        endpoint = `${API_BASE_URL}/api/influencers/register`;
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }

        payload = {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          password: formData.password,
          instagramHandle: formData.instagramHandle || undefined,
          youtubeHandle: formData.youtubeHandle || undefined,
          instagramFollowers: formData.instagramFollowers ? parseInt(formData.instagramFollowers) : 0,
          youtubeSubscribers: formData.youtubeSubscribers ? parseInt(formData.youtubeSubscribers) : 0,
          tier: formData.tier || 'Bronze',
        };
        break;

      case 'staff':
        formData = staffFormData;
        endpoint = `${API_BASE_URL}/api/staff/auth/register`;
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setIsLoading(false);
          return;
        }

        payload = {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          password: formData.password,
        };
        break;
    }

    try {
      let result: any;

      if (roleType === 'seller') {
        result = await fetchAPI(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } else {
        const response = await authenticatedFetch(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        result = await response.json();
      }

      if (result.success) {
        setSuccess(true);
        // Extract referral code based on role
        let referralCode = null;
        if (result.data.referralCode) {
          referralCode = result.data.referralCode; // Seller or Staff
        } else if (result.data.agent?.referralCode) {
          referralCode = result.data.agent.referralCode; // Agent
        } else if (result.data.affiliate?.code) {
          referralCode = result.data.affiliate.code; // Affiliate
        } else if (result.data.influencer?.referralCode) {
          referralCode = result.data.influencer.referralCode; // Influencer
        }
        
        setCreatedUser({ 
          ...result.data, 
          role: roleType,
          referralCode: referralCode // Store referral code at top level for easier access
        });
        resetForm(roleType);
      } else {
        setError(result.error || `Failed to create ${roleType}`);
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      console.error(`Create ${roleType} error:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFormData = (roleType: RoleType) => {
    switch (roleType) {
      case 'seller':
        return sellerFormData;
      case 'agent':
        return agentFormData;
      case 'affiliate':
        return affiliateFormData;
      case 'influencer':
        return influencerFormData;
      case 'staff':
        return staffFormData;
    }
  };

  const renderForm = (roleType: RoleType) => {
    const formData = getFormData(roleType);
    const Icon = tabs.find(t => t.id === roleType)?.icon || User;
    const passwordStrength = calculatePasswordStrength(formData.password);

    return (
      <form onSubmit={(e) => handleSubmit(e, roleType)} className="space-y-6">
        {/* Personal Information - Required Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Required Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${roleType}-fullName`} className="block text-sm font-medium mb-1">
                Full Name *
              </label>
              <input
                id={`${roleType}-fullName`}
                name="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange(e, roleType)}
                required
                placeholder="Enter full name"
                className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
            
            <div>
              <label htmlFor={`${roleType}-email`} className="block text-sm font-medium mb-1">
                Email *
              </label>
              <input
                id={`${roleType}-email`}
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange(e, roleType)}
                required
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
            
            <div>
              <label htmlFor={`${roleType}-phone`} className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                id={`${roleType}-phone`}
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange(e, roleType)}
                placeholder="Enter phone number (optional)"
                className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
          </div>
        </div>

        {/* Influencer-specific fields */}
        {roleType === 'influencer' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Social Media Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="influencer-instagramHandle" className="block text-sm font-medium mb-1">
                  Instagram Handle *
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="influencer-instagramHandle"
                    name="instagramHandle"
                    value={influencerFormData.instagramHandle}
                    onChange={(e) => handleInputChange(e, 'influencer')}
                    required
                    placeholder="@username"
                    className="w-full pl-10 pr-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="influencer-instagramFollowers" className="block text-sm font-medium mb-1">
                  Instagram Followers *
                </label>
                <input
                  id="influencer-instagramFollowers"
                  name="instagramFollowers"
                  type="number"
                  value={influencerFormData.instagramFollowers}
                  onChange={(e) => handleInputChange(e, 'influencer')}
                  required
                  placeholder="Number of followers"
                  min="0"
                  className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              
              <div>
                <label htmlFor="influencer-youtubeHandle" className="block text-sm font-medium mb-1">
                  YouTube Handle
                </label>
                <div className="relative">
                  <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="influencer-youtubeHandle"
                    name="youtubeHandle"
                    value={influencerFormData.youtubeHandle}
                    onChange={(e) => handleInputChange(e, 'influencer')}
                    placeholder="@channel or channel name"
                    className="w-full pl-10 pr-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="influencer-youtubeSubscribers" className="block text-sm font-medium mb-1">
                  YouTube Subscribers
                </label>
                <input
                  id="influencer-youtubeSubscribers"
                  name="youtubeSubscribers"
                  type="number"
                  value={influencerFormData.youtubeSubscribers}
                  onChange={(e) => handleInputChange(e, 'influencer')}
                  placeholder="Number of subscribers"
                  min="0"
                  className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              
              <div>
                <label htmlFor="influencer-tier" className="block text-sm font-medium mb-1">
                  Tier *
                </label>
                <select
                  id="influencer-tier"
                  name="tier"
                  value={influencerFormData.tier}
                  onChange={(e) => handleInputChange(e, 'influencer')}
                  required
                  className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                >
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                </select>
              </div>
            </div>
          </div>
        )}

      
        {/* Seller-specific optional fields */}
        {roleType === 'seller' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5" />
              Business Information (Optional)
            </h3>
            
            <div>
              <label htmlFor="seller-businessName" className="block text-sm font-medium mb-1">
                Business Name
              </label>
              <input
                id="seller-businessName"
                name="businessName"
                value={sellerFormData.businessName}
                onChange={(e) => handleInputChange(e, 'seller')}
                placeholder="Enter business name (optional)"
                className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
            
            <div>
              <label htmlFor="seller-address" className="block text-sm font-medium mb-1">
                Address
              </label>
              <textarea
                id="seller-address"
                name="address"
                value={sellerFormData.address}
                onChange={(e) => handleInputChange(e, 'seller')}
                placeholder="Enter business address (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="seller-city" className="block text-sm font-medium mb-1">
                  City
                </label>
                <input
                  id="seller-city"
                  name="city"
                  value={sellerFormData.city}
                  onChange={(e) => handleInputChange(e, 'seller')}
                  placeholder="Enter city (optional)"
                  className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              
              <div>
                <label htmlFor="seller-state" className="block text-sm font-medium mb-1">
                  State
                </label>
                <input
                  id="seller-state"
                  name="state"
                  value={sellerFormData.state}
                  onChange={(e) => handleInputChange(e, 'seller')}
                  placeholder="Enter state (optional)"
                  className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              
              <div>
                <label htmlFor="seller-pincode" className="block text-sm font-medium mb-1">
                  Pincode
                </label>
                <input
                  id="seller-pincode"
                  name="pincode"
                  value={sellerFormData.pincode}
                  onChange={(e) => handleInputChange(e, 'seller')}
                  placeholder="Enter pincode (optional)"
                  className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security
            </h3>
            <button
              type="button"
              onClick={() => generatePasswordForForm(roleType)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-primary-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Generate Password
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${roleType}-password`} className="block text-sm font-medium mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  id={`${roleType}-password`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange(e, roleType)}
                  required
                  placeholder="Enter password"
                  className="w-full px-3 py-2 pr-10 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password Strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor={`${roleType}-confirmPassword`} className="block text-sm font-medium mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id={`${roleType}-confirmPassword`}
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange(e, roleType)}
                  required
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 pr-10 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>
          </div>
        </div>

        {/* Auto-detected referrer info */}
        {currentUserReferralCode && roleType !== 'staff' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Your referral code ({currentUserReferralCode}) will be automatically set as the referrer for this {roleType}.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {isLoading ? `Creating ${roleType}...` : `Create ${roleType.charAt(0).toUpperCase() + roleType.slice(1)}`}
          </button>
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 px-4 py-2 border border-primary-border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  if (success && createdUser) {
    const roleNames: Record<RoleType, string> = {
      affiliate: 'Affiliate',
      agent: 'Agent',
      seller: 'Seller',
      influencer: 'Influencer',
      staff: 'Team'
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-green-200 rounded-xl shadow-sm">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-800">
                  {roleNames[createdUser.role as RoleType]} Created Successfully!
                </h1>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
                <h3 className="font-semibold text-lg mb-3">User Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {createdUser.user?.fullName || createdUser.name || createdUser.fullName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {createdUser.user?.email || createdUser.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {createdUser.user?.phone || createdUser.phone || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {roleNames[createdUser.role as RoleType] || createdUser.role}
                  </div>
                  {(createdUser.referralCode || createdUser.agent?.referralCode || createdUser.user?.referralCode || createdUser.affiliate?.code || createdUser.influencer?.referralCode) && (
                    <ReferralCodeDisplay 
                      code={createdUser.referralCode || createdUser.agent?.referralCode || createdUser.user?.referralCode || createdUser.affiliate?.code || createdUser.influencer?.referralCode || ''}
                      role={createdUser.role}
                    />
                  )}
                  {createdUser.user?.businessName && (
                    <div className="col-span-2">
                      <span className="font-medium">Business:</span> {createdUser.user.businessName}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSuccess(false);
                    setCreatedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:opacity-90"
                >
                  Create Another
                </button>
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1 px-4 py-2 border border-primary-border rounded-lg hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-primary-border rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="h-8 w-8 text-primary-accent" />
              <div>
                <h1 className="text-2xl font-bold">Create User Account</h1>
                <p className="text-gray-600 mt-1">Create accounts for affiliates, agents, sellers, influencers, or team</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-primary-border mb-6">
              <nav className="flex space-x-1" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-primary-accent text-primary-accent'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Form Content */}
            <div className="mt-6">
              {renderForm(activeTab)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

