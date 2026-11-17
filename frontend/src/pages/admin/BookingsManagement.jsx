import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Users, Loader2, RefreshCw, Mail, Phone } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "all", payment: "all" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, coordRes] = await Promise.all([
        axios.get(`${API}/admin/bookings`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/coordinators`, { headers: getAuthHeaders() })
      ]);
      setBookings(bookingsRes.data);
      setCoordinators(coordRes.data);
    } catch (err) { console.error("Error fetching bookings:", err); }
    finally { setLoading(false); }
  };

  const assignCoordinator = async (bookingId, coordinatorId) => {
    try { await axios.put(`${API}/admin/bookings/${bookingId}/assign-coordinator?coordinator_id=${coordinatorId}`, null, { headers: getAuthHeaders() }); toast.success("Coordinator assigned"); fetchData(); }
    catch (err) { toast.error("Error assigning coordinator"); }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try { await axios.put(`${API}/admin/bookings/${bookingId}`, { booking_status: status }, { headers: getAuthHeaders() }); toast.success("Status updated"); fetchData(); }
    catch (err) { toast.error("Error updating status"); }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter.status !== "all" && b.booking_status !== filter.status) return false;
    if (filter.payment !== "all" && b.payment_status !== filter.payment) return false;
    return true;
  });

  return (
    <div data-testid="admin-bookings">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="font-heading text-3xl font-light text-white">Bookings</h1>
        <div className="flex gap-3">
          <Select value={filter.status} onValueChange={v => setFilter(f => ({...f, status: v}))}>
            <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-white"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent className="glass-dropdown"><SelectItem value="all" className="text-white">All Status</SelectItem><SelectItem value="pending" className="text-white">Pending</SelectItem><SelectItem value="confirmed" className="text-white">Confirmed</SelectItem><SelectItem value="cancelled" className="text-white">Cancelled</SelectItem></SelectContent>
          </Select>
          <Select value={filter.payment} onValueChange={v => setFilter(f => ({...f, payment: v}))}>
            <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-white"><SelectValue placeholder="Payment" /></SelectTrigger>
            <SelectContent className="glass-dropdown"><SelectItem value="all" className="text-white">All Payment</SelectItem><SelectItem value="pending" className="text-white">Unpaid</SelectItem><SelectItem value="paid" className="text-white">Paid</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={fetchData}><RefreshCw className="mr-2" size={18} /> Refresh</Button>
        </div>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F3A15A]" size={32} /></div> : filteredBookings.length === 0 ? <div className="text-center py-20 text-white/60">No bookings found</div> : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-white font-medium text-lg">{booking.guest_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${booking.booking_status === "confirmed" ? "bg-green-500/20 text-green-400" : booking.booking_status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{booking.booking_status}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${booking.payment_status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{booking.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{booking.property_title}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-white/60">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {booking.check_in} → {booking.check_out}</span>
                    <span className="flex items-center gap-1"><Users size={14} /> {booking.guests} guests</span>
                    <span className="flex items-center gap-1"><Mail size={14} /> {booking.guest_email}</span>
                    <span className="flex items-center gap-1"><Phone size={14} /> {booking.guest_phone}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[#F3A15A] font-heading text-2xl font-medium">AED {booking.total_amount?.toLocaleString()}</p>
                  <p className="text-white/40 text-sm">{booking.nights} nights · {booking.payment_type === "deposit" ? "30% deposit" : "Full payment"}</p>
                  {booking.stripe_session_id && <p className="text-white/30 text-xs">Stripe: {booking.stripe_session_id.slice(0, 20)}...</p>}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">Coordinator:</span>
                  <Select value={booking.coordinator_id || ""} onValueChange={v => assignCoordinator(booking.id, v)}>
                    <SelectTrigger className="w-[180px] bg-white/[0.04] border-white/[0.08] text-white text-sm"><SelectValue placeholder="Assign..." /></SelectTrigger>
                    <SelectContent className="glass-dropdown">{coordinators.map(c => <SelectItem key={c.id} value={c.id} className="text-white">{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">Status:</span>
                  <Select value={booking.booking_status} onValueChange={v => updateBookingStatus(booking.id, v)}>
                    <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-white text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-dropdown"><SelectItem value="pending" className="text-white">Pending</SelectItem><SelectItem value="confirmed" className="text-white">Confirmed</SelectItem><SelectItem value="cancelled" className="text-white">Cancelled</SelectItem><SelectItem value="completed" className="text-white">Completed</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
