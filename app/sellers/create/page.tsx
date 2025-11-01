"use client";
import { useState, useEffect } from "react";
import { CheckCircle, UserPlus, Phone, User, Key, Users, Sparkles, Store, UserCheck, Shield } from "lucide-react";
import { fetchAPI, API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";

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

export default function CreateUserPage() {
  const [activeTab, setActiveTab] = useState<RoleType>('seller');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserReferralCode, setCurrentUserReferralCode] = useState<string | null>(null);
  const [canCreateStaff, setCanCreateStaff] = useState(false);

  // Form data for each role type - only required fields
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
    confirmPassword: ''
  });

  const [influencerFormData, setInfluencerFormData] = useState<BaseFormData>({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: ''
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
    const session = getStaffSession();
    if (session?.email) {
      setCurrentUserEmail(session.email);
      
      // Check if user can create staff accounts
      const allowedEmails = ['md.thejaayveeworld@gmail.com', 'thejaayveeworldofficial@gmail.com'];
      setCanCreateStaff(allowedEmails.includes(session.email));
      
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
  }, []);

  const tabs = [
    { id: 'affiliate' as RoleType, name: 'Affiliate', icon: UserCheck },
    { id: 'agent' as RoleType, name: 'Agent', icon: Users },
    { id: 'seller' as RoleType, name: 'Seller', icon: Store },
    { id: 'influencer' as RoleType, name: 'Influencer', icon: Sparkles },
    ...(canCreateStaff ? [{ id: 'staff' as RoleType, name: 'Staff', icon: Shield }] : []),
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
        setAffiliateFormData(prev => ({ ...prev, [name]: value }));
        break;
      case 'influencer':
        setInfluencerFormData(prev => ({ ...prev, [name]: value }));
        break;
      case 'staff':
        setStaffFormData(prev => ({ ...prev, [name]: value }));
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
      case 'affiliate':
      case 'influencer':
      case 'staff':
        const resetData = {
          email: '',
          fullName: '',
          phone: '',
          password: '',
          confirmPassword: ''
        };
        if (roleType === 'agent') setAgentFormData(resetData);
        if (roleType === 'affiliate') setAffiliateFormData(resetData);
        if (roleType === 'influencer') setInfluencerFormData(resetData);
        if (roleType === 'staff') setStaffFormData(resetData);
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
        
        // Validation
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
        setCreatedUser({ ...result.data, role: roleType });
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

    return (
      <form onSubmit={(e) => handleSubmit(e, roleType)} className="space-y-6">
        {/* Personal Information - Only Required Fields */}
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
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" />
            Security
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${roleType}-password`} className="block text-sm font-medium mb-1">
                Password *
              </label>
              <input
                id={`${roleType}-password`}
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange(e, roleType)}
                required
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
            </div>
            
            <div>
              <label htmlFor={`${roleType}-confirmPassword`} className="block text-sm font-medium mb-1">
                Confirm Password *
              </label>
              <input
                id={`${roleType}-confirmPassword`}
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange(e, roleType)}
                required
                placeholder="Confirm password"
                className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              />
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
      staff: 'Staff'
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
                    <div className="col-span-2">
                      <span className="font-medium">Referral Code:</span>
                      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        {createdUser.referralCode || createdUser.agent?.referralCode || createdUser.user?.referralCode || createdUser.affiliate?.code || createdUser.influencer?.referralCode}
                      </span>
                    </div>
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
