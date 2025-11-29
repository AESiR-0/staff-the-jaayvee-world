/**
 * Global Event Categories
 * These are the standard categories available for events.
 * Categories can be extended by users when creating events (Notion-style).
 */

export const EVENT_CATEGORIES = [
  // Arts & Culture
  'Art',
  'Cultural',
  'Music',
  'Theater',
  'Dance',
  'Literature',
  'Photography',
  'Film',
  
  // Business & Professional
  'Business',
  'Networking',
  'Conference',
  'Workshop',
  'Seminar',
  'Training',
  'Career',
  
  // Technology
  'Tech',
  'Startup',
  'Coding',
  'AI/ML',
  'Web3',
  'Blockchain',
  'Gaming',
  
  // Sports & Fitness
  'Sports',
  'Fitness',
  'Yoga',
  'Marathon',
  'Cricket',
  'Football',
  'Basketball',
  
  // Food & Drink
  'Food',
  'Culinary',
  'Wine Tasting',
  'Cooking',
  'Food Festival',
  
  // Education
  'Education',
  'Learning',
  'Workshop',
  'Course',
  'Masterclass',
  
  // Health & Wellness
  'Health',
  'Wellness',
  'Meditation',
  'Mental Health',
  'Fitness',
  
  // Entertainment
  'Entertainment',
  'Comedy',
  'Stand-up',
  'Magic Show',
  'Circus',
  
  // Social & Community
  'Social',
  'Community',
  'Meetup',
  'Festival',
  'Celebration',
  
  // Travel & Adventure
  'Travel',
  'Adventure',
  'Trekking',
  'Camping',
  'Outdoor',
  
  // Fashion & Lifestyle
  'Fashion',
  'Lifestyle',
  'Beauty',
  'Shopping',
  
  // Science & Nature
  'Science',
  'Nature',
  'Wildlife',
  'Astronomy',
  'Environment',
  
  // Spiritual & Religious
  'Spiritual',
  'Religious',
  'Meditation',
  'Yoga',
  
  // Kids & Family
  'Kids',
  'Family',
  'Children',
  'Parenting',
] as const;

/**
 * Get all unique categories (removes duplicates)
 */
export function getEventCategories(): string[] {
  return Array.from(new Set(EVENT_CATEGORIES)).sort();
}

/**
 * Check if a category exists
 */
export function isValidCategory(category: string): boolean {
  return EVENT_CATEGORIES.includes(category as any);
}

/**
 * Get categories by prefix (for search/filtering)
 */
export function getCategoriesByPrefix(prefix: string): string[] {
  const lowerPrefix = prefix.toLowerCase();
  return EVENT_CATEGORIES.filter(cat => 
    cat.toLowerCase().startsWith(lowerPrefix)
  );
}

