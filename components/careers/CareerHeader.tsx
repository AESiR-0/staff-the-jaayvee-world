"use client";

import { Briefcase, Plus, Loader2 } from "lucide-react";

interface CareerHeaderProps {
  onAddNew: () => void;
  onSeedData: () => void;
  showSeedButton: boolean;
  seeding: boolean;
  showForm: boolean;
}

export default function CareerHeader({
  onAddNew,
  onSeedData,
  showSeedButton,
  seeding,
  showForm,
}: CareerHeaderProps) {
  return (
    <div className="mb-6 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          Career Positions
        </h1>
        <p className="text-gray-600 mt-2">Manage job positions and career opportunities</p>
      </div>
      {!showForm && (
        <div className="flex gap-3">
          {showSeedButton && (
            <button
              onClick={onSeedData}
              disabled={seeding}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Seed Dummy Data
                </>
              )}
            </button>
          )}
          <button
            onClick={onAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Position
          </button>
        </div>
      )}
    </div>
  );
}

