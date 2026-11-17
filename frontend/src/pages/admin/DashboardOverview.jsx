import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building, Calendar, Users, DollarSign, Plus, Loader2, Clock,
  CheckCircle, AlertCircle
} from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, bookingsRes, leadsRes] = await Promise.all([
          axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() }),
          axios.get(`${API}/admin/bookings`, { headers: getAuthHeaders() }),
          axios.get(`${API}/admin/leads`, { headers: getAuthHeaders() })
        ]);
        setStats(statsRes.data);
        setRecentBookings(bookingsRes.data.slice(0, 5));
        setRecentLeads(leadsRes.data.filter(l => l.status === "new").slice(0, 5));
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#F3A15A]" size={32} />
      </div>
    );
  }

  const statCards = [
    { label: "Total Properties", value: stats?.total_properties || 0, icon: Building, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Confirmed Bookings", value: stats?.confirmed_bookings || 0, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Pending Bookings", value: stats?.pending_bookings || 0, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Unassigned", value: stats?.unassigned_bookings || 0, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "New Leads", value: stats?.new_leads || 0, icon: Users, color: "text-teal-400", bg: "bg-teal-500/10" },
    { label: "Upcoming Check-ins", value: stats?.upcoming_checkins || 0, icon: Calendar, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Total Revenue", value: `AED ${stats?.total_revenue?.toLocaleString() || 0}`, icon: DollarSign, color: "text-[#F3A15A]", bg: "bg-[#F3A15A]/10" },
  ];

  return (
    <div data-testid="admin-overview">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-light text-white">Dashboard</h1>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Link to="/admin/properties/new" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] hover:shadow-[0_0_30px_rgba(243,161,90,0.2)] text-sm sm:text-base">
              <Plus className="mr-1.5 sm:mr-2 shrink-0" size={18} /> 
              <span className="truncate">Add Property</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-3 sm:p-5 stat-card">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 rounded-lg ${stat.bg} shrink-0`}>
                <stat.icon className={stat.color} size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-white/50 text-[10px] sm:text-xs truncate">{stat.label}</p>
                <p className="text-white font-heading text-base sm:text-xl font-medium truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card rounded-xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="font-heading text-base sm:text-lg font-medium text-white">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-[#F3A15A] text-sm hover:underline">View All</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-white/40 text-center py-6 sm:py-8 text-sm">No bookings yet</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-white/5 rounded-lg">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-white font-medium text-xs sm:text-sm truncate">{booking.guest_name}</p>
                    <p className="text-white/40 text-[10px] sm:text-xs truncate">{booking.property_title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#F3A15A] font-medium text-xs sm:text-sm">AED {booking.total_amount?.toLocaleString()}</p>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                      booking.booking_status === "confirmed" ? "bg-green-500/20 text-green-400" :
                      booking.booking_status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {booking.booking_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="font-heading text-base sm:text-lg font-medium text-white">New Leads</h2>
            <Link to="/admin/leads" className="text-[#F3A15A] text-sm hover:underline">View All</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-white/40 text-center py-6 sm:py-8 text-sm">No new leads</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-white/5 rounded-lg">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-white font-medium text-xs sm:text-sm truncate">{lead.name}</p>
                    <p className="text-white/40 text-[10px] sm:text-xs truncate">{lead.email}</p>
                  </div>
                  <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                    lead.lead_type === "corporate" ? "bg-blue-500/20 text-blue-400" :
                    lead.lead_type === "medical" ? "bg-teal-500/20 text-teal-400" :
                    "bg-green-500/20 text-green-400"
                  }`}>
                    {lead.lead_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
