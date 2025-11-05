"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Shield, Settings, Plus, X, Edit, Trash2, Save, Check, X as XIcon } from "lucide-react";
import { authenticatedFetch, getStaffSession } from "@/lib/auth-utils";

// Only allow thejaayveeworldofficial@gmail.com
const ALLOWED_EMAIL = "thejaayveeworldofficial@gmail.com";

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  roles?: Role[];
}

interface Role {
  id: string;
  name: string;
  symbol: string | null;
  level: number;
  description: string | null;
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
  roles?: Role[];
}

export default function RBACPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'roles'>('users');
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
        const session = await getStaffSession();
        if (!session || !session.email) {
          router.push("/login");
          return;
        }

        if (session.email !== ALLOWED_EMAIL) {
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

  const fetchRBACData = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac?type=all`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users || []);
          setRoles(data.data.roles || []);
          setPermissions(data.data.permissions || []);
          setGroups(data.data.groups || []);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch RBAC data:", err);
      setError("Failed to load RBAC data");
    }
  };

  const handleAssignRoleToUser = async (userId: string, roleId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "assignRoleToUser",
          data: { userId, roleId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Role assigned successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to assign role");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    }
  };

  const handleRemoveRoleFromUser = async (userId: string, roleId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "removeRoleFromUser",
          data: { userId, roleId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Role removed successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to remove role");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove role");
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

  const handleAssignRoleToGroup = async (groupId: string, roleId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "assignRoleToGroup",
          data: { groupId, roleId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Role assigned to group successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to assign role to group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign role to group");
    }
  };

  const handleRemoveRoleFromGroup = async (groupId: string, roleId: string) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/rbac`, {
        method: "POST",
        body: JSON.stringify({
          action: "removeRoleFromGroup",
          data: { groupId, roleId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess("Role removed from group successfully");
        await fetchRBACData();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to remove role from group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove role from group");
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
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'roles'
                ? 'text-primary-accent border-b-2 border-primary-accent'
                : 'text-primary-muted hover:text-primary-fg'
            }`}
          >
            <Settings className="inline h-4 w-4 mr-2" />
            Roles & Permissions
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-primary-fg mb-4">Users & Roles</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border border-primary-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary-fg">{user.fullName}</h3>
                      <p className="text-sm text-primary-muted">{user.email}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-primary-fg mb-2">Current Roles:</p>
                        <div className="flex flex-wrap gap-2">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span
                                key={role.id}
                                className="px-2 py-1 bg-primary-accent-light text-primary-fg rounded text-sm flex items-center gap-1"
                              >
                                {role.name}
                                <button
                                  onClick={() => handleRemoveRoleFromUser(user.id, role.id)}
                                  className="hover:text-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-primary-muted text-sm">No roles assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <label className="block text-sm font-medium text-primary-fg mb-2">Assign Role:</label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignRoleToUser(user.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="px-3 py-2 border border-primary-border rounded-lg bg-primary-bg text-primary-fg text-sm"
                      >
                        <option value="">Select role...</option>
                        {roles
                          .filter(role => !user.roles?.some(r => r.id === role.id))
                          .map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
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

                      {/* Group Roles */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-primary-fg">Roles ({group.roles?.length || 0})</h4>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignRoleToGroup(group.id, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="text-xs px-2 py-1 border border-primary-border rounded bg-primary-bg text-primary-fg"
                          >
                            <option value="">Add role...</option>
                            {roles
                              .filter((role) => !group.roles?.some((r) => r.id === role.id))
                              .map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          {group.roles && group.roles.length > 0 ? (
                            group.roles.map((role) => (
                              <div
                                key={role.id}
                                className="flex items-center justify-between p-2 bg-primary-accent-light rounded text-sm"
                              >
                                <span className="text-primary-fg">{role.name}</span>
                                <button
                                  onClick={() => handleRemoveRoleFromGroup(group.id, role.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-primary-muted">No roles assigned</p>
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

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-primary-fg mb-4">Roles & Permissions</h2>
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="border border-primary-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-primary-fg">
                        {role.symbol && <span className="mr-2">{role.symbol}</span>}
                        {role.name}
                      </h3>
                      <p className="text-sm text-primary-muted mt-1">Level: {role.level}</p>
                      {role.description && (
                        <p className="text-sm text-primary-muted mt-1">{role.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-primary-fg mb-3">All Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="p-2 bg-primary-accent-light rounded text-sm text-primary-fg"
                  >
                    {permission.action} : {permission.resource}
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

