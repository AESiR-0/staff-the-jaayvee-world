"use client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  QrCode,
  Users,
  LogOut,
  Menu,
  X,
  Calendar,
  Ticket,
  Bell,
  MessageSquare,
  GitBranch,
  Wallet,
  CheckSquare,
  Image as ImageIcon,
  Layout,
  Briefcase,
  Shield,
  ArrowRight,
  UserCircle,
  ChevronDown,
  TrendingUp,
  FileText,
  GraduationCap,
  ChevronUp,
  LucideIcon,
  AlertCircle,
  FolderOpen,
  ClipboardList
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getTeamSession } from "@/lib/auth-utils";
import { authenticatedFetch } from "@/lib/auth-utils";
import { canAccess, routeToTabKey, canAccessRBAC, fetchUserPermissions, Permission, isSuperAdmin } from "@/lib/rbac";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Wallet,
  QrCode,
  Users,
  GitBranch,
  GraduationCap,
  Calendar,
  MessageSquare,
  TrendingUp,
  Ticket,
  CheckSquare,
  FileText,
  Image: ImageIcon,
  Layout,
  Briefcase,
  Bell,
  Shield,
  FolderOpen,
  ClipboardList,
};

interface SidebarItem {
  id: string;
  name: string;
  href: string;
  iconName: string;
  order: number;
  isActive: boolean;
}

interface SidebarGroup {
  id: string;
  name: string;
  displayName: string;
  order: number;
  isActive: boolean;
  items: SidebarItem[];
}

interface SidebarData {
  groups: SidebarGroup[];
  commonItems: SidebarItem[];
  allItems?: SidebarItem[];
  ungroupedItems?: SidebarItem[];
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const email = typeof window !== 'undefined' ? getTeamSession()?.email : undefined;

  // Role switcher configuration
  const roles = [
    {
      name: 'Team Portal',
      url: typeof window !== 'undefined' ? window.location.origin : '',
      icon: Shield,
      current: true
    },
    {
      name: 'Influencer Portal',
      url: 'https://influencer.thejaayveeworld.com',
      icon: UserCircle,
      current: false
    },
    {
      name: 'Affiliate Portal',
      url: 'https://affiliates.thejaayveeworld.com',
      icon: Users,
      current: false
    },
    {
      name: 'Talaash',
      url: 'https://talaash.thejaayveeworld.com',
      icon: ArrowRight,
      current: false
    },
    {
      name: 'Main Site',
      url: 'https://thejaayveeworld.com',
      icon: ArrowRight,
      current: false
    }
  ];

  // Cache admin status to avoid repeated checks
  const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);

  // Check admin status once on mount (with localStorage cache)
  useEffect(() => {
    const checkAdmin = async () => {
      if (!email) return;
      
      // Check localStorage cache first (5 minute TTL)
      const cacheKey = `admin_status_${email}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { status, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          // Use cache if less than 5 minutes old
          if (age < 5 * 60 * 1000) {
            setIsUserAdmin(status);
            return;
          }
        } catch (e) {
          // Invalid cache, continue to fetch
        }
      }
      
      // Fetch fresh admin status
      const adminStatus = await isSuperAdmin(email);
      setIsUserAdmin(adminStatus);
      
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        status: adminStatus,
        timestamp: Date.now()
      }));
    };
    checkAdmin();
  }, [email]);

  // Fetch sidebar data and check access permissions (with localStorage cache)
  useEffect(() => {
    const loadSidebar = async () => {
      try {
        // Check localStorage cache first (5 minute TTL)
        const sidebarCacheKey = 'sidebar_data';
        const accessibleCacheKey = `accessible_items_${email}`;
        
        const cachedSidebar = localStorage.getItem(sidebarCacheKey);
        const cachedAccessible = email ? localStorage.getItem(accessibleCacheKey) : null;
        
        if (cachedSidebar && cachedAccessible && isUserAdmin !== null) {
          try {
            const { data: sidebarData, timestamp } = JSON.parse(cachedSidebar);
            const { items: accessibleItems, adminItems, timestamp: accessibleTimestamp } = JSON.parse(cachedAccessible);
            const sidebarAge = Date.now() - timestamp;
            const accessibleAge = Date.now() - accessibleTimestamp;
            
            // Use cache if less than 5 minutes old
            if (sidebarAge < 5 * 60 * 1000 && accessibleAge < 5 * 60 * 1000) {
              setSidebarData(sidebarData);
              const allGroupIds = new Set<string>(sidebarData.groups.map((g: SidebarGroup) => g.id));
              setExpandedGroups(allGroupIds);
              setAccessibleItems(new Set(accessibleItems));
              setAdminItemsVisible(adminItems || { feedback: false, userActivity: false });
              setLoadingSidebar(false);
              return;
            }
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://thejaayveeworld.com';
        const response = await authenticatedFetch(`${API_BASE_URL}/api/sidebar`);
        const data = await response.json();
        if (data.success) {
          setSidebarData(data.data);
          // Cache sidebar data
          localStorage.setItem(sidebarCacheKey, JSON.stringify({
            data: data.data,
            timestamp: Date.now()
          }));
          
          // Expand all groups by default
          const allGroupIds = new Set<string>(data.data.groups.map((g: SidebarGroup) => g.id));
          setExpandedGroups(allGroupIds);
          
          // If user is admin, they have access to everything - skip individual checks
          if (isUserAdmin === true) {
            const allItems: SidebarItem[] = [];
            data.data.groups.forEach((group: SidebarGroup) => {
              group.items.forEach((item: SidebarItem) => {
                allItems.push(item);
              });
            });
            // Also include ungrouped items for admins
            if (data.data.ungroupedItems) {
              allItems.push(...data.data.ungroupedItems);
            }
            const accessibleSet = new Set<string>(allItems.map(item => item.href || ''));
            accessibleSet.add('/feedback');
            accessibleSet.add('/user-activity');
            accessibleSet.add('/event-templates');
            setAccessibleItems(accessibleSet);
            const adminItemsVisible = { feedback: true, userActivity: true };
            setAdminItemsVisible(adminItemsVisible);
            
            // Cache accessible items
            if (email) {
              localStorage.setItem(accessibleCacheKey, JSON.stringify({
                items: Array.from(accessibleSet),
                adminItems: adminItemsVisible,
                timestamp: Date.now()
              }));
            }
            
            setLoadingSidebar(false);
            return;
          }

          // For non-admins, check access for items (but only if admin status is determined)
          if (isUserAdmin === false) {
            // Get all items from groups
            const itemsFromGroups: SidebarItem[] = [];
            data.data.groups.forEach((group: SidebarGroup) => {
              group.items.forEach((item: SidebarItem) => {
                itemsFromGroups.push(item);
              });
            });

            // Also get ungrouped items (items with permissions but not in groups)
            const ungroupedItems: SidebarItem[] = data.data.ungroupedItems || [];
            const allItems: SidebarItem[] = [...itemsFromGroups, ...ungroupedItems];

            // Check access in parallel batches
            const accessibleSet = new Set<string>();
            const batchSize = 10;
            for (let i = 0; i < allItems.length; i += batchSize) {
              const batch = allItems.slice(i, i + batchSize);
              const accessChecks = await Promise.all(
                batch.map(item => canAccessItem(item))
              );
              batch.forEach((item, index) => {
                if (accessChecks[index]) {
                  accessibleSet.add(item.href || '');
                }
              });
            }
            setAccessibleItems(accessibleSet);
            const adminItemsVisible = { feedback: false, userActivity: false };
            setAdminItemsVisible(adminItemsVisible);
            
            // Cache accessible items
            if (email) {
              localStorage.setItem(accessibleCacheKey, JSON.stringify({
                items: Array.from(accessibleSet),
                adminItems: adminItemsVisible,
                timestamp: Date.now()
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error loading sidebar:', err);
      } finally {
        setLoadingSidebar(false);
      }
    };
    
    // Only load sidebar after admin status is determined
    if (isUserAdmin !== null) {
      loadSidebar();
    }
  }, [email, permissions, permissionsLoaded, isUserAdmin]);

  // Fetch RBAC permissions on mount (with localStorage cache)
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoadingPermissions(true);
        
        // Check localStorage cache first (5 minute TTL)
        if (email) {
          const permissionsCacheKey = `permissions_${email}`;
          const cached = localStorage.getItem(permissionsCacheKey);
          if (cached) {
            try {
              const { permissions: cachedPerms, timestamp } = JSON.parse(cached);
              const age = Date.now() - timestamp;
              // Use cache if less than 5 minutes old
              if (age < 5 * 60 * 1000) {
                setPermissions(cachedPerms);
                setPermissionsLoaded(true);
                setLoadingPermissions(false);
                return;
              }
            } catch (e) {
              // Invalid cache, continue to fetch
            }
          }
        }
        
        const perms = await fetchUserPermissions();
        setPermissions(perms);
        setPermissionsLoaded(true);
        
        // Cache the result
        if (email) {
          const permissionsCacheKey = `permissions_${email}`;
          localStorage.setItem(permissionsCacheKey, JSON.stringify({
            permissions: perms,
            timestamp: Date.now()
          }));
        }
      } catch (err) {
        console.error('Error loading permissions:', err);
        setPermissionsLoaded(true); // Still mark as loaded to avoid infinite loading
      } finally {
        setLoadingPermissions(false);
      }
    };
    loadPermissions();
  }, [email]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Close role switcher when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showRoleSwitcher && !target.closest('.role-switcher-container')) {
        setShowRoleSwitcher(false);
      }
    };

    if (showRoleSwitcher) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoleSwitcher]);

  const [todayDeadlinesCount, setTodayDeadlinesCount] = useState(0);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [isCheckingDeadlines, setIsCheckingDeadlines] = useState(false);

  // Check for today's deadlines on mount and periodically
  useEffect(() => {
    let isMounted = true;
    let checkInProgress = false;
    
    const checkTodayDeadlines = async () => {
      // Prevent multiple simultaneous checks
      if (checkInProgress) return;
      
      try {
        checkInProgress = true;
        setIsCheckingDeadlines(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
        const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/today-deadlines`);
        if (response.ok && isMounted) {
          const result = await response.json();
          if (result.success) {
            const newCount = result.data.count || 0;
            // Only update if count actually changed to prevent unnecessary re-renders
            setTodayDeadlinesCount(prevCount => {
              if (prevCount !== newCount) {
                return newCount;
              }
              return prevCount;
            });
          }
        }
      } catch (error) {
        console.error('Error checking today deadlines:', error);
      } finally {
        if (isMounted) {
          setIsCheckingDeadlines(false);
        }
        checkInProgress = false;
      }
    };
    
    checkTodayDeadlines();
    // Check every 5 minutes
    const interval = setInterval(checkTodayDeadlines, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    // Check for today's deadlines before logout
    const { logoutUser } = await import('@/lib/auth-utils');
    const result = await logoutUser(false);
    
    if (!result.allowed) {
      setShowLogoutWarning(true);
      setTimeout(() => setShowLogoutWarning(false), 3000);
      return;
    }
    
    // Logout allowed - logoutUser will handle the redirect to /login
    // No need to manually redirect as logoutUser already does it
  };

  // State to track which items are accessible
  const [accessibleItems, setAccessibleItems] = useState<Set<string>>(new Set());
  const [adminItemsVisible, setAdminItemsVisible] = useState<{ feedback: boolean; userActivity: boolean }>({ feedback: false, userActivity: false });

  // Check if user can access an item (cached version for synchronous use)
  const canAccessItemSync = (item: SidebarItem): boolean => {
    // Use cached accessible items set
    return accessibleItems.has(item.href || '');
  };

  // Async function to check access (used for initial load)
  const canAccessItem = async (item: SidebarItem): Promise<boolean> => {
    // Use cached admin status if available
    if (isUserAdmin === true) {
      return true;
    }
    if (isUserAdmin === false) {
      // Continue with permission checks below
    } else {
      // Admin status not yet determined, check it
      const adminCheck = await isSuperAdmin(email);
      if (adminCheck) {
        return true;
      }
    }
    
    // Special handling for Updates - show to authorized users
    if (item.href === "/updates/create") {
      const allowedEmails = [
        "sm2.thejaayveeworld@gmail.com",
        "sm13.thejaayveeworld@gmail.com",
        "md.thejaayveeworld@gmail.com",
        "v1sales.thejaayveeworld@gmail.com",
        "thejaayveeworldofficial@gmail.com"
      ];
      return allowedEmails.includes(email?.toLowerCase() || '');
    }
    // Special handling for Events CRUD - only for md and thejaayveeworldofficial
    if (item.href === "/events/manage") {
      const allowedEmails = [
        "md.thejaayveeworld@gmail.com",
        "thejaayveeworldofficial@gmail.com"
      ];
      return allowedEmails.includes(email?.toLowerCase() || '');
    }
    // Special handling for Event Share Messages - same as Events CRUD
    if (item.href === "/events/share-messages") {
      const allowedEmails = [
        "md.thejaayveeworld@gmail.com",
        "thejaayveeworldofficial@gmail.com"
      ];
      return allowedEmails.includes(email?.toLowerCase() || '');
    }
    // Event Scenarios - admin only
    if (item.href === "/events/scenarios") {
      return await isSuperAdmin(email);
    }
    // RBAC management - only for thejaayveeworldofficial@gmail.com
    if (item.href === "/rbac") {
      return email?.toLowerCase() === "thejaayveeworldofficial@gmail.com";
    }
    // Users page - admin only
    if (item.href === "/users") {
      return await isSuperAdmin(email);
    }
    // Students page - admin only
    if (item.href === "/students") {
      return await isSuperAdmin(email);
    }
    // Feedback page - admin only
    if (item.href === "/feedback") {
      if (isUserAdmin) return true;
      if (isUserAdmin === false) return false;
      return await isSuperAdmin(email);
    }
    // User Activity page - admin only
    if (item.href === "/user-activity") {
      if (isUserAdmin) return true;
      if (isUserAdmin === false) return false;
      return await isSuperAdmin(email);
    }
    // Event Templates page - admin only
    if (item.href === "/event-templates") {
      if (isUserAdmin) return true;
      if (isUserAdmin === false) return false;
      return await isSuperAdmin(email);
    }
    // Check RBAC permissions first if loaded
    const tabKey = routeToTabKey[item.href as keyof typeof routeToTabKey];
    if (permissionsLoaded && permissions.length > 0 && tabKey) {
      // Check if user has permission for this tab
      return permissions.some(p => 
        p.resource === tabKey && 
        p.action === 'access' && 
        p.isActive
      );
    }
    
    // Fallback to email-based check
    return canAccess(tabKey, email);
  };

  // Check if an item is active
  const isItemActive = (href: string): boolean => {
    return pathname === href || 
      (href === "/updates/create" && pathname.startsWith("/updates")) ||
      (href === "/events/manage" && pathname.startsWith("/events/manage")) ||
      (href === "/events/share-messages" && pathname.startsWith("/events/share-messages")) ||
      (href === "/events/scenarios" && pathname.startsWith("/events/scenarios")) ||
      (href === "/calendar" && pathname.startsWith("/calendar")) ||
      (href === "/downline" && pathname.startsWith("/downline")) ||
      (href === "/users" && pathname.startsWith("/users")) ||
      (href === "/students" && pathname.startsWith("/students")) ||
      (href === "/feedback" && pathname.startsWith("/feedback")) ||
      (href === "/user-activity" && pathname.startsWith("/user-activity")) ||
      (href === "/event-templates" && pathname.startsWith("/event-templates")) ||
      (href === "/tasks" && pathname.startsWith("/tasks")) ||
      (href === "/gallery" && pathname.startsWith("/gallery")) ||
      (href === "/layouts" && pathname.startsWith("/layouts")) ||
      (href === "/careers" && pathname.startsWith("/careers")) ||
      (href === "/whatsapp-bulk" && pathname.startsWith("/whatsapp-bulk"));
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white border border-primary-border shadow-soft"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-primary-border shadow-soft z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          flex flex-col
        `}
      >
        {/* Logo - Fixed at top */}
        <div className="p-6 pb-4 flex-shrink-0 border-b border-primary-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">TJ</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-primary-fg">The Jaayvee World</h1>
              <p className="text-sm text-primary-muted">Team Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-6 py-4">
          {loadingSidebar || loadingPermissions ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="w-6 h-6 border-2 border-primary-accent border-t-transparent rounded-full animate-spin"></div>
              {loadingSidebar && (
                <p className="text-xs text-primary-muted">Loading navigation...</p>
              )}
              {loadingPermissions && !loadingSidebar && (
                <p className="text-xs text-primary-muted">Loading permissions...</p>
              )}
            </div>
          ) : sidebarData ? (
            <div className="space-y-1">
              {/* Profile Link - Always visible */}
              <div className="mb-2">
                <Link
                  href="/profile"
                  className={`sidebar-item ${isItemActive('/profile') ? "active" : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <UserCircle size={20} />
                  <span className="font-medium">Profile</span>
                </Link>
              </div>

              {/* Requirements Link - Always visible */}
              <div className="mb-2">
                <Link
                  href="/requirements"
                  className={`sidebar-item ${isItemActive('/requirements') ? "active" : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <ClipboardList size={20} />
                  <span className="font-medium">Requirements</span>
                </Link>
              </div>

              {/* Plan of Action Link - Always visible */}
              <div className="mb-2">
                <Link
                  href="/plan-of-action"
                  className={`sidebar-item ${isItemActive('/plan-of-action') ? "active" : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar size={20} />
                  <span className="font-medium">Plan of Action</span>
                </Link>
              </div>

              {/* Notes Link - Always visible */}
              <div className="mb-2">
                <Link
                  href="/notes"
                  className={`sidebar-item ${isItemActive('/notes') ? "active" : ""}`}
                  onClick={() => setIsOpen(false)}
                >
                  <FileText size={20} />
                  <span className="font-medium">Notes</span>
                </Link>
              </div>

              {/* Hardcoded Admin Items */}
              {(() => {
                const adminItems: SidebarItem[] = [];
                // Use cached admin status for faster rendering
                if (isUserAdmin === true || adminItemsVisible.feedback) {
                  adminItems.push({ id: 'feedback-admin', name: 'Feedback', href: '/feedback', iconName: 'MessageSquare', order: 0, isActive: true });
                }
                if (isUserAdmin === true || adminItemsVisible.userActivity) {
                  adminItems.push({ id: 'user-activity-admin', name: 'User Activity', href: '/user-activity', iconName: 'UserCircle', order: 1, isActive: true });
                }
                if (isUserAdmin === true) {
                  adminItems.push({ id: 'event-templates-admin', name: 'Event Templates', href: '/event-templates', iconName: 'FileText', order: 2, isActive: true });
                  adminItems.push({ id: 'paperwork-admin', name: 'Paperwork', href: '/paperwork', iconName: 'FolderOpen', order: 3, isActive: true });
                  adminItems.push({ id: 'requirements-admin', name: 'Requirements (Admin)', href: '/requirements/admin', iconName: 'ClipboardList', order: 4, isActive: true });
                  adminItems.push({ id: 'task-flow-admin', name: 'Task Flow', href: '/admin/task-flow', iconName: 'GitBranch', order: 5, isActive: true });
                  adminItems.push({ id: 'influencer-tasks-admin', name: 'Influencer Tasks', href: '/admin/influencer-tasks', iconName: 'Users', order: 6, isActive: true });
                }
                
                if (adminItems.length > 0) {
                  return (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold text-primary-muted uppercase tracking-wider">
                        Administration
                      </div>
                      <div className="ml-2 mt-1 space-y-1 border-l-2 border-primary-border pl-2">
                        {adminItems.map((item) => {
                          const Icon = iconMap[item.iconName] || FileText;
                          const isActive = isItemActive(item.href);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              className={`sidebar-item ${isActive ? "active" : ""}`}
                              onClick={() => setIsOpen(false)}
                            >
                              <Icon size={20} />
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* All groups including common (accordion style) */}
              {sidebarData.groups && sidebarData.groups.length > 0 && sidebarData.groups.some((g: SidebarGroup) => g.items && g.items.length > 0) ? (
                sidebarData.groups
                  .filter(group => group.items && group.items.length > 0)
                  .map((group) => {
                    const visibleItems = group.items.filter(item => canAccessItemSync(item));
                    if (visibleItems.length === 0) return null;

                    const isExpanded = expandedGroups.has(group.id);

                    return (
                      <div key={group.id} className="mb-2">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-primary-fg hover:bg-primary-bg/50 rounded-lg transition-colors"
                        >
                          <span>{group.displayName.slice(0, 1).toUpperCase() + group.displayName.slice(1).toLowerCase()}</span>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-primary-muted" />
                          ) : (
                            <ChevronDown size={16} className="text-primary-muted" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="ml-2 mt-1 space-y-1 border-l-2 border-primary-border pl-2">
                            {visibleItems.map((item) => {
                              const Icon = iconMap[item.iconName] || FileText;
                              const isActive = isItemActive(item.href);
                              return (
                                <Link
                                  key={item.id}
                                  href={item.href}
                                  className={`sidebar-item ${isActive ? "active" : ""}`}
                                  onClick={() => setIsOpen(false)}
                                >
                                  <Icon size={20} />
                                  <span className="font-medium">{item.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : isUserAdmin === true ? (
                // For admins: Show all items if groups are empty or have no items
                (() => {
                  // Get all items from allItems or ungroupedItems
                  const allAvailableItems: SidebarItem[] = sidebarData.allItems || sidebarData.ungroupedItems || [];
                  const sortedItems = [...allAvailableItems].sort((a, b) => a.order - b.order);
                  
                  if (sortedItems.length === 0) {
                    return (
                      <div className="text-center py-8 text-primary-muted text-sm">
                        <p className="mb-2">No sidebar items found.</p>
                        <p className="text-xs">Please run the seed script:</p>
                        <code className="bg-primary-accent-light px-2 py-1 rounded text-xs mt-1 inline-block">npm run seed:sidebar</code>
                      </div>
                    );
                  }

                  return (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-semibold text-primary-muted uppercase tracking-wider">
                        Navigation
                      </div>
                      <div className="ml-2 mt-1 space-y-1 border-l-2 border-primary-border pl-2">
                        {sortedItems.map((item) => {
                          const Icon = iconMap[item.iconName] || FileText;
                          const isActive = isItemActive(item.href);
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              className={`sidebar-item ${isActive ? "active" : ""}`}
                              onClick={() => setIsOpen(false)}
                            >
                              <Icon size={20} />
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : null}

              {/* Ungrouped items (items with permissions but not in any group) - show for non-admins */}
              {isUserAdmin !== true && (() => {
                const ungroupedItems: SidebarItem[] = sidebarData.ungroupedItems || [];
                const visibleUngroupedItems = ungroupedItems.filter(item => canAccessItemSync(item));
                
                if (visibleUngroupedItems.length === 0) return null;

                return (
                  <div className="mb-2">
                    <div className="px-3 py-2 text-xs font-semibold text-primary-muted uppercase tracking-wider">
                      Other
                    </div>
                    <div className="ml-2 mt-1 space-y-1 border-l-2 border-primary-border pl-2">
                      {visibleUngroupedItems.map((item) => {
                        const Icon = iconMap[item.iconName] || FileText;
                        const isActive = isItemActive(item.href);
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={`sidebar-item ${isActive ? "active" : ""}`}
                            onClick={() => setIsOpen(false)}
                          >
                            <Icon size={20} />
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-primary-muted text-sm">
              Failed to load sidebar
            </div>
          )}
        </nav>

        {/* Role Switcher and Logout - Fixed at bottom */}
        <div className="p-6 pt-4 flex-shrink-0 border-t border-primary-border space-y-2">
          {/* Role Switcher */}
          <div className="relative role-switcher-container">
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="sidebar-item w-full text-left hover:bg-blue-50 hover:text-blue-600"
            >
              <UserCircle size={20} />
              <span className="font-medium flex-1">Switch Role</span>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${showRoleSwitcher ? 'rotate-180' : ''}`}
              />
            </button>
            
            {/* Role Switcher Dropdown */}
            {showRoleSwitcher && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-primary-border rounded-lg shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <a
                      key={role.name}
                      href={role.url}
                      target={role.current ? undefined : "_blank"}
                      rel={role.current ? undefined : "noopener noreferrer"}
                      onClick={(e) => {
                        setShowRoleSwitcher(false);
                        if (role.current) {
                          e.preventDefault();
                        }
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-3 text-sm transition-colors
                        ${role.current 
                          ? 'bg-primary-accent/10 text-primary-accent cursor-default' 
                          : 'hover:bg-gray-50 text-primary-fg cursor-pointer'
                        }
                      `}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{role.name}</span>
                      {role.current && (
                        <span className="ml-auto text-xs text-primary-muted">(Current)</span>
                      )}
                    </a>
                  );
                })}
            </div>
          )}
          </div>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            disabled={todayDeadlinesCount > 0 || isCheckingDeadlines}
            className={`sidebar-item w-full text-left transition-all duration-200 ${
              todayDeadlinesCount > 0 
                ? 'opacity-50 cursor-not-allowed bg-red-50 text-red-600' 
                : 'hover:bg-red-50 hover:text-red-600'
            }`}
            title={todayDeadlinesCount > 0 ? `You have ${todayDeadlinesCount} task${todayDeadlinesCount > 1 ? 's' : ''} with deadline${todayDeadlinesCount > 1 ? 's' : ''} today. Please complete them before logging out.` : 'Sign Out'}
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
            {todayDeadlinesCount > 0 && (
              <span className="ml-2 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                {todayDeadlinesCount}
              </span>
            )}
          </button>
          {showLogoutWarning && todayDeadlinesCount > 0 && (
            <div className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg flex items-center gap-2 mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Complete {todayDeadlinesCount} task{todayDeadlinesCount > 1 ? 's' : ''} with deadline{todayDeadlinesCount > 1 ? 's' : ''} today first</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

