"use client";

import { Edit2, Trash2 } from "lucide-react";
import { CareerData } from "@/lib/api/careers";

interface CareerCardProps {
  career: CareerData;
  onEdit: (career: CareerData) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export default function CareerCard({ career, onEdit, onDelete, disabled }: CareerCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{career.title}</h3>
            <span className={`px-2 py-1 text-xs rounded ${career.tagColor} text-white`}>
              {career.type}
            </span>
            {!career.isActive && (
              <span className="px-2 py-1 text-xs rounded bg-gray-400 text-white">
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{career.location}</p>
          {career.experience && (
            <p className="text-sm text-gray-500 mb-1">Experience: {career.experience}</p>
          )}
          {career.duration && (
            <p className="text-sm text-gray-500 mb-2">Duration: {career.duration}</p>
          )}
          <p className="text-sm text-gray-700 line-clamp-2">{career.description}</p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(career)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
            disabled={disabled}
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(career.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
            disabled={disabled}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

