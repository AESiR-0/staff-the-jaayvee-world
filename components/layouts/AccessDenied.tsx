"use client";

import { Shield } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">
            You don&apos;t have permission to manage layouts. Admin access required.
          </p>
        </div>
      </div>
    </div>
  );
}

