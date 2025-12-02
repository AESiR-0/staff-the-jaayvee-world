"use client";

import { Layout, Home, Calendar, ChevronRight, LucideIcon } from "lucide-react";

type PageName = 'home' | 'event-detail';
type SectionName = 'hero' | 'events' | 'top-events' | 'about' | 'stats' | 'testimonials' | 'work-with-us' | 'marketing' | 'subscription-cta' | 'tickets';

export interface SectionConfig {
  name: SectionName;
  label: string;
  page: PageName;
  icon: typeof Home;
}

export const SECTIONS: SectionConfig[] = [
  { name: 'hero', label: 'Hero Section', page: 'home', icon: Home },
  { name: 'marketing', label: 'Marketing/CTA Section', page: 'home', icon: Home },
  { name: 'subscription-cta', label: 'Subscription CTA Section', page: 'home', icon: Home },
  // { name: 'tickets', label: 'Tickets Section', page: 'event-detail', icon: Calendar },
];

interface SectionSidebarProps {
  selectedPage: PageName;
  selectedSection: SectionName;
  onSectionSelect: (page: PageName, section: SectionName) => void;
}

export function SectionSidebar({ selectedPage, selectedSection, onSectionSelect }: SectionSidebarProps) {
  const homeSections = SECTIONS.filter(s => s.page === 'home');
  const eventDetailSections = SECTIONS.filter(s => s.page === 'event-detail');

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Layout className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Layout Sections</h2>
        </div>
        
        {/* Page Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              const firstHomeSection = homeSections[0];
              if (firstHomeSection) onSectionSelect('home', firstHomeSection.name);
            }}
            className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
              selectedPage === 'home'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Home
          </button>
        
        </div>
      </div>

      {/* Section List */}
      <div className="p-2">
        {(selectedPage === 'home' ? homeSections : eventDetailSections).map((section) => {
          const Icon = section.icon;
          const isSelected = selectedSection === section.name && selectedPage === section.page;
          return (
            <button
              key={section.name}
              onClick={() => onSectionSelect(section.page, section.name)}
              className={`w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left text-sm font-medium">{section.label}</span>
              {isSelected && <ChevronRight className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

