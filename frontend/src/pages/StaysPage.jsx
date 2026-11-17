import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Search,
  Grid3X3,
  List,
  MapPin,
  CalendarIcon,
  Users,
  X,
  SlidersHorizontal,
  Map,
} from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import PropertyCard from "@/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

const cities = ["All Cities", "Dubai", "Sharjah", "Ras Al Khaimah"];
const propertyTypes = [
  { value: "all", label: "All Types" },
  { value: "holiday_home", label: "Holiday Home" },
  { value: "hotel_room", label: "Hotel Room" },
  { value: "hotel_apartment", label: "Hotel Apartment" },
  { value: "villa_resort", label: "Villa / Resort" },
];
const purposes = [
  { value: "all", label: "All Purposes" },
  { value: "leisure", label: "Leisure" },
  { value: "corporate", label: "Corporate" },
  { value: "medical", label: "Medical" },
  { value: "long_stay", label: "Long Stay" },
];
const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
];

export default function StaysPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "All Cities",
    propertyType: searchParams.get("type") || "all",
    purpose: searchParams.get("purpose") || "all",
    guests: searchParams.get("guests") || "any",
    checkIn: null,
    checkOut: null,
    priceRange: [0, 2000],
    sort: "recommended",
  });

  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.city && filters.city !== "All Cities")
          params.append("city", filters.city);
        if (filters.propertyType && filters.propertyType !== "all")
          params.append("property_type", filters.propertyType);
        if (filters.purpose && filters.purpose !== "all")
          params.append("purpose", filters.purpose);
        if (filters.guests && filters.guests !== "any")
          params.append("guests", filters.guests);
        if (filters.priceRange[0] > 0)
          params.append("min_price", filters.priceRange[0]);
        if (filters.priceRange[1] < 2000)
          params.append("max_price", filters.priceRange[1]);
        const res = await axios.get(`${API}/properties?${params.toString()}`);
        let data = res.data;
        if (filters.sort === "price_low")
          data.sort((a, b) => a.pricing.nightly - b.pricing.nightly);
        else if (filters.sort === "price_high")
          data.sort((a, b) => b.pricing.nightly - a.pricing.nightly);
        setProperties(data);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, [
    filters.city,
    filters.propertyType,
    filters.purpose,
    filters.guests,
    filters.priceRange,
    filters.sort,
  ]);

  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));
  const applyFilters = () => setShowFilters(false);
  const clearFilters = () => {
    setFilters({
      city: "All Cities",
      propertyType: "all",
      purpose: "all",
      guests: "any",
      checkIn: null,
      checkOut: null,
      priceRange: [0, 2000],
      sort: "recommended",
    });
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#333D47] pt-24" data-testid="stays-page">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-3 font-medium">
            Browse Properties
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-3 tracking-tight">
            Find Your Perfect Stay
          </h1>
          <p className="text-white/50 text-base sm:text-lg font-light">
            Verified properties across the UAE
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="sticky top-[56px] sm:top-[60px] z-40 glass-navbar py-3 sm:py-4">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
              <Select
                value={filters.city}
                onValueChange={(val) => updateFilter("city", val)}
              >
                <SelectTrigger
                  className="w-[120px] sm:w-[160px] bg-white/[0.05] border-white/[0.08] text-white text-sm"
                  data-testid="city-filter"
                >
                  <MapPin
                    size={14}
                    className="mr-1.5 text-[#F3A15A] shrink-0"
                  />
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="text-white">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/[0.05] border-white/[0.08] text-white hover:bg-white/[0.08] w-[110px] sm:w-[150px] justify-start text-sm"
                    data-testid="checkin-filter"
                  >
                    <CalendarIcon
                      size={14}
                      className="mr-1.5 text-[#F3A15A] shrink-0"
                    />
                    <span className="truncate">
                      {filters.checkIn
                        ? format(filters.checkIn, "MMM dd")
                        : "Check-in"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-dropdown">
                  <Calendar
                    mode="single"
                    selected={filters.checkIn}
                    onSelect={(date) => updateFilter("checkIn", date)}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="hidden sm:flex bg-white/[0.05] border-white/[0.08] text-white hover:bg-white/[0.08] w-[150px] justify-start text-sm"
                    data-testid="checkout-filter"
                  >
                    <CalendarIcon
                      size={14}
                      className="mr-1.5 text-[#F3A15A] shrink-0"
                    />
                    <span className="truncate">
                      {filters.checkOut
                        ? format(filters.checkOut, "MMM dd")
                        : "Check-out"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-dropdown">
                  <Calendar
                    mode="single"
                    selected={filters.checkOut}
                    onSelect={(date) => updateFilter("checkOut", date)}
                    disabled={(date) => date <= (filters.checkIn || new Date())}
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={filters.guests}
                onValueChange={(val) => updateFilter("guests", val)}
              >
                <SelectTrigger
                  className="hidden xs:flex w-[100px] sm:w-[130px] bg-white/[0.05] border-white/[0.08] text-white text-sm"
                  data-testid="guests-filter"
                >
                  <Users size={14} className="mr-1.5 text-[#F3A15A] shrink-0" />
                  <SelectValue placeholder="Guests" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  <SelectItem value="any" className="text-white">
                    Any
                  </SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem
                      key={num}
                      value={num.toString()}
                      className="text-white"
                    >
                      {num} Guest{num > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LiquidButton
                size="sm"
                onClick={applyFilters}
                data-testid="search-btn"
              >
                <Search size={15} /> Search
              </LiquidButton>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-glass text-white text-sm px-3"
                data-testid="more-filters-btn"
              >
                <SlidersHorizontal size={15} className="sm:mr-2" />{" "}
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <div className="hidden md:flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-[#F3A15A]/15 text-[#F3A15A]" : "text-white/30 hover:text-white"}`}
                  data-testid="grid-view-btn"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-[#F3A15A]/15 text-[#F3A15A]" : "text-white/30 hover:text-white"}`}
                  data-testid="list-view-btn"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`p-1.5 rounded transition-colors ${viewMode === "map" ? "bg-[#F3A15A]/15 text-[#F3A15A]" : "text-white/30 hover:text-white"}`}
                  data-testid="map-view-btn"
                >
                  <Map size={16} />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-white/[0.06]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                    Property Type
                  </label>
                  <Select
                    value={filters.propertyType}
                    onValueChange={(val) => updateFilter("propertyType", val)}
                  >
                    <SelectTrigger
                      className="bg-white/[0.05] border-white/[0.08] text-white text-sm"
                      data-testid="type-filter"
                    >
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      {propertyTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="text-white"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                    Travel Purpose
                  </label>
                  <Select
                    value={filters.purpose}
                    onValueChange={(val) => updateFilter("purpose", val)}
                  >
                    <SelectTrigger
                      className="bg-white/[0.05] border-white/[0.08] text-white text-sm"
                      data-testid="purpose-filter"
                    >
                      <SelectValue placeholder="All Purposes" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      {purposes.map((p) => (
                        <SelectItem
                          key={p.value}
                          value={p.value}
                          className="text-white"
                        >
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                    Price Range: AED {filters.priceRange[0]} - AED{" "}
                    {filters.priceRange[1]}+
                  </label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(val) => updateFilter("priceRange", val)}
                    min={0}
                    max={2000}
                    step={50}
                    className="py-2"
                    data-testid="price-slider"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-white/40 hover:text-white text-sm"
                  data-testid="clear-filters-btn"
                >
                  <X size={14} className="mr-1.5" /> Clear
                </Button>
                <LiquidButton
                  size="sm"
                  onClick={applyFilters}
                  data-testid="apply-filters-btn"
                >
                  Apply
                </LiquidButton>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-10">
        <div className="flex justify-between items-center gap-4 mb-8">
          <p className="text-white/50 text-sm">
            <span className="text-white font-medium">{properties.length}</span>{" "}
            properties found
          </p>
          <Select
            value={filters.sort}
            onValueChange={(val) => updateFilter("sort", val)}
          >
            <SelectTrigger
              className="w-[180px] bg-white/[0.05] border-white/[0.08] text-white text-sm"
              data-testid="sort-select"
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="glass-dropdown">
              {sortOptions.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="text-white"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div
            className={`grid gap-6 lg:gap-8 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-shimmer bg-white/[0.02] h-[380px] rounded-2xl"
              />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="font-heading text-xl font-light text-white mb-4">
              No properties found
            </h3>
            <p className="text-white/40 mb-8 text-sm">
              Try adjusting your filters
            </p>
            <LiquidButton onClick={clearFilters}>Clear Filters</LiquidButton>
          </div>
        ) : viewMode === "map" ? (
          <PropertyMap properties={properties} />
        ) : (
          <div
            className={`grid gap-6 lg:gap-8 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
          >
            {properties.map((property, i) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PropertyCard property={property} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
