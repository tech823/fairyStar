import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Mail, Phone, Briefcase } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const CoordinatorsManagement = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCoord, setNewCoord] = useState({ name: "", email: "", phone: "" });

  useEffect(() => { fetchCoordinators(); }, []);

  const fetchCoordinators = async () => {
    try { const res = await axios.get(`${API}/admin/coordinators`, { headers: getAuthHeaders() }); setCoordinators(res.data); }
    catch (err) { console.error("Error fetching coordinators:", err); }
    finally { setLoading(false); }
  };

  const createCoordinator = async () => {
    try { await axios.post(`${API}/admin/coordinators`, newCoord, { headers: getAuthHeaders() }); toast.success("Coordinator created"); setShowForm(false); setNewCoord({ name: "", email: "", phone: "" }); fetchCoordinators(); }
    catch (err) { toast.error("Error creating coordinator"); }
  };

  const deleteCoordinator = async (id) => {
    if (!window.confirm("Delete this coordinator?")) return;
    try { await axios.delete(`${API}/admin/coordinators/${id}`, { headers: getAuthHeaders() }); toast.success("Coordinator deleted"); fetchCoordinators(); }
    catch (err) { toast.error("Error deleting coordinator"); }
  };

  return (
    <div data-testid="admin-coordinators">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-3xl font-light text-white">Coordinators</h1>
        <Button className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A]" onClick={() => setShowForm(true)}><Plus className="mr-2" size={18} /> Add Coordinator</Button>
      </div>
      {showForm && (
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6 mb-6">
          <h2 className="text-white font-medium mb-4">New Coordinator</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input placeholder="Name" value={newCoord.name} onChange={e => setNewCoord(c => ({...c, name: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white" />
            <Input placeholder="Email" value={newCoord.email} onChange={e => setNewCoord(c => ({...c, email: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white" />
            <Input placeholder="Phone" value={newCoord.phone} onChange={e => setNewCoord(c => ({...c, phone: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white" />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={createCoordinator} className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A]">Save</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-white/60">Cancel</Button>
          </div>
        </div>
      )}
      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F3A15A]" size={32} /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coordinators.map(coord => (
            <div key={coord.id} className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-medium">{coord.name}</h3>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => deleteCoordinator(coord.id)}><Trash2 size={16} /></Button>
              </div>
              <div className="space-y-2 text-sm text-white/60">
                <p className="flex items-center gap-2"><Mail size={14} /> {coord.email}</p>
                <p className="flex items-center gap-2"><Phone size={14} /> {coord.phone}</p>
                <p className="flex items-center gap-2"><Briefcase size={14} /> {coord.assigned_bookings || 0} bookings</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
