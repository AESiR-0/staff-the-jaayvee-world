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
  AlertCircle
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

  // Fetch sidebar data and check access permissions
  useEffect(() => {
    const loadSidebar = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://thejaayveeworld.com';
        const response = await authenticatedFetch(`${API_BASE_URL}/api/sidebar`);
        const data = await response.json();
        if (data.success) {
          setSidebarData(data.data);
          // Expand all groups by default
          const allGroupIds = new Set<string>(data.data.groups.map((g: SidebarGroup) => g.id));
          setExpandedGroups(allGroupIds);
          
          // Check access for all items and cache results
          const accessibleSet = new Set<string>();
          for (const group of data.data.groups) {
            for (const item of group.items) {
              const hasAccess = await canAccessItem(item);
              if (hasAccess) {
                accessibleSet.add(item.href || item.url || '');
              }
            }
          }
          setAccessibleItems(accessibleSet);
        }
      } catch (err) {
        console.error('Error loading sidebar:', err);
      } finally {
        setLoadingSidebar(false);
      }
    };
    loadSidebar();
  }, [email, permissions, permissionsLoaded]);

  // Fetch RBAC permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const perms = await fetchUserPermissions();
        setPermissions(perms);
        setPermissionsLoaded(true);
      } catch (err) {
        console.error('Error loading permissions:', err);
        setPermissionsLoaded(true); // Still mark as loaded to avoid infinite loading
      } finally {
        setLoadingPermissions(false);
      }
    };
    loadPermissions();
  }, []);

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

  // Check for today's deadlines on mount and periodically
  useEffect(() => {
    const checkTodayDeadlines = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://talaash.thejaayveeworld.com';
        const response = await authenticatedFetch(`${API_BASE_URL}/api/team/tasks/today-deadlines`);
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setTodayDeadlinesCount(result.data.count || 0);
          }
        }
      } catch (error) {
        console.error('Error checking today deadlines:', error);
      }
    };
    
    checkTodayDeadlines();
    // Check every 5 minutes
    const interval = setInterval(checkTodayDeadlines, 5 * 60 * 1000);
    return () => clearInterval(interval);
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
    
    // Logout allowed, proceed
    // Clear authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userSession");
    
    // Redirect to login
    router.push("/login");
  };

  // State to track which items are accessible
  const [accessibleItems, setAccessibleItems] = useState<Set<string>>(new Set());

  // Check if user can access an item (cached version for synchronous use)
  const canAccessItemSync = (item: SidebarItem): boolean => {
    // Use cached accessible items set
    return accessibleItems.has(item.href || item.url || '');
  };

  // Async function to check access (used for initial load)
  const canAccessItem = async (item: SidebarItem): Promise<boolean> => {
    // Super admins have access to everything
    const adminCheck = await isSuperAdmin(email);
    if (adminCheck) {
      return true;
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
              {/* All groups including common (accordion style) */}
              {sidebarData.groups
                .filter(group => group.items.length > 0)
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
                })}
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
            disabled={todayDeadlinesCount > 0}
            className={`sidebar-item w-full text-left ${
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

