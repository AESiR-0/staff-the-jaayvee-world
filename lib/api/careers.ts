/**
 * Careers API Service
 * Handles all API calls for career management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

export interface CareerData {
  id: string;
  title: string;
  type: "Full-time" | "Internship" | "Contract";
  location: string;
  experience: string | null;
  duration: string | null;
  description: string;
  tagColor: string;
  isActive: boolean;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CareerFormData {
  title: string;
  type: "Full-time" | "Internship" | "Contract";
  location: string;
  experience: string;
  duration: string;
  description: string;
  tagColor: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Fetch all careers (public endpoint)
 */
export async function fetchCareers(): Promise<CareerData[]> {
  const response = await fetch(`${API_BASE_URL}/api/careers`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch careers`);
  }
  
  const result: ApiResponse<CareerData[]> = await response.json();
  if (result.success && result.data) {
    return result.data;
  }
  
  throw new Error(result.error || 'Failed to load careers');
}

/**
 * Create a new career
 */
export async function createCareer(data: CareerFormData): Promise<CareerData> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/api/careers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result: ApiResponse<CareerData> = await response.json();
    throw new Error(result.error || 'Failed to create career');
  }

  const result: ApiResponse<CareerData> = await response.json();
  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.error || 'Failed to create career');
}

/**
 * Update an existing career
 */
export async function updateCareer(id: string, data: CareerFormData): Promise<CareerData> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/api/careers`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ id, ...data }),
  });

  if (!response.ok) {
    const result: ApiResponse<CareerData> = await response.json();
    throw new Error(result.error || 'Failed to update career');
  }

  const result: ApiResponse<CareerData> = await response.json();
  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.error || 'Failed to update career');
}

/**
 * Delete a career
 */
export async function deleteCareer(id: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/api/careers?id=${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result: ApiResponse<null> = await response.json();
    throw new Error(result.error || 'Failed to delete career');
  }
}

/**
 * Seed dummy career data
 */
export async function seedCareers(): Promise<CareerData[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/api/careers/seed`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result: ApiResponse<CareerData[]> = await response.json();
    throw new Error(result.error || 'Failed to seed careers');
  }

  const result: ApiResponse<CareerData[]> = await response.json();
  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.error || 'Failed to seed careers');
}

