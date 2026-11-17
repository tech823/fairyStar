import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Mail, Phone, MapPin } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const LeadsManagement = () => {
  const [leads, setLeads] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "all", type: "all" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, coordRes] = await Promise.all([
        axios.get(`${API}/admin/leads`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/coordinators`, { headers: getAuthHeaders() })
      ]);
      setLeads(leadsRes.data);
      setCoordinators(coordRes.data);
    } catch (err) { console.error("Error fetching leads:", err); }
    finally { setLoading(false); }
  };

  const updateLead = async (leadId, data) => {
    try { await axios.put(`${API}/admin/leads/${leadId}`, data, { headers: getAuthHeaders() }); toast.success("Lead updated"); fetchData(); }
    catch (err) { toast.error("Error updating lead"); }
  };

  const filteredLeads = leads.filter(l => {
    if (filter.status !== "all" && l.status !== filter.status) return false;
    if (filter.type !== "all" && l.lead_type !== filter.type) return false;
    return true;
  });

  const statusColors = { new: "bg-blue-500/20 text-blue-400", contacted: "bg-yellow-500/20 text-yellow-400", qualified: "bg-teal-500/20 text-teal-400", converted: "bg-green-500/20 text-green-400", closed: "bg-gray-500/20 text-gray-400" };

  return (
    <div data-testid="admin-leads">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="font-heading text-3xl font-light text-white">Leads & Inquiries</h1>
        <div className="flex gap-3">
          <Select value={filter.status} onValueChange={v => setFilter(f => ({...f, status: v}))}>
            <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-white"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent className="glass-dropdown"><SelectItem value="all" className="text-white">All Status</SelectItem>{["new","contacted","qualified","converted","closed"].map(s => <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filter.type} onValueChange={v => setFilter(f => ({...f, type: v}))}>
            <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-white"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent className="glass-dropdown"><SelectItem value="all" className="text-white">All Types</SelectItem><SelectItem value="guest" className="text-white">Guest</SelectItem><SelectItem value="corporate" className="text-white">Corporate</SelectItem><SelectItem value="medical" className="text-white">Medical</SelectItem><SelectItem value="property_owner" className="text-white">Property Owner</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F3A15A]" size={32} /></div> : filteredLeads.length === 0 ? <div className="text-center py-20 text-white/60">No leads found</div> : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium text-lg">{lead.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${lead.lead_type === "corporate" ? "bg-blue-500/20 text-blue-400" : lead.lead_type === "medical" ? "bg-teal-500/20 text-teal-400" : lead.lead_type === "property_owner" ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}>{lead.lead_type}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-3">
                    <span className="flex items-center gap-1"><Mail size={14} /> {lead.email}</span>
                    <span className="flex items-center gap-1"><Phone size={14} /> {lead.phone}</span>
                    {lead.city && <span className="flex items-center gap-1"><MapPin size={14} /> {lead.city}</span>}
                  </div>
                  {lead.message && <p className="text-white/40 text-sm bg-white/5 p-3 rounded-lg">{lead.message}</p>}
                  {(lead.check_in || lead.purpose) && (
                    <div className="flex gap-4 mt-3 text-sm text-white/60">
                      {lead.check_in && <span>Dates: {lead.check_in} - {lead.check_out}</span>}
                      {lead.purpose && <span>Purpose: {lead.purpose}</span>}
                      {lead.guests && <span>{lead.guests} guests</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Select value={lead.status} onValueChange={v => updateLead(lead.id, { status: v })}>
                    <SelectTrigger className={`w-[140px] ${statusColors[lead.status]} border-0`}><SelectValue /></SelectTrigger>
                    <SelectContent className="glass-dropdown">{["new","contacted","qualified","converted","closed"].map(s => <SelectItem key={s} value={s} className="text-white capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={lead.coordinator_id || ""} onValueChange={v => updateLead(lead.id, { coordinator_id: v })}>
                    <SelectTrigger className="w-[140px] bg-white/[0.04] border-white/[0.08] text-white text-sm"><SelectValue placeholder="Assign..." /></SelectTrigger>
                    <SelectContent className="glass-dropdown">{coordinators.map(c => <SelectItem key={c} value={c.id} className="text-white">{c.name}</SelectItem>)}</SelectContent>
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
