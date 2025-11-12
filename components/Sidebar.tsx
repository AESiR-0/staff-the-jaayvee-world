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
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStaffSession } from "@/lib/auth-utils";
import { canAccess, routeToTabKey, canAccessRBAC, fetchUserPermissions, Permission, isSuperAdmin } from "@/lib/rbac";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallet", href: "/wallet", icon: Wallet },
  { name: "QR Tools", href: "/qr", icon: QrCode },
  { name: "Referrals", href: "/referrals", icon: Users },
  { name: "Downline", href: "/downline", icon: GitBranch },
  // { name: "Events", href: "/events", icon: Calendar },
  { name: "Manage Events", href: "/events/manage", icon: Calendar },
  { name: "Event Share Messages", href: "/events/share-messages", icon: MessageSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Event Scenarios", href: "/events/scenarios", icon: TrendingUp },
  { name: "Coupons", href: "/coupons", icon: Ticket },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Gallery", href: "/gallery", icon: ImageIcon },
  { name: "Layouts", href: "/layouts", icon: Layout },
  { name: "Careers", href: "/careers", icon: Briefcase },
  { name: "Create User", href: "/sellers/create", icon: Users },
  { name: "Updates", href: "/updates/create", icon: Bell },
  { name: "WhatsApp Bulk", href: "/whatsapp-bulk", icon: MessageSquare },
  { name: "RBAC", href: "/rbac", icon: Shield },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const email = typeof window !== 'undefined' ? getStaffSession()?.email : undefined;

  // Role switcher configuration
  const roles = [
    {
      name: 'Staff Portal',
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

  // Fetch RBAC permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await fetchUserPermissions();
        setPermissions(perms);
        setPermissionsLoaded(true);
      } catch (err) {
        console.error('Error loading permissions:', err);
        setPermissionsLoaded(true); // Still mark as loaded to avoid infinite loading
      }
    };
    loadPermissions();
  }, []);

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

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userSession");
    
    // Redirect to login
    router.push("/login");
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
          <div className="space-y-2">
            {navigation
              .filter((item) => {
                // Super admins have access to everything
                if (isSuperAdmin(email)) {
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
                  return isSuperAdmin(email);
                }
                // RBAC management - only for thejaayveeworldofficial@gmail.com
                if (item.href === "/rbac") {
                  return email?.toLowerCase() === "thejaayveeworldofficial@gmail.com";
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
              })
              .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href === "/updates/create" && pathname.startsWith("/updates")) ||
                (item.href === "/events/manage" && pathname.startsWith("/events/manage")) ||
                (item.href === "/events/share-messages" && pathname.startsWith("/events/share-messages")) ||
                (item.href === "/events/scenarios" && pathname.startsWith("/events/scenarios")) ||
                (item.href === "/calendar" && pathname.startsWith("/calendar")) ||
                (item.href === "/downline" && pathname.startsWith("/downline")) ||
                (item.href === "/tasks" && pathname.startsWith("/tasks")) ||
                (item.href === "/gallery" && pathname.startsWith("/gallery")) ||
                (item.href === "/layouts" && pathname.startsWith("/layouts")) ||
                (item.href === "/careers" && pathname.startsWith("/careers")) ||
                (item.href === "/whatsapp-bulk" && pathname.startsWith("/whatsapp-bulk"));
              
              return (
                <Link
                  key={item.name}
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
            className="sidebar-item w-full text-left hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
