import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Eye, Trash2, Loader2, Edit } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const PropertiesManagement = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ city: "all", status: "all" });
  const navigate = useNavigate();

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    try { const res = await axios.get(`${API}/properties`); setProperties(res.data); }
    catch (err) { console.error("Error fetching properties:", err); }
    finally { setLoading(false); }
  };

  const deleteProperty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try { await axios.delete(`${API}/admin/properties/${id}`, { headers: getAuthHeaders() }); toast.success("Property deleted"); fetchProperties(); }
    catch (err) { toast.error("Error deleting property"); }
  };

  const filteredProperties = properties.filter(p => {
    if (filter.city !== "all" && p.city !== filter.city) return false;
    if (filter.status !== "all" && p.status !== filter.status) return false;
    return true;
  });
  const cities = [...new Set(properties.map(p => p.city))];

  return (
    <div data-testid="admin-properties">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-light text-white">Properties</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <Select value={filter.city} onValueChange={(v) => setFilter(f => ({...f, city: v}))}>
            <SelectTrigger className="w-[120px] sm:w-[140px] bg-white/[0.04] border-white/[0.08] text-white text-sm"><SelectValue placeholder="All Cities" /></SelectTrigger>
            <SelectContent className="glass-dropdown">
              <SelectItem value="all" className="text-white">All Cities</SelectItem>
              {cities.map(city => (<SelectItem key={city} value={city} className="text-white">{city}</SelectItem>))}
            </SelectContent>
          </Select>
          <Link to="/admin/properties/new" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] text-sm hover:shadow-[0_0_30px_rgba(243,161,90,0.2)]">
              <Plus className="mr-1.5 sm:mr-2 shrink-0" size={16} /> <span className="truncate">Add Property</span>
            </Button>
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20"><Loader2 className="animate-spin text-[#F3A15A]" size={28} /></div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr className="border-b border-white/[0.06]">
                <th className="text-left p-3 sm:p-4 text-white/60 font-medium text-xs sm:text-sm">Property</th>
                <th className="text-left p-3 sm:p-4 text-white/60 font-medium text-xs sm:text-sm">Location</th>
                <th className="text-left p-3 sm:p-4 text-white/60 font-medium text-xs sm:text-sm hidden md:table-cell">Type</th>
                <th className="text-left p-3 sm:p-4 text-white/60 font-medium text-xs sm:text-sm">Price</th>
                <th className="text-left p-3 sm:p-4 text-white/60 font-medium text-xs sm:text-sm">Status</th>
                <th className="text-left p-3 sm:p-4 text-white/60 font-medium text-xs sm:text-sm">Actions</th>
              </tr></thead>
              <tbody>
                {filteredProperties.map((prop) => (
                  <tr key={prop.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 sm:p-4"><div className="flex items-center gap-2 sm:gap-3"><img src={prop.images?.[0]} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover" /><div className="min-w-0"><span className="text-white font-medium block text-sm truncate max-w-[150px]">{prop.title}</span><span className="text-white/40 text-xs">{prop.bedrooms} bed · {prop.bathrooms} bath</span></div></div></td>
                    <td className="p-3 sm:p-4"><span className="text-white text-sm">{prop.city}</span><span className="text-white/40 text-xs block truncate">{prop.area}</span></td>
                    <td className="p-3 sm:p-4 text-white/60 capitalize text-sm hidden md:table-cell">{prop.property_type?.replace("_", " ")}</td>
                    <td className="p-3 sm:p-4 text-[#F3A15A] font-medium text-sm">AED {prop.pricing?.nightly}</td>
                    <td className="p-3 sm:p-4"><span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs ${prop.status === "published" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{prop.status}</span></td>
                    <td className="p-3 sm:p-4"><div className="flex gap-1 sm:gap-2">
                      <Button size="sm" variant="ghost" className="text-white/60 hover:text-white p-1.5 sm:p-2" onClick={() => navigate(`/admin/properties/${prop.id}`)}><Edit size={14} /></Button>
                      <Link to={`/stays/${prop.id}`} target="_blank"><Button size="sm" variant="ghost" className="text-white/60 hover:text-white p-1.5 sm:p-2"><Eye size={14} /></Button></Link>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 p-1.5 sm:p-2" onClick={() => deleteProperty(prop.id)}><Trash2 size={14} /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
