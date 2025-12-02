'use client'

/**
 * Client-side wrapper for RBAC server actions
 * This file provides client-side functions that call the server actions from jaayvee-world
 */

import { authenticatedFetch } from '@/lib/auth-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com'

export interface Permission {
  id: string
  action: string
  resource: string
  isActive?: boolean
}

/**
 * Get current authenticated user's permissions
 * Calls the server action via API route
 */
export async function getUserPermissions(): Promise<Permission[]> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac/permissions`)
    
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data?.permissions) {
        return data.data.permissions.map((p: any) => ({
          id: p.id,
          action: p.action,
          resource: p.resource,
          isActive: p.isActive !== false
        }))
      }
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error)
  }
  
  return []
}

/**
 * Check if user has permission for a specific resource and action
 */
export async function hasPermission(resource: string, action: string = 'access'): Promise<boolean> {
  try {
    const permissions = await getUserPermissions()
    return permissions.some(p => 
      p.resource === resource && 
      p.action === action && 
      p.isActive !== false
    )
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Check if user can access a specific tab/resource
 */
export async function canAccessTab(tab: string): Promise<boolean> {
  return hasPermission(tab, 'access')
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac/check-super-admin`)
    
    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        return data.data?.isSuperAdmin === true
      }
    }
  } catch (error) {
    console.error('Error checking super admin status:', error)
  }
  
  return false
}

