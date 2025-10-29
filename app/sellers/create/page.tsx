"use client";
import { useState } from "react";
import { CheckCircle, UserPlus, Building2, Phone, Mail, User, Key } from "lucide-react";
import { fetchAPI, API_ENDPOINTS } from "@/lib/api";

export default function CreateSellerPage() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    businessName: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdSeller, setCreatedSeller] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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

    try {
      const result = await fetchAPI(API_ENDPOINTS.CREATE_SELLER, {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          password: formData.password,
          referralCode: formData.referralCode || undefined,
          businessName: formData.businessName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        }),
      });

      if (result.success) {
        setSuccess(true);
        setCreatedSeller(result.data);
        setFormData({
          email: '',
          fullName: '',
          phone: '',
          password: '',
          confirmPassword: '',
          referralCode: '',
          businessName: '',
          address: '',
          city: '',
          state: '',
          pincode: ''
        });
      } else {
        setError(result.error || 'Failed to create seller');
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Please try again.');
      console.error('Create seller error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success && createdSeller) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-green-200 rounded-xl shadow-sm">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-800">Seller Created Successfully!</h1>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
                <h3 className="font-semibold text-lg mb-3">Seller Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {createdSeller.user.fullName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {createdSeller.user.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {createdSeller.user.phone || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Business:</span> {createdSeller.user.businessName || 'N/A'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Partner Code:</span> 
                    <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">{createdSeller.referralCode}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSuccess(false);
                    setCreatedSeller(null);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:opacity-90"
                >
                  Create Another Seller
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-primary-border rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="h-8 w-8 text-primary-accent" />
              <div>
                <h1 className="text-2xl font-bold">Create Seller Account</h1>
                <p className="text-gray-600 mt-1">Create a new seller user with referral code</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter full name"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="referralCode" className="block text-sm font-medium mb-1">Referral Code</label>
                    <input
                      id="referralCode"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleInputChange}
                      placeholder="Auto-generated if empty"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </h3>
                
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium mb-1">Business Name</label>
                  <input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter business name"
                    className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter business address"
                    rows={3}
                    className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
                    <input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-1">State</label>
                    <input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium mb-1">Pincode</label>
                    <input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter pincode"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Security
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">Password *</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter password"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm Password *</label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 border border-primary-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Seller...' : 'Create Seller'}
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
          </div>
        </div>
      </div>
    </div>
  );
}