import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  UserCheck,
  Briefcase,
  CalendarX,
  ChevronRight,
} from "lucide-react";

// Import child page components
import { DashboardOverview } from "./admin/DashboardOverview";
import { PropertiesManagement } from "./admin/PropertiesManagement";
import { PropertyForm } from "./admin/PropertyForm";
import { BookingsManagement } from "./admin/BookingsManagement";
import { LeadsManagement } from "./admin/LeadsManagement";
import { CoordinatorsManagement } from "./admin/CoordinatorsManagement";
import { ServicesManagement } from "./admin/ServicesManagement";
import { AvailabilityCalendar } from "./admin/AvailabilityCalendar";
import { SettingsPage } from "./admin/SettingsPage";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Building, label: "Properties", path: "/admin/properties" },
  { icon: Calendar, label: "Bookings", path: "/admin/bookings" },
  { icon: CalendarX, label: "Availability", path: "/admin/availability" },
  { icon: Users, label: "Leads", path: "/admin/leads" },
  { icon: UserCheck, label: "Coordinators", path: "/admin/coordinators" },
  { icon: Briefcase, label: "Services", path: "/admin/services" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const userData = localStorage.getItem("admin_user");
    
    if (!token) {
      navigate("/admin/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#333D47]" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-modal transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <img src="https://customer-assets.emergentagent.com/job_dubai-getaway/artifacts/8x335zix_FairyStar%20logo%20white.png" alt="Fairy Star" className="h-6 sm:h-8 w-auto" />
            <span className="font-heading text-base sm:text-lg font-bold text-white">Backoffice</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                  location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path))
                    ? "bg-[#F3A15A]/20 text-[#F3A15A] hover:shadow-[0_0_30px_rgba(243,161,90,0.2)]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 border-t border-white/[0.06]">
          {user && (
            <div className="mb-3 sm:mb-4">
              <p className="text-white font-medium text-sm sm:text-base truncate">{user.name}</p>
              <p className="text-white/40 text-xs sm:text-sm">{user.role || "admin"}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5 text-sm"
          >
            <LogOut className="mr-2 shrink-0" size={18} /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="glass-navbar sticky top-0 z-30 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <Link 
                to="/" 
                className="hidden sm:flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
              >
                <ChevronRight size={16} className="rotate-180" />
                <span className="hidden md:inline">Back to Website</span>
                <span className="md:hidden">Website</span>
              </Link>
              <Link 
                to="/" 
                className="sm:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Back to Website"
              >
                <ChevronRight size={20} className="rotate-180" />
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white p-2">
                <Bell size={20} />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/properties" element={<PropertiesManagement />} />
            <Route path="/properties/new" element={<PropertyForm />} />
            <Route path="/properties/:id" element={<PropertyForm />} />
            <Route path="/bookings" element={<BookingsManagement />} />
            <Route path="/leads" element={<LeadsManagement />} />
            <Route path="/coordinators" element={<CoordinatorsManagement />} />
            <Route path="/services" element={<ServicesManagement />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/availability" element={<AvailabilityCalendar />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
