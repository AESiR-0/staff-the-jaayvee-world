"use client";
import { useState } from "react";
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
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStaffSession } from "@/lib/auth-utils";
import { canAccess, routeToTabKey } from "@/lib/rbac";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "QR Tools", href: "/qr", icon: QrCode },
  { name: "Referrals", href: "/referrals", icon: Users },
  { name: "Downline", href: "/downline", icon: Users },
  // { name: "Events", href: "/events", icon: Calendar },
  { name: "Manage Events", href: "/events/manage", icon: Calendar },
  { name: "Event Share Messages", href: "/events/share-messages", icon: MessageSquare },
  { name: "Coupons", href: "/coupons", icon: Ticket },
  { name: "Create User", href: "/sellers/create", icon: Users },
  { name: "Updates", href: "/updates/create", icon: Bell },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const email = typeof window !== 'undefined' ? getStaffSession()?.email : undefined;

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
        `}
      >
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">TJ</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-primary-fg">The Jaayvee World</h1>
              <p className="text-sm text-primary-muted">Team Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigation
              .filter((item) => {
                // Special handling for Updates - show to authorized users
                if (item.href === "/updates/create") {
                  const allowedEmails = [
                    "sm2.thejaayveeworld@gmail.com",
                    "sm13.thejaayveeworld@gmail.com",
                    "md.thejaayveeworld@gmail.com",
                    "v1sales.thejaayveeworld@gmail.com"
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
                return canAccess(routeToTabKey[item.href as keyof typeof routeToTabKey], email);
              })
              .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href === "/updates/create" && pathname.startsWith("/updates")) ||
                (item.href === "/events/manage" && pathname.startsWith("/events/manage")) ||
                (item.href === "/events/share-messages" && pathname.startsWith("/events/share-messages")) ||
                (item.href === "/downline" && pathname.startsWith("/downline"));
              
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
          </nav>

          {/* Logout button */}
          <div className="absolute bottom-6 left-6 right-6">
            <button 
              onClick={handleLogout}
              className="sidebar-item w-full text-left hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
