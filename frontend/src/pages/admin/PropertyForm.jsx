import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Image, Upload, X, Video, Link as LinkIcon, Trash2, Star } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";
import PropertyMediaManager from "@/components/PropertyMediaManager";

// Inline media uploader for create mode
const InlineMediaUploader = ({ queuedFiles, setQueuedFiles, videoLinks, setVideoLinks }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [videoValue, setVideoValue] = useState("");
  const inputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(f => 
      f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (validFiles.length === 0) {
      toast.error("Only image and video files are accepted");
      return;
    }
    const newEntries = validFiles.map(f => ({
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      type: f.type.startsWith("video/") ? "video" : "image",
      name: f.name,
      isCover: false,
    }));
    setQueuedFiles(prev => [...prev, ...newEntries]);
  }, [setQueuedFiles]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (index) => {
    setQueuedFiles(prev => {
      const copy = [...prev];
      if (copy[index].preview) URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  };

  const setCover = (index) => {
    setQueuedFiles(prev => prev.map((f, i) => ({ ...f, isCover: i === index })));
  };

  const addUrl = () => {
    if (!urlValue.trim()) return;
    setQueuedFiles(prev => [...prev, {
      file: null,
      url: urlValue.trim(),
      preview: urlValue.trim(),
      type: "image",
      name: urlValue.trim().split("/").pop(),
      isCover: prev.length === 0,
    }]);
    setUrlValue("");
    setShowUrlInput(false);
  };

  const addVideo = () => {
    if (!videoValue.trim()) return;
    setVideoLinks(prev => [...prev, videoValue.trim()]);
    setVideoValue("");
    setShowVideoInput(false);
  };

  const removeVideo = (index) => {
    setVideoLinks(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6" data-testid="media-upload-section">
      <h2 className="font-heading text-xl font-medium text-white mb-4">Photos & Videos</h2>
      
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver ? "border-[#F3A15A] bg-[#F3A15A]/10" : "border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]"
        }`}
        data-testid="media-drop-zone"
      >
        <Upload className="mx-auto mb-3 text-white/30" size={32} />
        <p className="text-white/60 text-sm mb-1">Drag & drop photos or videos here</p>
        <p className="text-white/30 text-xs">or click to browse files</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowUrlInput(!showUrlInput)} className="text-white/50 hover:text-white text-xs">
          <LinkIcon size={14} className="mr-1.5" /> Add Image URL
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowVideoInput(!showVideoInput)} className="text-white/50 hover:text-white text-xs">
          <Video size={14} className="mr-1.5" /> Add Video Link
        </Button>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="https://example.com/photo.jpg"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
            className="bg-white/[0.04] border-white/[0.08] text-white flex-1 text-sm"
            data-testid="media-url-input"
          />
          <Button type="button" onClick={addUrl} className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] text-sm">Add</Button>
          <Button type="button" variant="ghost" onClick={() => setShowUrlInput(false)} className="text-white/40"><X size={16} /></Button>
        </div>
      )}

      {/* Video link input */}
      {showVideoInput && (
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            value={videoValue}
            onChange={(e) => setVideoValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVideo())}
            className="bg-white/[0.04] border-white/[0.08] text-white flex-1 text-sm"
            data-testid="video-url-input"
          />
          <Button type="button" onClick={addVideo} className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] text-sm">Add</Button>
          <Button type="button" variant="ghost" onClick={() => setShowVideoInput(false)} className="text-white/40"><X size={16} /></Button>
        </div>
      )}

      {/* Preview grid */}
      {(queuedFiles.length > 0 || videoLinks.length > 0) && (
        <div className="mt-4">
          <p className="text-white/40 text-xs mb-2 uppercase tracking-wider">{queuedFiles.length} photo(s) · {videoLinks.length} video link(s)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {queuedFiles.map((item, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.04]" data-testid={`queued-media-${i}`}>
                {item.preview ? (
                  <img src={item.preview} alt={item.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 flex items-center justify-center bg-white/[0.02]">
                    <Video className="text-white/20" size={28} />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => setCover(i)} className={`p-1.5 rounded-full ${item.isCover ? "bg-[#F3A15A] text-[#1A202C]" : "bg-white/20 text-white hover:bg-white/30"}`} title="Set as cover">
                    <Star size={14} />
                  </button>
                  <button type="button" onClick={() => removeFile(i)} className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
                {item.isCover && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#F3A15A] text-[#1A202C] text-[10px] font-bold rounded">COVER</span>
                )}
                <p className="px-2 py-1 text-[10px] text-white/40 truncate">{item.name}</p>
              </div>
            ))}
            {videoLinks.map((link, i) => (
              <div key={`v-${i}`} className="relative group rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.04]" data-testid={`queued-video-${i}`}>
                <div className="w-full h-28 flex flex-col items-center justify-center bg-white/[0.02] px-2">
                  <Video className="text-[#F3A15A]/60 mb-1" size={24} />
                  <p className="text-white/40 text-[10px] text-center truncate w-full">{link}</p>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => removeVideo(i)} className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const PropertyForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.includes("/properties/") && !location.pathname.includes("/new");
  const propertyId = isEdit ? location.pathname.split("/properties/")[1] : null;
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [queuedFiles, setQueuedFiles] = useState([]);
  const [videoLinks, setVideoLinks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    full_description: "",
    property_type: "holiday_home",
    city: "Dubai",
    area: "",
    address: "",
    map_lat: null,
    map_lng: null,
    bedrooms: 1,
    beds: 1,
    bed_type: "king",
    bathrooms: 1,
    max_guests: 2,
    amenities: [],
    house_rules: "",
    check_in_time: "15:00",
    check_out_time: "11:00",
    badges: [],
    is_featured: false,
    suitable_for: [],
    status: "published",
    pricing: {
      nightly: 200,
      monthly: 4000,
      cleaning_fee: 50,
      service_fee_percent: 10,
      taxes_percent: 5,
      security_deposit: 0,
      weekly_discount: 0,
      monthly_discount: 0,
      minimum_nights: 1,
      maximum_nights: 365
    }
  });

  useEffect(() => {
    if (isEdit && propertyId) {
      fetchProperty();
    }
  }, [isEdit, propertyId]);

  const fetchProperty = async () => {
    try {
      const res = await axios.get(`${API}/properties/${propertyId}`);
      setForm(res.data);
    } catch (err) {
      toast.error("Property not found");
      navigate("/admin/properties");
    } finally {
      setLoading(false);
    }
  };

  const uploadMedia = async (propId) => {
    let uploaded = 0;
    const total = queuedFiles.length + videoLinks.length;

    // Upload files
    for (const item of queuedFiles) {
      try {
        const formData = new FormData();
        if (item.file) {
          formData.append("file", item.file);
        } else if (item.url) {
          formData.append("url", item.url);
        }
        formData.append("type", item.type);
        formData.append("is_cover", item.isCover ? "true" : "false");
        
        await axios.post(`${API}/admin/properties/${propId}/media`, formData, {
          headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
        });
        uploaded++;
      } catch (err) {
        console.error("Media upload error:", err);
      }
    }

    // Upload video links
    for (const link of videoLinks) {
      try {
        const formData = new FormData();
        formData.append("type", "video");
        formData.append("video_link", link);
        
        await axios.post(`${API}/admin/properties/${propId}/media`, formData, {
          headers: { ...getAuthHeaders(), "Content-Type": "multipart/form-data" },
        });
        uploaded++;
      } catch (err) {
        console.error("Video link upload error:", err);
      }
    }

    if (uploaded > 0) {
      toast.success(`${uploaded}/${total} media items uploaded`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/admin/properties/${propertyId}`, form, { headers: getAuthHeaders() });
        // Upload any new queued media
        if (queuedFiles.length > 0 || videoLinks.length > 0) {
          await uploadMedia(propertyId);
        }
        toast.success("Property updated");
      } else {
        const res = await axios.post(`${API}/admin/properties`, form, { headers: getAuthHeaders() });
        const newId = res.data?.id;
        // Upload queued media to the newly created property
        if (newId && (queuedFiles.length > 0 || videoLinks.length > 0)) {
          toast.info("Uploading media...");
          await uploadMedia(newId);
        }
        toast.success("Property created");
      }
      navigate("/admin/properties");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error saving property");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setForm(f => ({...f, [field]: value}));
  };

  const updatePricing = (field, value) => {
    setForm(f => ({...f, pricing: {...f.pricing, [field]: parseFloat(value) || 0}}));
  };

  const toggleArrayItem = (field, item) => {
    setForm(f => ({
      ...f,
      [field]: f[field]?.includes(item) 
        ? f[field].filter(x => x !== item)
        : [...(f[field] || []), item]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#F3A15A]" size={32} />
      </div>
    );
  }

  const amenityOptions = ["WiFi", "Pool", "Gym", "Parking", "Kitchen", "Washer", "Dryer", "Air Conditioning", "Heating", "TV", "Sea View", "City View", "Balcony", "Terrace", "Garden", "BBQ", "Beach Access", "Private Pool", "Concierge", "Room Service", "Business Center", "Maid Service", "Wheelchair Accessible"];
  const badgeOptions = ["Verified", "Managed", "Premium", "Family-friendly", "Business Hub", "Beach Access", "Nature Retreat", "Recovery-friendly", "Medical Travel", "Long Stay", "Budget-friendly", "Luxury", "Pet-friendly"];
  const suitableOptions = ["leisure", "corporate", "medical", "long_stay", "family", "couples", "business", "groups", "wellness", "solo"];

  return (
    <div data-testid="admin-property-form">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/admin/properties")} className="text-white/60 hover:text-white">
          ← Back
        </Button>
        <h1 className="font-heading text-3xl font-light text-white">{isEdit ? "Edit Property" : "Add Property"}</h1>
      </div>

      {/* Tabs - only show for edit mode */}
      {isEdit && (
        <div className="flex gap-2 mb-6">
          <Button 
            type="button"
            variant={activeTab === "details" ? "default" : "ghost"}
            onClick={() => setActiveTab("details")}
            className={activeTab === "details" ? "bg-[#F3A15A] text-[#1A202C]" : "text-white/60 hover:text-white"}
          >
            Details
          </Button>
          <Button 
            type="button"
            variant={activeTab === "media" ? "default" : "ghost"}
            onClick={() => setActiveTab("media")}
            className={activeTab === "media" ? "bg-[#F3A15A] text-[#1A202C]" : "text-white/60 hover:text-white"}
          >
            <Image className="mr-2" size={18} /> Media
          </Button>
        </div>
      )}

      {/* Media Tab (Edit mode - full manager) */}
      {isEdit && activeTab === "media" && (
        <PropertyMediaManager propertyId={propertyId} onMediaChange={fetchProperty} />
      )}

      {/* Details Tab */}
      {(activeTab === "details" || !isEdit) && (
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
          <h2 className="font-heading text-xl font-medium text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-white/60 text-sm mb-1 block">Title</label>
              <Input value={form.title} onChange={e => updateField("title", e.target.value)} required className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="text-white/60 text-sm mb-1 block">Short Description</label>
              <Textarea value={form.description} onChange={e => updateField("description", e.target.value)} required className="bg-white/[0.04] border-white/[0.08] text-white" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="text-white/60 text-sm mb-1 block">Full Description</label>
              <Textarea value={form.full_description || ""} onChange={e => updateField("full_description", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" rows={5} />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Property Type</label>
              <Select value={form.property_type} onValueChange={v => updateField("property_type", v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]">
                  <SelectItem value="holiday_home" className="text-white">Holiday Home</SelectItem>
                  <SelectItem value="hotel_apartment" className="text-white">Hotel Apartment</SelectItem>
                  <SelectItem value="villa_resort" className="text-white">Villa / Resort</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Status</label>
              <Select value={form.status} onValueChange={v => updateField("status", v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]">
                  <SelectItem value="published" className="text-white">Published</SelectItem>
                  <SelectItem value="draft" className="text-white">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Photos & Videos (inline uploader) */}
        <InlineMediaUploader
          queuedFiles={queuedFiles}
          setQueuedFiles={setQueuedFiles}
          videoLinks={videoLinks}
          setVideoLinks={setVideoLinks}
        />

        {/* Location */}
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
          <h2 className="font-heading text-xl font-medium text-white mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">City</label>
              <Select value={form.city} onValueChange={v => updateField("city", v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]">
                  <SelectItem value="Dubai" className="text-white">Dubai</SelectItem>
                  <SelectItem value="Sharjah" className="text-white">Sharjah</SelectItem>
                  <SelectItem value="Ras Al Khaimah" className="text-white">Ras Al Khaimah</SelectItem>
                  <SelectItem value="Ajman" className="text-white">Ajman</SelectItem>
                  <SelectItem value="Abu Dhabi" className="text-white">Abu Dhabi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Area</label>
              <Input value={form.area || ""} onChange={e => updateField("area", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" placeholder="e.g., Dubai Marina" />
            </div>
            <div className="md:col-span-2">
              <label className="text-white/60 text-sm mb-1 block">Address (Public)</label>
              <Input value={form.address} onChange={e => updateField("address", e.target.value)} required className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Map Latitude</label>
              <Input type="number" step="any" value={form.map_lat || ""} onChange={e => updateField("map_lat", e.target.value ? parseFloat(e.target.value) : null)} className="bg-white/[0.04] border-white/[0.08] text-white" placeholder="e.g., 25.2048" data-testid="map-lat-input" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Map Longitude</label>
              <Input type="number" step="any" value={form.map_lng || ""} onChange={e => updateField("map_lng", e.target.value ? parseFloat(e.target.value) : null)} className="bg-white/[0.04] border-white/[0.08] text-white" placeholder="e.g., 55.2708" data-testid="map-lng-input" />
            </div>
          </div>
        </div>

        {/* Capacity */}
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
          <h2 className="font-heading text-xl font-medium text-white mb-4">Capacity & Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Bedrooms</label>
              <Input type="number" value={form.bedrooms} onChange={e => updateField("bedrooms", parseInt(e.target.value) || 0)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Beds</label>
              <Input type="number" value={form.beds} onChange={e => updateField("beds", parseInt(e.target.value) || 0)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Bed Type</label>
              <Select value={form.bed_type || "king"} onValueChange={v => updateField("bed_type", v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white" data-testid="bed-type-select"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]">
                  <SelectItem value="king" className="text-white">King Bed</SelectItem>
                  <SelectItem value="queen" className="text-white">Queen Bed</SelectItem>
                  <SelectItem value="double" className="text-white">Double Bed</SelectItem>
                  <SelectItem value="twin" className="text-white">Twin Beds</SelectItem>
                  <SelectItem value="single" className="text-white">Single Bed</SelectItem>
                  <SelectItem value="california_king" className="text-white">California King</SelectItem>
                  <SelectItem value="bunk" className="text-white">Bunk Bed</SelectItem>
                  <SelectItem value="sofa" className="text-white">Sofa Bed</SelectItem>
                  <SelectItem value="murphy" className="text-white">Murphy Bed</SelectItem>
                  <SelectItem value="futon" className="text-white">Futon</SelectItem>
                  <SelectItem value="mixed" className="text-white">Mixed / Multiple Types</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Bathrooms</label>
              <Input type="number" value={form.bathrooms} onChange={e => updateField("bathrooms", parseInt(e.target.value) || 0)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Max Guests</label>
              <Input type="number" value={form.max_guests} onChange={e => updateField("max_guests", parseInt(e.target.value) || 1)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Check-in Time</label>
              <Input type="time" value={form.check_in_time} onChange={e => updateField("check_in_time", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Check-out Time</label>
              <Input type="time" value={form.check_out_time} onChange={e => updateField("check_out_time", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-white/60 text-sm mb-1 block">House Rules</label>
            <Textarea value={form.house_rules || ""} onChange={e => updateField("house_rules", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" rows={3} placeholder="No smoking. No parties..." />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
          <h2 className="font-heading text-xl font-medium text-white mb-4">Pricing & Fees</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Nightly Rate (AED)</label>
              <Input type="number" value={form.pricing?.nightly} onChange={e => updatePricing("nightly", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Monthly Rate (AED)</label>
              <Input type="number" value={form.pricing?.monthly} onChange={e => updatePricing("monthly", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Cleaning Fee (AED)</label>
              <Input type="number" value={form.pricing?.cleaning_fee} onChange={e => updatePricing("cleaning_fee", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Service Fee %</label>
              <Input type="number" value={form.pricing?.service_fee_percent} onChange={e => updatePricing("service_fee_percent", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Taxes %</label>
              <Input type="number" value={form.pricing?.taxes_percent} onChange={e => updatePricing("taxes_percent", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Security Deposit (AED)</label>
              <Input type="number" value={form.pricing?.security_deposit} onChange={e => updatePricing("security_deposit", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Weekly Discount %</label>
              <Input type="number" value={form.pricing?.weekly_discount} onChange={e => updatePricing("weekly_discount", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Monthly Discount %</label>
              <Input type="number" value={form.pricing?.monthly_discount} onChange={e => updatePricing("monthly_discount", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">Min Nights</label>
              <Input type="number" value={form.pricing?.minimum_nights} onChange={e => updatePricing("minimum_nights", e.target.value)} className="bg-white/[0.04] border-white/[0.08] text-white" />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
          <h2 className="font-heading text-xl font-medium text-white mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map(amenity => (
              <button key={amenity} type="button" onClick={() => toggleArrayItem("amenities", amenity)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  form.amenities?.includes(amenity) ? "bg-[#F3A15A] text-[#1A202C]" : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}>
                {amenity}
              </button>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl border border-white/[0.06] p-6">
          <h2 className="font-heading text-xl font-medium text-white mb-4">Badges & Tags</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {badgeOptions.map(badge => (
              <button key={badge} type="button" onClick={() => toggleArrayItem("badges", badge)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  form.badges?.includes(badge) ? "bg-[#F3A15A] text-[#1A202C]" : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}>
                {badge}
              </button>
            ))}
          </div>
          <h3 className="text-white/60 text-sm mb-2">Suitable For</h3>
          <div className="flex flex-wrap gap-2">
            {suitableOptions.map(s => (
              <button key={s} type="button" onClick={() => toggleArrayItem("suitable_for", s)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                  form.suitable_for?.includes(s) ? "bg-blue-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}>
                {s}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => updateField("is_featured", e.target.checked)} className="rounded" />
              Featured Property
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/properties")} className="border-white/20 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A]">
            {saving ? <><Loader2 className="mr-2 animate-spin" size={18} /> Saving...</> : (isEdit ? "Update Property" : "Create Property")}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};
