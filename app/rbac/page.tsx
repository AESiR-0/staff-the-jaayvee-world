"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Shield, Settings, Plus, X, Edit, Trash2, Save, Check, X as XIcon } from "lucide-react";
import { authenticatedFetch, getTeamSession } from "@/lib/auth-utils";
import { TEAM_PERMISSIONS, TEAM_PERMISSION_LIST } from "@/lib/rbac";

// Only allow thejaayveeworldofficial@gmail.com
const ALLOWED_EMAIL = "thejaayveeworldofficial@gmail.com";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  permissions?: Permission[];
}

interface Permission {
  id: string;
  action: string;
  resource: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  members?: User[];
  permissions?: Permission[];
}

export default function RBACPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Get unique available permissions from TEAM_PERMISSIONS (source of truth)
  const availablePermissions = TEAM_PERMISSION_LIST.map((perm, index) => ({
    id: `perm-${perm.resource}-${perm.action}-${index}`, // Generate unique ID
    action: perm.action,
    resource: perm.resource,
    description: perm.description,
  }));
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://thejaayveeworld.com";

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const session = await getTeamSession();
        if (!session || !session.email) {
          router.push("/login");
          return;
        }

        if (session.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
          setError("You don't have permission to access this page.");
          setLoading(false);
          return;
        }

        setAuthorized(true);
        await fetchRBACData();
      } catch (err) {
        console.error("Auth error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [router]);

  const fetchRBACData = useCallback(async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac?type=all`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users || []);
          // Use database permissions but we'll use TEAM_PERMISSIONS as source of truth for dropdown
          const dbPermissions = data.data.permissions || [];
          // Remove duplicates from database permissions based on resource+action
          const uniqueDbPermissions: Permission[] = Array.from(
            new Map(
              dbPermissions.map((p: Permission) => [`${p.resource}-${p.action}`, p])
            ).values()
          ) as Permission[];
          setPermissions(uniqueDbPermissions);
          setGroups(data.data.groups || []);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch RBAC data:", err);
      setError("Failed to load RBAC data");
    }
  }, []);
  
  // Helper function to find permission ID in database by resource and action
  const findPermissionId = (resource: string, action: string): string | null => {
    const found = permissions.find(
      p => p.resource === resource && p.action === action
    );
    return found?.id || null;
  };
  
  // Helper function to check if user has a specific permission
  const userHasPermission = (user: User, resource: string, action: string): boolean => {
    if (!user.permissions) return false;
    return user.permissions.some(
      p => p.resource === resource && p.action === action
    );
  };
  
  // Helper function to get permission ID for assignment (create if doesn't exist)
  const getOrCreatePermissionId = async (resource: string, action: string): Promise<string | null> => {
    // First check if it exists in database permissions
    const existing = findPermissionId(resource, action);
    if (existing) return existing;
    
    // If not found, we need to create it or use a fallback
    // For now, return null and let the API handle creation
    return null;
  };

  const handleAssignPermissionToUser = async (userId: string, resource: string, action: string) => {
    try {
      // Find or get permission ID
      let permissionId = findPermissionId(resource, action);
      
      // If permission doesn't exist in DB, try to create it or use resource+action
      if (!permissionId) {
        // Try to find by resource+action combination
        const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
          method: "POST",
          body: JSON.stringify({
            action: "assignPermissionToUser",
            data: { userId, resource, action }
          }),
        });
        const result = await response.json();
        if (result.success) {
          setSuccess("Permission assigned successfully");
          await fetchRBACData();
          setTimeout(() => setSuccess(null), 3000);
          return;
        } else {
          setError(result.error || "Failed to assign permission");
          return;
        }
      }
      
      // Use existing permission ID
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "assignPermissionToUser",
          data: { userId, permissionId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Permission assigned successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to assign permission");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign permission");
    }
  };

  const handleRemovePermissionFromUser = async (userId: string, permissionId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "removePermissionFromUser",
          data: { userId, permissionId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Permission removed successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to remove permission");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove permission");
    }
  };

  const handleAssignAllPermissionsToUser = async (userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "assignAllPermissionsToUser",
          data: { userId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(result.message || "All permissions assigned successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to assign all permissions");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign all permissions");
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "createGroup",
          data: { name: newGroupName, description: newGroupDescription }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Group created successfully");
        setShowCreateGroup(false);
        setNewGroupName("");
        setNewGroupDescription("");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to create group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    }
  };

  const handleAddUserToGroup = async (groupId: string, userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "addUserToGroup",
          data: { groupId, userId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("User added to group successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to add user to group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to add user to group");
    }
  };

  const handleRemoveUserFromGroup = async (groupId: string, userId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "removeUserFromGroup",
          data: { groupId, userId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("User removed from group successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to remove user from group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove user from group");
    }
  };

  const handleAssignPermissionToGroup = async (groupId: string, resource: string, action: string) => {
    try {
      // Find or get permission ID
      let permissionId = findPermissionId(resource, action);
      
      // If permission doesn't exist in DB, try to create it or use resource+action
      if (!permissionId) {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
          method: "POST",
          body: JSON.stringify({
            action: "assignPermissionToGroup",
            data: { groupId, resource, action }
          }),
        });
        const result = await response.json();
        if (result.success) {
          setSuccess("Permission assigned to group successfully");
          await fetchRBACData();
          setTimeout(() => setSuccess(null), 3000);
          return;
        } else {
          setError(result.error || "Failed to assign permission to group");
          return;
        }
      }
      
      // Use existing permission ID
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "assignPermissionToGroup",
          data: { groupId, permissionId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Permission assigned to group successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to assign permission to group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign permission to group");
    }
  };
  
  // Helper function to check if group has a specific permission
  const groupHasPermission = (group: Group, resource: string, action: string): boolean => {
    if (!group.permissions) return false;
    return group.permissions.some(
      p => p.resource === resource && p.action === action
    );
  };

  const handleRemovePermissionFromGroup = async (groupId: string, permissionId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "removePermissionFromGroup",
          data: { groupId, permissionId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Permission removed from group successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to remove permission from group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove permission from group");
    }
  };

  const handleAssignAllPermissionsToGroup = async (groupId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "assignAllPermissionsToGroup",
          data: { groupId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(result.message || "All permissions assigned to group successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to assign all permissions to group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign all permissions to group");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-primary-fg">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error || "Unauthorized"}</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-primary-accent-light rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-primary-fg" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary-fg">RBAC Management</h1>
              <p className="text-primary-muted">Manage roles, permissions, users, and groups</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
            {error}
            <button onClick={() => setError(null)} className="float-right">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-green-500">
            {success}
            <button onClick={() => setSuccess(null)} className="float-right">×</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-primary-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-primary-accent border-b-2 border-primary-accent'
                : 'text-primary-muted hover:text-primary-fg'
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-primary-accent border-b-2 border-primary-accent'
                : 'text-primary-muted hover:text-primary-fg'
            }`}
          >
            <Shield className="inline h-4 w-4 mr-2" />
            Groups
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-primary-fg mb-4">Users & Permissions</h2>
            <div className="space-y-4">
              {users.map((user) => {
                const isSuperAdmin = user.email?.toLowerCase() === 'thejaayveeworldofficial@gmail.com';
                // Get unique permissions for this user (remove duplicates by resource+action)
                const userUniquePermissions = Array.from(
                  new Map(
                    (user.permissions || []).map((p) => [`${p.resource}-${p.action}`, p])
                  ).values()
                );
                
                return (
                  <div key={user.id} className="border border-primary-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-primary-fg">{user.fullName}</h3>
                          {isSuperAdmin && (
                            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-primary-muted">{user.email}</p>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-primary-fg mb-2">
                            Current Permissions ({userUniquePermissions.length}):
                            {isSuperAdmin && (
                              <span className="ml-2 text-xs text-yellow-600 font-normal">
                                (Universal Access - All Permissions)
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {isSuperAdmin ? (
                              <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 text-yellow-600 rounded text-sm font-medium">
                                All Permissions Enabled
                              </span>
                            ) : userUniquePermissions.length > 0 ? (
                              userUniquePermissions.map((permission) => {
                                const permKey = permission.resource as keyof typeof TEAM_PERMISSIONS;
                                const permInfo = TEAM_PERMISSIONS[permKey];
                                const description = permInfo?.description || `${permission.action}:${permission.resource}`;
                                return (
                                  <span
                                    key={`${permission.resource}-${permission.action}`}
                                    className="px-2 py-1 bg-primary-accent-light text-primary-fg rounded text-sm flex items-center gap-1"
                                  >
                                    {description}
                                    <button
                                      onClick={() => handleRemovePermissionFromUser(user.id, permission.id)}
                                      className="hover:text-red-500"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-primary-muted text-sm">No permissions assigned</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!isSuperAdmin && (
                        <div className="ml-4 flex flex-col gap-2">
                          <label className="block text-sm font-medium text-primary-fg mb-2">Assign Permission:</label>
                          <div className="flex gap-2">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  const [resource, action] = e.target.value.split('::');
                                  handleAssignPermissionToUser(user.id, resource, action);
                                  e.target.value = "";
                                }
                              }}
                              className="px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-sm flex-1"
                            >
                              <option value="">Select permission...</option>
                              {availablePermissions
                                .filter(perm => !userHasPermission(user, perm.resource, perm.action))
                                .map((perm) => (
                                  <option key={`${perm.resource}-${perm.action}`} value={`${perm.resource}::${perm.action}`}>
                                    {perm.description}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleAssignAllPermissionsToUser(user.id)}
                              className="px-3 py-2 bg-primary-accent text-white rounded-lg text-sm hover:bg-primary-accent-dark transition-colors whitespace-nowrap"
                              title="Assign all permissions"
                            >
                              Assign All
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary-fg">Groups</h2>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="px-4 py-2 bg-primary-accent text-white rounded-lg flex items-center gap-2 hover:bg-primary-accent-dark"
                >
                  <Plus className="h-4 w-4" />
                  Create Group
                </button>
              </div>

              {showCreateGroup && (
                <div className="mb-4 p-4 border border-primary-border rounded-lg">
                  <h3 className="font-semibold text-primary-fg mb-3">Create New Group</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateGroup}
                        className="px-4 py-2 bg-primary-accent text-white rounded-lg"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateGroup(false);
                          setNewGroupName("");
                          setNewGroupDescription("");
                        }}
                        className="px-4 py-2 bg-primary-border text-primary-fg rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="border border-primary-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-primary-fg">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-primary-muted mt-1">{group.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          group.isActive
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {group.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Group Members */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-primary-fg">Members ({group.members?.length || 0})</h4>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddUserToGroup(group.id, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="text-xs px-2 py-1 border border-primary-border rounded bg-primary-bg text-primary-fg"
                          >
                            <option value="">Add user...</option>
                            {users
                              .filter(
                                (user) => !group.members?.some((m) => m.id === user.id)
                              )
                              .map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.fullName} ({user.email})
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          {group.members && group.members.length > 0 ? (
                            group.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-2 bg-primary-accent-light rounded text-sm"
                              >
                                <span className="text-primary-fg">
                                  {member.fullName} ({member.email})
                                </span>
                                <button
                                  onClick={() => handleRemoveUserFromGroup(group.id, member.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-primary-muted">No members</p>
                          )}
                        </div>
                      </div>

                      {/* Group Permissions */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-primary-fg">Permissions ({group.permissions ? Array.from(new Map(group.permissions.map((p) => [`${p.resource}-${p.action}`, p])).values()).length : 0})</h4>
                          <div className="flex gap-1">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  const [resource, action] = e.target.value.split('::');
                                  handleAssignPermissionToGroup(group.id, resource, action);
                                  e.target.value = "";
                                }
                              }}
                              className="text-xs px-2 py-1 border border-primary-border rounded bg-primary-bg text-primary-fg"
                            >
                              <option value="">Add permission...</option>
                              {availablePermissions
                                .filter((perm) => !groupHasPermission(group, perm.resource, perm.action))
                                .map((perm) => (
                                  <option key={`${perm.resource}-${perm.action}`} value={`${perm.resource}::${perm.action}`}>
                                    {perm.description}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => handleAssignAllPermissionsToGroup(group.id)}
                              className="text-xs px-2 py-1 bg-primary-accent text-white rounded hover:bg-primary-accent-dark transition-colors whitespace-nowrap"
                              title="Assign all permissions"
                            >
                              All
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {group.permissions && group.permissions.length > 0 ? (
                            Array.from(
                              new Map(
                                group.permissions.map((p) => [`${p.resource}-${p.action}`, p])
                              ).values()
                            ).map((permission) => {
                              const permKey = permission.resource as keyof typeof TEAM_PERMISSIONS;
                              const permInfo = TEAM_PERMISSIONS[permKey];
                              const description = permInfo?.description || `${permission.action}:${permission.resource}`;
                              return (
                                <div
                                  key={`${permission.resource}-${permission.action}`}
                                  className="flex items-center justify-between p-2 bg-primary-accent-light rounded text-sm"
                                >
                                  <span className="text-primary-fg">
                                    {description}
                                  </span>
                                  <button
                                    onClick={() => handleRemovePermissionFromGroup(group.id, permission.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-primary-muted">No permissions assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


