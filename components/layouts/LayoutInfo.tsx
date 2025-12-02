"use client";

interface LayoutInfoProps {
  createdAt: string;
  updatedAt: string;
}

export function LayoutInfo({ createdAt, updatedAt }: LayoutInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Active Layout</h3>
      <div className="space-y-2 text-sm text-gray-600">
        <p>
          <span className="font-medium">Created:</span> {new Date(createdAt).toLocaleString()}
        </p>
        <p>
          <span className="font-medium">Last Updated:</span> {new Date(updatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

