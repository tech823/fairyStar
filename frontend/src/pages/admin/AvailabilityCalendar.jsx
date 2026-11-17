import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, RefreshCw, CalendarX, ChevronRight } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const AvailabilityCalendar = () => {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [selectedDates, setSelectedDates] = useState({ start: null, end: null });
  const [isSelecting, setIsSelecting] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [blockForm, setBlockForm] = useState({ reason: "blocked", note: "" });
  const [bulkForm, setBulkForm] = useState({ startDate: "", endDate: "", reason: "blocked", note: "", action: "block" });

  const UAE_OFFSET = 4 * 60;
  const getTodayUAE = () => { const now = new Date(); const uaeTime = new Date(now.getTime() + (UAE_OFFSET - now.getTimezoneOffset()) * 60000); return uaeTime.toISOString().split('T')[0]; };
  const todayUAE = getTodayUAE();

  useEffect(() => { fetchProperties(); }, []);
  useEffect(() => { if (selectedProperty) fetchBlocks(); }, [selectedProperty]);

  const fetchProperties = async () => {
    try { const res = await axios.get(`${API}/properties`); setProperties(res.data); if (res.data.length > 0) setSelectedProperty(res.data[0].id); }
    catch (err) { toast.error("Failed to load properties"); } finally { setLoading(false); }
  };

  const fetchBlocks = async () => {
    if (!selectedProperty) return; setBlocksLoading(true);
    try { const res = await axios.get(`${API}/admin/properties/${selectedProperty}/availability`, { headers: getAuthHeaders() }); setBlocks(res.data); }
    catch (err) { toast.error("Failed to load availability"); } finally { setBlocksLoading(false); }
  };

  const navigateMonth = (d) => { const n = new Date(currentDate); n.setMonth(n.getMonth() + d); setCurrentDate(n); };
  const navigateWeek = (d) => { const n = new Date(currentDate); n.setDate(n.getDate() + (d * 7)); setCurrentDate(n); };

  const getMonthDays = () => {
    const y = currentDate.getFullYear(), m = currentDate.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const days = [];
    for (let i = first.getDay() - 1; i >= 0; i--) days.push({ date: new Date(y, m, -i), isCurrentMonth: false });
    for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(y, m, d), isCurrentMonth: true });
    const rem = 42 - days.length;
    for (let i = 1; i <= rem; i++) days.push({ date: new Date(y, m + 1, i), isCurrentMonth: false });
    return days;
  };

  const getWeekDays = () => {
    const days = [], s = new Date(currentDate); s.setDate(s.getDate() - s.getDay());
    for (let i = 0; i < 7; i++) { const d = new Date(s); d.setDate(s.getDate() + i); days.push({ date: d, isCurrentMonth: d.getMonth() === currentDate.getMonth() }); }
    return days;
  };

  const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const getDateStatus = (d) => { const ds = formatDate(d); return blocks.find(b => ds >= b.start_date && ds <= b.end_date); };
  const isInSelection = (d) => { if (!selectedDates.start) return false; const ds = formatDate(d), ss = formatDate(selectedDates.start), es = selectedDates.end ? formatDate(selectedDates.end) : ss; return ds >= Math.min(ss, es) && ds <= Math.max(ss, es); };

  const handleDateClick = (d) => {
    if (formatDate(d) < todayUAE) { toast.warning("Cannot modify past dates"); return; }
    if (!isSelecting) { setSelectedDates({ start: d, end: null }); setIsSelecting(true); }
    else { setSelectedDates(p => ({ ...p, end: d })); setIsSelecting(false); setShowBlockDialog(true); }
  };

  const handleBlockClick = (block, e) => { e.stopPropagation(); if (window.confirm(`Unblock dates ${block.start_date} to ${block.end_date}?`)) deleteBlock(block.id); };

  const createBlock = async () => {
    if (!selectedDates.start) return;
    if (!blockForm.note?.trim()) { toast.error("Note is required"); return; }
    const ss = formatDate(selectedDates.start), es = selectedDates.end ? formatDate(selectedDates.end) : ss;
    try {
      await axios.post(`${API}/admin/properties/${selectedProperty}/availability/blocks`, { start_date: ss < es ? ss : es, end_date: ss < es ? es : ss, reason: blockForm.reason, note: blockForm.note }, { headers: getAuthHeaders() });
      toast.success("Dates blocked successfully"); setShowBlockDialog(false); setSelectedDates({ start: null, end: null }); setBlockForm({ reason: "blocked", note: "" }); fetchBlocks();
    } catch (err) { toast.error("Failed to block dates"); }
  };

  const deleteBlock = async (blockId) => {
    try { await axios.delete(`${API}/admin/properties/${selectedProperty}/availability/blocks/${blockId}`, { headers: getAuthHeaders() }); toast.success("Block removed"); fetchBlocks(); }
    catch (err) { toast.error("Failed to remove block"); }
  };

  const handleBulkAction = async () => {
    if (!bulkForm.startDate || !bulkForm.endDate) { toast.error("Please select start and end dates"); return; }
    if (bulkForm.action === "block" && !bulkForm.note?.trim()) { toast.error("Note is required for blocking"); return; }
    try {
      if (bulkForm.action === "block") {
        await axios.post(`${API}/admin/properties/${selectedProperty}/availability/blocks`, { start_date: bulkForm.startDate, end_date: bulkForm.endDate, reason: bulkForm.reason, note: bulkForm.note }, { headers: getAuthHeaders() });
        toast.success("Dates blocked successfully");
      } else {
        const overlapping = blocks.filter(b => b.start_date <= bulkForm.endDate && b.end_date >= bulkForm.startDate);
        for (const block of overlapping) await axios.delete(`${API}/admin/properties/${selectedProperty}/availability/blocks/${block.id}`, { headers: getAuthHeaders() });
        toast.success(`${overlapping.length} block(s) removed`);
      }
      setShowBulkDialog(false); setBulkForm({ startDate: "", endDate: "", reason: "blocked", note: "", action: "block" }); fetchBlocks();
    } catch (err) { toast.error("Failed to process bulk action"); }
  };

  const getStatusColor = (r) => ({ blocked: "bg-red-500/30 border-red-500/50 text-red-300", maintenance: "bg-yellow-500/30 border-yellow-500/50 text-yellow-300", owner_stay: "bg-blue-500/30 border-blue-500/50 text-blue-300", booking: "bg-green-500/30 border-green-500/50 text-green-300" }[r] || "bg-gray-500/30 border-gray-500/50 text-gray-300");
  const reasonLabels = { blocked: "Blocked", maintenance: "Maintenance", owner_stay: "Owner Stay", booking: "Booking" };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F3A15A]" size={32} /></div>;

  return (
    <div data-testid="availability-calendar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-light text-white">Availability Calendar</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowBulkDialog(true)} className="btn-glass text-white text-sm"><CalendarX className="mr-2" size={16} /> Bulk Actions</Button>
          <Button onClick={fetchBlocks} variant="ghost" className="text-white/60 hover:text-white"><RefreshCw size={18} /></Button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full sm:max-w-xs">
            <label className="text-white/60 text-xs mb-1 block">Select Property</label>
            <Select value={selectedProperty || ""} onValueChange={setSelectedProperty}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white" data-testid="property-selector"><SelectValue placeholder="Select a property" /></SelectTrigger>
              <SelectContent className="glass-dropdown max-h-[300px]">{properties.map(p => <SelectItem key={p.id} value={p.id} className="text-white"><span className="truncate">{p.title} - {p.city}</span></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {[{ c: "bg-green-500/30 border-green-500/50", l: "Available" }, { c: "bg-red-500/30 border-red-500/50", l: "Blocked" }, { c: "bg-yellow-500/30 border-yellow-500/50", l: "Maintenance" }, { c: "bg-blue-500/30 border-blue-500/50", l: "Owner Stay" }].map(i => (
              <div key={i.l} className="flex items-center gap-1.5 text-xs"><div className={`w-3 h-3 rounded ${i.c} border`}></div><span className="text-white/60">{i.l}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => viewMode === "month" ? navigateMonth(-1) : navigateWeek(-1)} className="text-white/60 hover:text-white"><ChevronRight className="rotate-180" size={20} /></Button>
            <h2 className="font-heading text-lg sm:text-xl font-medium text-white min-w-[180px] text-center">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric", ...(viewMode === "week" && { day: "numeric" }) })}</h2>
            <Button variant="ghost" size="sm" onClick={() => viewMode === "month" ? navigateMonth(1) : navigateWeek(1)} className="text-white/60 hover:text-white"><ChevronRight size={20} /></Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-white/60 hover:text-white text-sm">Today</Button>
            <div className="flex bg-white/[0.04] rounded-lg p-1">
              <button onClick={() => setViewMode("month")} className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === "month" ? "bg-[#F3A15A]/20 text-[#F3A15A]" : "text-white/60 hover:text-white"}`}>Month</button>
              <button onClick={() => setViewMode("week")} className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === "week" ? "bg-[#F3A15A]/20 text-[#F3A15A]" : "text-white/60 hover:text-white"}`}>Week</button>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {blocksLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-[#F3A15A]" size={24} /></div> : (
          <>
            <div className="grid grid-cols-7 border-b border-white/[0.06]">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="p-2 sm:p-3 text-center text-white/60 text-xs sm:text-sm font-medium"><span className="hidden sm:inline">{d}</span><span className="sm:hidden">{d.charAt(0)}</span></div>)}</div>
            <div className={`grid grid-cols-7 ${viewMode === "week" ? "min-h-[200px]" : ""}`}>
              {(viewMode === "month" ? getMonthDays() : getWeekDays()).map((dayObj, idx) => {
                const { date, isCurrentMonth } = dayObj;
                const dateStr = formatDate(date), block = getDateStatus(date), isPast = dateStr < todayUAE, isToday = dateStr === todayUAE, inSel = isInSelection(date);
                return (
                  <div key={idx} onClick={() => !isPast && handleDateClick(date)} data-testid={`calendar-day-${dateStr}`}
                    className={`relative p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] border-b border-r border-white/5 ${!isCurrentMonth ? "opacity-40" : ""} ${isPast ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-white/5"} ${isToday ? "ring-2 ring-inset ring-[#F3A15A]/50" : ""} ${inSel ? "bg-[#F3A15A]/20" : ""} ${viewMode === "week" ? "min-h-[150px]" : ""} transition-colors`}>
                    <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? "text-[#F3A15A]" : isCurrentMonth ? "text-white" : "text-white/40"}`}>{date.getDate()}</div>
                    {block && <div onClick={(e) => handleBlockClick(block, e)} className={`absolute inset-x-1 bottom-1 sm:bottom-2 p-1 rounded text-[10px] sm:text-xs truncate border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(block.reason)}`} title={`${reasonLabels[block.reason]}: ${block.note || "No note"}\nClick to unblock`}><span className="hidden sm:inline">{block.note || reasonLabels[block.reason]}</span><span className="sm:hidden">{block.reason.charAt(0).toUpperCase()}</span></div>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {isSelecting && selectedDates.start && (
        <div className="mt-4 p-4 glass-card rounded-xl">
          <p className="text-white text-sm"><span className="text-[#F3A15A] font-medium">Selecting dates:</span> Started at {formatDate(selectedDates.start)}. Click another date to complete the range.</p>
          <Button variant="ghost" size="sm" onClick={() => { setIsSelecting(false); setSelectedDates({ start: null, end: null }); }} className="mt-2 text-white/60 hover:text-white">Cancel Selection</Button>
        </div>
      )}

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="glass-modal border-white/[0.06] max-w-md">
          <DialogHeader><DialogTitle className="text-white font-heading">Block Dates</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-white/5 rounded-lg"><p className="text-white/60 text-sm"><span className="text-white font-medium">Selected Range:</span><br />{selectedDates.start && formatDate(selectedDates.start)}{selectedDates.end && selectedDates.end !== selectedDates.start && ` to ${formatDate(selectedDates.end)}`}</p></div>
            <div><label className="text-white/60 text-sm mb-2 block">Reason *</label><Select value={blockForm.reason} onValueChange={(v) => setBlockForm(f => ({...f, reason: v}))}><SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white"><SelectValue /></SelectTrigger><SelectContent className="glass-dropdown"><SelectItem value="blocked" className="text-white">Blocked</SelectItem><SelectItem value="maintenance" className="text-white">Maintenance</SelectItem><SelectItem value="owner_stay" className="text-white">Owner Stay</SelectItem></SelectContent></Select></div>
            <div><label className="text-white/60 text-sm mb-2 block">Note * <span className="text-white/40">(required)</span></label><Textarea value={blockForm.note} onChange={(e) => setBlockForm(f => ({...f, note: e.target.value}))} placeholder="e.g., Plumbing repairs..." className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40" /></div>
            <div className="flex gap-3 pt-2"><Button variant="ghost" onClick={() => { setShowBlockDialog(false); setSelectedDates({ start: null, end: null }); }} className="flex-1 text-white/60">Cancel</Button><Button onClick={createBlock} className="flex-1 bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A]">Block Dates</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="glass-modal border-white/[0.06] max-w-md">
          <DialogHeader><DialogTitle className="text-white font-heading">Bulk Date Actions</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2 p-1 bg-white/[0.04] rounded-lg">
              <button onClick={() => setBulkForm(f => ({...f, action: "block"}))} className={`flex-1 py-2 rounded text-sm transition-colors ${bulkForm.action === "block" ? "bg-red-500/20 text-red-300" : "text-white/60"}`}>Block Range</button>
              <button onClick={() => setBulkForm(f => ({...f, action: "unblock"}))} className={`flex-1 py-2 rounded text-sm transition-colors ${bulkForm.action === "unblock" ? "bg-green-500/20 text-green-300" : "text-white/60"}`}>Unblock Range</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-white/60 text-sm mb-2 block">Start Date *</label><Input type="date" value={bulkForm.startDate} min={todayUAE} onChange={(e) => setBulkForm(f => ({...f, startDate: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white" /></div>
              <div><label className="text-white/60 text-sm mb-2 block">End Date *</label><Input type="date" value={bulkForm.endDate} min={bulkForm.startDate || todayUAE} onChange={(e) => setBulkForm(f => ({...f, endDate: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white" /></div>
            </div>
            {bulkForm.action === "block" && (<><div><label className="text-white/60 text-sm mb-2 block">Reason</label><Select value={bulkForm.reason} onValueChange={(v) => setBulkForm(f => ({...f, reason: v}))}><SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white"><SelectValue /></SelectTrigger><SelectContent className="glass-dropdown"><SelectItem value="blocked" className="text-white">Blocked</SelectItem><SelectItem value="maintenance" className="text-white">Maintenance</SelectItem><SelectItem value="owner_stay" className="text-white">Owner Stay</SelectItem></SelectContent></Select></div><div><label className="text-white/60 text-sm mb-2 block">Note * <span className="text-white/40">(required)</span></label><Textarea value={bulkForm.note} onChange={(e) => setBulkForm(f => ({...f, note: e.target.value}))} placeholder="Reason for blocking..." className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/40" /></div></>)}
            {bulkForm.action === "unblock" && <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"><p className="text-yellow-300 text-sm">This will remove all blocks that overlap with the selected date range.</p></div>}
            <div className="flex gap-3 pt-2"><Button variant="ghost" onClick={() => setShowBulkDialog(false)} className="flex-1 text-white/60">Cancel</Button><Button onClick={handleBulkAction} className={`flex-1 ${bulkForm.action === "block" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"} text-white`}>{bulkForm.action === "block" ? "Block Range" : "Unblock Range"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-6 p-4 glass-card rounded-xl">
        <h3 className="text-white font-medium text-sm mb-2">How to use:</h3>
        <ul className="text-white/60 text-xs sm:text-sm space-y-1">
          <li>• <span className="text-white">Click a date</span> to start selecting, then click another date to complete the range</li>
          <li>• <span className="text-white">Click on a blocked date</span> to unblock it</li>
          <li>• Use <span className="text-white">Bulk Actions</span> for blocking/unblocking large date ranges</li>
          <li>• Past dates cannot be modified</li>
        </ul>
      </div>
    </div>
  );
};
