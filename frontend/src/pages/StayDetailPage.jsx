import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  MapPin,
  Bed,
  Bath,
  Users,
  CalendarIcon,
  Check,
  Star,
  Shield,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

export default function StayDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(2);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentType, setPaymentType] = useState("deposit");
  const [pricing, setPricing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const propRes = await axios.get(`${API}/properties/${id}`);
        const servicesRes = await axios.get(`${API}/services`);
        setProperty(propRes.data);
        setServices(servicesRes.data);
      } catch (err) {
        toast.error("Property not found");
        navigate("/stays");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  const calcPrice = useCallback(async () => {
    if (!checkIn || !checkOut) return;
    try {
      const res = await axios.post(`${API}/bookings/calculate`, null, {
        params: {
          property_id: id,
          check_in: format(checkIn, "yyyy-MM-dd"),
          check_out: format(checkOut, "yyyy-MM-dd"),
          guests,
          add_on_ids: selectedAddOns,
        },
      });
      setPricing(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [checkIn, checkOut, guests, selectedAddOns, id]);

  useEffect(() => {
    calcPrice();
  }, [calcPrice]);

  const toggleAddOn = (svcId) =>
    setSelectedAddOns((prev) =>
      prev.includes(svcId) ? prev.filter((x) => x !== svcId) : [...prev, svcId],
    );

  const handleBooking = async () => {
    if (!guestName || !guestEmail || !guestPhone) {
      toast.error("Fill guest details");
      return;
    }
    if (!pricing) {
      toast.error("Select dates");
      return;
    }
    setSubmitting(true);
    try {
      const addOnsData = selectedAddOns.map((svcId) => {
        const svc = services.find((s) => s.id === svcId);
        return {
          service_id: svcId,
          name: svc?.name || "",
          price: svc?.price || 0,
          quantity: 1,
        };
      });
      const bookingRes = await axios.post(`${API}/bookings`, {
        property_id: id,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests,
        add_ons: addOnsData,
        payment_type: paymentType,
      });
      const checkoutRes = await axios.post(
        `${API}/payments/create-checkout`,
        null,
        {
          params: {
            booking_id: bookingRes.data.booking_id,
            origin_url: window.location.origin,
          },
        },
      );
      window.location.href = checkoutRes.data.checkout_url;
    } catch {
      toast.error("Booking error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#333D47] pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F3A15A]" size={40} />
      </div>
    );
  if (!property) return null;

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const images = property.images || [];
  const badges = property.badges || [];
  const amenities = property.amenities || [];
  const priceNightly = property.pricing?.nightly || 0;
  const maxGuests = property.max_guests || 4;

  return (
    <div
      className="min-h-screen bg-[#333D47] pt-24"
      data-testid="stay-detail-page"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-4">
        <Link
          to="/stays"
          className="inline-flex items-center text-white/40 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft size={18} /> Back to Stays
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative rounded-2xl overflow-hidden mb-8 group">
              <div className="aspect-[16/10]">
                <img
                  src={
                    images[currentImageIndex] ||
                    "https://images.unsplash.com/photo-1638454795595-0a0abf68614d?w=1200"
                  }
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((i) =>
                        i > 0 ? i - 1 : images.length - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 liquid-glass p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex((i) =>
                        i < images.length - 1 ? i + 1 : 0,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 liquid-glass p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? "bg-[#F3A15A] w-6" : "bg-white/40"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {badges.map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3A15A]/10 text-[#F3A15A] text-xs border border-[#F3A15A]/15"
                  >
                    <Shield size={11} /> {badge}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-light text-white mb-3 tracking-tight">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
              <MapPin size={16} className="text-[#F3A15A]" />
              <span>
                {property.address}, {property.city}
              </span>
            </div>

            <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-white/70">
                <Bed className="text-[#F3A15A]" size={18} />
                <span>
                  {property.bedrooms} Bed{property.bedrooms !== 1 ? "s" : ""}
                  {property.bed_type
                    ? ` (${property.bed_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())})`
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Bath className="text-[#F3A15A]" size={18} />
                <span>
                  {property.bathrooms} Bath{property.bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Users className="text-[#F3A15A]" size={18} />
                <span>{maxGuests} Guests</span>
              </div>
            </div>

            <h2 className="font-heading text-xl font-light text-white mb-4">
              About This Property
            </h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              {property.description}
            </p>

            <h2 className="font-heading text-xl font-light text-white mb-4">
              Amenities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {amenities.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                >
                  <Check className="text-[#F3A15A] shrink-0" size={14} />
                  <span className="text-white/70 text-sm">{a}</span>
                </div>
              ))}
            </div>

            <h2 className="font-heading text-xl font-light text-white mb-4">
              Add-on Services
            </h2>
            <div className="space-y-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => toggleAddOn(svc.id)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                    selectedAddOns.includes(svc.id)
                      ? "bg-[#F3A15A]/10 border border-[#F3A15A]/25"
                      : "bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedAddOns.includes(svc.id)}
                      className="border-white/20 data-[state=checked]:bg-[#F3A15A]"
                    />
                    <div>
                      <p className="text-white font-medium text-sm">
                        {svc.name}
                      </p>
                      <p className="text-white/30 text-xs">{svc.description}</p>
                    </div>
                  </div>
                  <p className="text-[#F3A15A] font-heading font-medium">
                    AED {svc.price}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <GlassCard variant="solid" hover={false} className="p-6">
                <div className="flex items-end justify-between mb-6 pb-6 border-b border-white/[0.06]">
                  <div>
                    <span className="text-[#F3A15A] font-heading text-2xl sm:text-3xl font-light">
                      AED {priceNightly.toLocaleString()}
                    </span>
                    <span className="text-white/30 text-sm"> /night</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#F3A15A]">
                    <Star className="fill-[#F3A15A]" size={14} />
                    <span className="font-medium text-sm">4.9</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] text-white/40 mb-1 block uppercase tracking-wider">
                      Check-in
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        >
                          <CalendarIcon
                            size={13}
                            className="mr-2 text-[#F3A15A]"
                          />
                          {checkIn ? format(checkIn, "MMM dd") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-dropdown">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={setCheckIn}
                          disabled={(d) => d < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-[10px] text-white/40 mb-1 block uppercase tracking-wider">
                      Check-out
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        >
                          <CalendarIcon
                            size={13}
                            className="mr-2 text-[#F3A15A]"
                          />
                          {checkOut ? format(checkOut, "MMM dd") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-dropdown">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={setCheckOut}
                          disabled={(d) => d <= (checkIn || new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] text-white/40 mb-1 block uppercase tracking-wider">
                    Guests
                  </label>
                  <Select
                    value={guests.toString()}
                    onValueChange={(v) => setGuests(parseInt(v))}
                  >
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      {[1, 2, 3, 4, 5, 6, 7, 8]
                        .filter((n) => n <= maxGuests)
                        .map((n) => (
                          <SelectItem
                            key={n}
                            value={n.toString()}
                            className="text-white"
                          >
                            {n} Guest{n > 1 ? "s" : ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 mb-4">
                  <Input
                    placeholder="Full Name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                  />
                </div>

                {pricing && (
                  <div className="mb-6 space-y-2 text-sm">
                    <div className="flex justify-between text-white/40">
                      <span>
                        AED {priceNightly} x {nights} nights
                      </span>
                      <span>AED {pricing.base_price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-white/40">
                      <span>Fees</span>
                      <span>
                        AED{" "}
                        {(
                          (pricing.cleaning_fee || 0) +
                          (pricing.service_fee || 0)
                        ).toLocaleString()}
                      </span>
                    </div>
                    {pricing.add_ons_total > 0 && (
                      <div className="flex justify-between text-white/40">
                        <span>Add-ons</span>
                        <span>
                          AED {pricing.add_ons_total?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-medium pt-2 border-t border-white/[0.06]">
                      <span>Total</span>
                      <span className="text-[#F3A15A]">
                        AED {pricing.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentType("deposit")}
                    className={`p-3 rounded-xl text-sm transition-all ${paymentType === "deposit" ? "bg-[#F3A15A]/15 border border-[#F3A15A]/30 text-[#F3A15A]" : "bg-white/[0.03] border border-white/[0.06] text-white/50"}`}
                  >
                    Deposit 30%
                  </button>
                  <button
                    onClick={() => setPaymentType("full")}
                    className={`p-3 rounded-xl text-sm transition-all ${paymentType === "full" ? "bg-[#F3A15A]/15 border border-[#F3A15A]/30 text-[#F3A15A]" : "bg-white/[0.03] border border-white/[0.06] text-white/50"}`}
                  >
                    Pay Full
                  </button>
                </div>

                <LiquidButton
                  onClick={handleBooking}
                  disabled={!pricing || submitting}
                  className="w-full justify-center py-4 text-base"
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 animate-spin" size={18} />{" "}
                      Processing...
                    </span>
                  ) : (
                    <span>
                      Book - AED{" "}
                      {pricing
                        ? (paymentType === "deposit"
                            ? pricing.deposit
                            : pricing.total
                          )?.toLocaleString()
                        : "..."}
                    </span>
                  )}
                </LiquidButton>

                <div className="mt-6 pt-6 border-t border-white/[0.06] flex gap-3">
                  <a
                    href="https://wa.me/971506603525"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/15 text-sm"
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                  <a
                    href="tel:+971506603525"
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.04] text-white/70 border border-white/[0.06] text-sm"
                  >
                    <Phone size={16} /> Call
                  </a>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
