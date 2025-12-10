"use client";

import { useState, useEffect } from "react";
import { Search, Users, FileText } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { PaperworkManager } from "@/components/PaperworkManager";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';

interface User {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
}

export default function PaperworkPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/api/admin/users?limit=100`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users || []);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.fullName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-primary-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-fg flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Team Paperwork Management
          </h1>
          <p className="text-primary-muted mt-2">
            Upload and manage paperwork documents for team members
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <div className="card">
            <div className="p-6 border-b border-primary-border">
              <h2 className="text-lg font-semibold text-primary-fg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-muted h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-primary-muted text-center py-4">No users found</p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedUserId === user.id
                          ? "bg-blue-50 border-blue-500"
                          : "bg-white border-primary-border hover:bg-primary-bg/50"
                      }`}
                    >
                      <div className="font-medium text-primary-fg">{user.fullName}</div>
                      <div className="text-sm text-primary-muted">{user.email}</div>
                      <div className="text-xs text-primary-muted mt-1">{user.roleName}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Paperwork Manager */}
          <div className="lg:col-span-2">
            {selectedUserId ? (
              <PaperworkManager userId={selectedUserId} userName={selectedUserName} />
            ) : (
              <div className="card">
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-primary-muted mb-4" />
                  <p className="text-primary-muted">
                    Select a team member to view and manage their paperwork
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

