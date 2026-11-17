import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("services");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, requestsRes] = await Promise.all([
        axios.get(`${API}/services`),
        axios.get(`${API}/admin/service-requests`, { headers: getAuthHeaders() })
      ]);
      setServices(servicesRes.data);
      setRequests(requestsRes.data);
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  const updateRequest = async (id, data) => {
    try { await axios.put(`${API}/admin/service-requests/${id}`, data, { headers: getAuthHeaders() }); toast.success("Updated"); fetchData(); }
    catch (err) { toast.error("Error updating"); }
  };

  const statusColors = { requested: "bg-blue-500/20 text-blue-400", quoted: "bg-yellow-500/20 text-yellow-400", confirmed: "bg-green-500/20 text-green-400", completed: "bg-teal-500/20 text-teal-400", cancelled: "bg-red-500/20 text-red-400" };

  return (
    <div data-testid="admin-services">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-3xl font-light text-white">Services & Add-ons</h1>
        <div className="flex gap-2">
          <Button variant={tab === "services" ? "default" : "ghost"} onClick={() => setTab("services")} className={tab === "services" ? "bg-[#F3A15A] text-[#1A202C]" : "text-white/60"}>Services</Button>
          <Button variant={tab === "requests" ? "default" : "ghost"} onClick={() => setTab("requests")} className={tab === "requests" ? "bg-[#F3A15A] text-[#1A202C]" : "text-white/60"}>Requests ({requests.length})</Button>
        </div>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F3A15A]" size={32} /></div> : tab === "services" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(svc => (
            <div key={svc.id} className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
              <h3 className="text-white font-medium mb-2">{svc.name}</h3>
              <p className="text-white/40 text-sm mb-3">{svc.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm capitalize">{svc.category}</span>
                <span className="text-[#F3A15A] font-medium">AED {svc.price} / {svc.price_type}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.length === 0 ? <p className="text-center py-20 text-white/60">No service requests yet</p> : requests.map(req => (
            <div key={req.id} className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium">{req.service_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[req.status]}`}>{req.status}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{req.guest_name} · {req.guest_email}</p>
                  {req.details && <p className="text-white/40 text-sm">{req.details}</p>}
                </div>
                <Select value={req.status} onValueChange={v => updateRequest(req.id, { status: v })}>
                  <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-dropdown">{["requested","quoted","confirmed","completed","cancelled"].map(s => <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
