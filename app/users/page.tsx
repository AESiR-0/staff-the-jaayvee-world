"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Users, Mail, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  createdAt: string;
  createdBy?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (search) {
        params.append("search", search);
      }

      if (roleFilter !== "all") {
        params.append("role", roleFilter);
      }

      const response = await authenticatedFetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
      case "super_admin":
        return "bg-red-100 text-red-800 border border-red-200";
      case "staff":
      case "team":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "affiliate":
        return "bg-green-100 text-green-800 border border-green-200";
      case "agent":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "influencer":
        return "bg-pink-100 text-pink-800 border border-pink-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-primary-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-fg flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="mt-2 text-primary-muted">
            View and manage all users on the platform
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="p-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="team">Team</option>
                <option value="affiliate">Affiliate</option>
                <option value="agent">Agent</option>
                <option value="influencer">Influencer</option>
              </select>
            
            </form>
          </div>
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="p-6 border-b border-primary-border">
            <h2 className="text-xl font-semibold text-primary-fg">
              Users ({total})
            </h2>
          </div>
          <div className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-primary-muted mx-auto mb-4" />
                <p className="text-primary-muted">No users found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-border">
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-primary-border hover:bg-primary-bg/50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary-muted" />
                              <span className="font-medium text-primary-fg">{user.fullName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-primary-muted">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                                user.roleName
                              )}`}
                            >
                              {user.roleName}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-primary-muted">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(user.createdAt), "MMM dd, yyyy")}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-primary-muted">
                      Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}{" "}
                      users
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 inline mr-1" />
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg hover:bg-primary-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 inline ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

