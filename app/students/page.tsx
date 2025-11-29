"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, GraduationCap, Mail, Calendar, User, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Eye, FileText } from "lucide-react";
import { authenticatedFetch } from "@/lib/auth-utils";
import { format } from "date-fns";

interface StudentVerification {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  collegeName: string;
  course: string;
  idProofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  reviewerEmail: string | null;
  reviewerFullName: string | null;
}

export default function StudentsPage() {
  const [verifications, setVerifications] = useState<StudentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedVerification, setSelectedVerification] = useState<StudentVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      // Student API is on the main site (jaayvee-world), not talaash
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/student/list?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // Filter by search term if provided
        let filtered = data.data.verifications;
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter((v: StudentVerification) =>
            v.userEmail.toLowerCase().includes(searchLower) ||
            v.userFullName?.toLowerCase().includes(searchLower) ||
            v.collegeName.toLowerCase().includes(searchLower) ||
            v.course.toLowerCase().includes(searchLower)
          );
        }
        setVerifications(filtered);
        setTotalPages(data.data.pagination.totalPages);
        setTotal(data.data.pagination.total);
      } else {
        setError(data.error || "Failed to fetch student verifications");
      }
    } catch (err: any) {
      console.error("Error fetching student verifications:", err);
      setError(err.message || "Failed to fetch student verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [page, statusFilter]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        fetchVerifications();
      } else {
        setPage(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleStatusUpdate = async (verificationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setUpdating(true);
      
      const body: any = { status: newStatus };
      if (newStatus === 'rejected') {
        if (!rejectionReason.trim()) {
          alert('Please provide a rejection reason');
          return;
        }
        body.rejectionReason = rejectionReason.trim();
      }

      // Student API is on the main site (jaayvee-world), not talaash
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://thejaayveeworld.com';
      const response = await authenticatedFetch(`${API_BASE_URL}/api/student/${verificationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        await fetchVerifications();
        setShowModal(false);
        setSelectedVerification(null);
        setRejectionReason("");
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(err.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const openModal = (verification: StudentVerification) => {
    setSelectedVerification(verification);
    setShowModal(true);
    setRejectionReason(verification.rejectionReason || "");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && verifications.length === 0) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-primary-muted">Loading student verifications...</p>
        </div>
      </div>
    );
  }

  if (error && verifications.length === 0) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchVerifications}
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
            <GraduationCap className="h-8 w-8" />
            Student Verifications
          </h1>
          <p className="mt-2 text-primary-muted">
            View and manage all student verification requests
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-muted" />
                <input
                  type="text"
                  placeholder="Search by name, email, college, or course..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verifications Table */}
        <div className="card">
          <div className="p-6 border-b border-primary-border">
            <h2 className="text-xl font-semibold text-primary-fg">
              Verifications ({total})
            </h2>
          </div>
          <div className="p-6">
            {verifications.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-primary-muted mx-auto mb-4" />
                <p className="text-primary-muted">No student verifications found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-primary-border">
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">College</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Course</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Submitted</th>
                        <th className="text-left py-3 px-4 font-semibold text-primary-fg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifications.map((verification) => (
                        <tr
                          key={verification.id}
                          className="border-b border-primary-border hover:bg-primary-bg/50"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary-muted" />
                                <span className="font-medium text-primary-fg">{verification.userFullName || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-primary-muted mt-1">
                                <Mail className="h-3 w-3" />
                                {verification.userEmail}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-primary-fg">
                            {verification.collegeName}
                          </td>
                          <td className="py-3 px-4 text-primary-fg">
                            {verification.course}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(verification.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 text-primary-muted">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(verification.createdAt), "MMM dd, yyyy")}
                            </div>
                            {verification.reviewedAt && (
                              <div className="text-xs text-primary-muted mt-1">
                                Reviewed: {format(new Date(verification.reviewedAt), "MMM dd, yyyy")}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => openModal(verification)}
                              className="px-3 py-1.5 text-sm bg-primary-accent text-white rounded-lg hover:bg-primary-accent/90 transition-colors flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
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
                      verifications
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

      {/* Modal for viewing and updating verification */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-primary-border shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-primary-border">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary-fg flex items-center gap-2">
                  <GraduationCap className="h-6 w-6" />
                  Student Verification Details
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedVerification(null);
                    setRejectionReason("");
                  }}
                  className="text-primary-muted hover:text-primary-fg"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div>
                <h3 className="text-lg font-semibold text-primary-fg mb-3">Student Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary-muted" />
                    <span className="text-primary-fg"><strong>Name:</strong> {selectedVerification.userFullName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary-muted" />
                    <span className="text-primary-fg"><strong>Email:</strong> {selectedVerification.userEmail}</span>
                  </div>
                </div>
              </div>

              {/* Verification Details */}
              <div>
                <h3 className="text-lg font-semibold text-primary-fg mb-3">Verification Details</h3>
                <div className="space-y-2">
                  <div>
                    <strong className="text-primary-fg">College/University:</strong>
                    <p className="text-primary-fg">{selectedVerification.collegeName}</p>
                  </div>
                  <div>
                    <strong className="text-primary-fg">Course:</strong>
                    <p className="text-primary-fg">{selectedVerification.course}</p>
                  </div>
                  <div>
                    <strong className="text-primary-fg">Status:</strong>
                    <div className="mt-1">{getStatusBadge(selectedVerification.status)}</div>
                  </div>
                  <div>
                    <strong className="text-primary-fg">Submitted:</strong>
                    <p className="text-primary-muted">{format(new Date(selectedVerification.createdAt), "PPpp")}</p>
                  </div>
                  {selectedVerification.reviewedAt && (
                    <div>
                      <strong className="text-primary-fg">Reviewed:</strong>
                      <p className="text-primary-muted">{format(new Date(selectedVerification.reviewedAt), "PPpp")}</p>
                    </div>
                  )}
                  {selectedVerification.reviewerFullName && (
                    <div>
                      <strong className="text-primary-fg">Reviewed By:</strong>
                      <p className="text-primary-muted">{selectedVerification.reviewerFullName}</p>
                    </div>
                  )}
                  {selectedVerification.rejectionReason && (
                    <div>
                      <strong className="text-primary-fg">Rejection Reason:</strong>
                      <p className="text-primary-muted">{selectedVerification.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Proof */}
              <div>
                <h3 className="text-lg font-semibold text-primary-fg mb-3">ID Proof</h3>
                <div className="border border-primary-border rounded-lg p-4">
                  <a
                    href={selectedVerification.idProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-accent hover:underline"
                  >
                    <FileText className="h-5 w-5" />
                    View ID Proof (opens in new tab)
                  </a>
                </div>
              </div>

              {/* Actions */}
              {selectedVerification.status === 'pending' && (
                <div className="pt-4 border-t border-primary-border">
                  <h3 className="text-lg font-semibold text-primary-fg mb-3">Actions</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-fg mb-2">
                        Rejection Reason (required if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="w-full px-4 py-2 border border-primary-border rounded-lg bg-white text-primary-fg focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStatusUpdate(selectedVerification.id, 'approved')}
                        disabled={updating}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {updating ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedVerification.id, 'rejected')}
                        disabled={updating || !rejectionReason.trim()}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        {updating ? 'Updating...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

