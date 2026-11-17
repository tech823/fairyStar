import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import {
  CalendarIcon,
  MapPin,
  Users,
  Briefcase,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

const steps = [
  { id: 1, title: "Destination", icon: MapPin },
  { id: 2, title: "Details", icon: CalendarIcon },
  { id: 3, title: "Purpose", icon: Briefcase },
  { id: 4, title: "Add-ons", icon: Check },
  { id: 5, title: "Contact", icon: Users },
];

const cities = ["Dubai", "Sharjah", "Ras Al Khaimah", "Other"];
const purposes = [
  { value: "leisure", label: "Leisure / Vacation" },
  { value: "corporate", label: "Work / Relocation" },
  { value: "medical", label: "Medical Recovery" },
  { value: "business", label: "Business / Long Stay" },
];
const stayTypes = [
  { value: "holiday_home", label: "Holiday Home" },
  { value: "hotel_room", label: "Hotel Room" },
  { value: "hotel_apartment", label: "Hotel Apartment" },
  { value: "villa_resort", label: "Villa / Resort" },
];
const addOns = [
  { id: "airport_pickup", label: "Airport Pickup" },
  { id: "car_rental", label: "Car Rental" },
  { id: "tours", label: "Tours & Activities" },
  { id: "flight_booking", label: "Flight Ticketing" },
  { id: "visa_assistance", label: "Visa Assistance" },
];

export const PlanYourStayWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    city: "",
    checkIn: null,
    checkOut: null,
    guests: 2,
    purpose: "",
    stayType: "",
    addOns: [],
    budgetMin: "",
    budgetMax: "",
    name: "",
    email: "",
    phone: "",
  });

  const updateFormData = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));
  const toggleAddOn = (addOnId) =>
    setFormData((prev) => ({
      ...prev,
      addOns: prev.addOns.includes(addOnId)
        ? prev.addOns.filter((id) => id !== addOnId)
        : [...prev.addOns, addOnId],
    }));

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all contact details");
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        lead_type: "guest",
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        check_in: formData.checkIn
          ? format(formData.checkIn, "yyyy-MM-dd")
          : null,
        check_out: formData.checkOut
          ? format(formData.checkOut, "yyyy-MM-dd")
          : null,
        guests: formData.guests,
        purpose: formData.purpose,
        stay_type: formData.stayType,
        budget_min: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
        budget_max: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
        add_ons: formData.addOns,
      });
      toast.success("Thank you! Our coordinator will contact you shortly.");
      setCurrentStep(1);
      setFormData({
        city: "",
        checkIn: null,
        checkOut: null,
        guests: 2,
        purpose: "",
        stayType: "",
        addOns: [],
        budgetMin: "",
        budgetMax: "",
        name: "",
        email: "",
        phone: "",
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.city;
      case 2:
        return formData.checkIn && formData.checkOut;
      case 3:
        return !!formData.purpose;
      case 4:
        return true;
      case 5:
        return formData.name && formData.email && formData.phone;
      default:
        return false;
    }
  };

  return (
    <div
      className="liquid-glass-strong rounded-2xl p-6 md:p-8"
      data-testid="plan-your-stay-wizard"
    >
      {/* Progress Steps */}
      <div className="flex justify-between mb-8 overflow-x-auto pb-2 gap-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${currentStep >= step.id ? "bg-[#F3A15A]/20 text-[#F3A15A]" : "bg-white/[0.04] text-white/30"}`}
          >
            <step.icon size={15} />
            <span className="text-xs font-medium hidden sm:block">
              {step.title}
            </span>
            <span className="text-xs font-medium sm:hidden">{step.id}</span>
          </div>
        ))}
      </div>

      <div className="min-h-[280px]">
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="font-heading text-xl sm:text-2xl font-light text-white">
              Where would you like to stay?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => updateFormData("city", city)}
                  className={`p-4 rounded-xl border transition-all duration-200 ${formData.city === city ? "bg-[#F3A15A]/15 border-[#F3A15A]/30 text-[#F3A15A]" : "bg-white/[0.03] border-white/[0.06] text-white/70 hover:bg-white/[0.06]"}`}
                  data-testid={`city-${city.toLowerCase().replace(" ", "-")}`}
                >
                  <MapPin className="mx-auto mb-2" size={22} />
                  <span className="font-medium text-sm">{city}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="font-heading text-xl sm:text-2xl font-light text-white">
              When are you visiting?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                  Check-in
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06]"
                      data-testid="checkin-picker"
                    >
                      <CalendarIcon className="mr-2 text-[#F3A15A]" size={15} />
                      {formData.checkIn
                        ? format(formData.checkIn, "MMM dd, yyyy")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-dropdown">
                    <Calendar
                      mode="single"
                      selected={formData.checkIn}
                      onSelect={(date) => updateFormData("checkIn", date)}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                  Check-out
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06]"
                      data-testid="checkout-picker"
                    >
                      <CalendarIcon className="mr-2 text-[#F3A15A]" size={15} />
                      {formData.checkOut
                        ? format(formData.checkOut, "MMM dd, yyyy")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-dropdown">
                    <Calendar
                      mode="single"
                      selected={formData.checkOut}
                      onSelect={(date) => updateFormData("checkOut", date)}
                      disabled={(date) =>
                        date <= (formData.checkIn || new Date())
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                  Guests
                </label>
                <Select
                  value={formData.guests.toString()}
                  onValueChange={(val) =>
                    updateFormData("guests", parseInt(val))
                  }
                >
                  <SelectTrigger
                    className="bg-white/[0.04] border-white/[0.08] text-white"
                    data-testid="guests-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-dropdown">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem
                        key={num}
                        value={num.toString()}
                        className="text-white"
                      >
                        {num} {num === 1 ? "Guest" : "Guests"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="font-heading text-xl sm:text-2xl font-light text-white">
              What's your travel purpose?
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {purposes.map((purpose) => (
                <button
                  key={purpose.value}
                  onClick={() => updateFormData("purpose", purpose.value)}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${formData.purpose === purpose.value ? "bg-[#F3A15A]/15 border-[#F3A15A]/30 text-[#F3A15A]" : "bg-white/[0.03] border-white/[0.06] text-white/70 hover:bg-white/[0.06]"}`}
                  data-testid={`purpose-${purpose.value}`}
                >
                  {purpose.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                Preferred stay type
              </label>
              <Select
                value={formData.stayType}
                onValueChange={(val) => updateFormData("stayType", val)}
              >
                <SelectTrigger
                  className="bg-white/[0.04] border-white/[0.08] text-white"
                  data-testid="stay-type-select"
                >
                  <SelectValue placeholder="Select stay type" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {stayTypes.map((type) => (
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
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="font-heading text-xl sm:text-2xl font-light text-white">
              Need any additional services?
            </h3>
            <div className="space-y-2">
              {addOns.map((addon) => (
                <div
                  key={addon.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${formData.addOns.includes(addon.id) ? "bg-[#F3A15A]/15 border-[#F3A15A]/25" : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"}`}
                  onClick={() => toggleAddOn(addon.id)}
                  data-testid={`addon-${addon.id}`}
                >
                  <Checkbox
                    checked={formData.addOns.includes(addon.id)}
                    className="border-white/20 data-[state=checked]:bg-[#F3A15A]"
                  />
                  <span className="text-white/80 text-sm">{addon.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {currentStep === 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h3 className="font-heading text-xl sm:text-2xl font-light text-white">
              Almost there! Your details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
                  data-testid="name-input"
                />
              </div>
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
                data-testid="email-input"
              />
              <Input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
                data-testid="phone-input"
              />
              <Input
                type="number"
                placeholder="Min Budget (AED/night)"
                value={formData.budgetMin}
                onChange={(e) => updateFormData("budgetMin", e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
                data-testid="budget-min-input"
              />
              <Input
                type="number"
                placeholder="Max Budget (AED/night)"
                value={formData.budgetMax}
                onChange={(e) => updateFormData("budgetMax", e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
                data-testid="budget-max-input"
              />
            </div>
            <p className="text-white/30 text-sm">
              Our coordinator will contact you within 24 hours with personalized
              options.
            </p>
          </motion.div>
        )}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 1}
          className="text-white/40 hover:text-white hover:bg-white/[0.04]"
          data-testid="wizard-back-btn"
        >
          Back
        </Button>
        {currentStep < 5 ? (
          <LiquidButton
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={!canProceed()}
            data-testid="wizard-next-btn"
          >
            Continue <ArrowRight size={16} />
          </LiquidButton>
        ) : (
          <LiquidButton
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            data-testid="wizard-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={16} />{" "}
                Submitting...
              </>
            ) : (
              "Get My Quote"
            )}
          </LiquidButton>
        )}
      </div>
    </div>
  );
};

export default PlanYourStayWizard;
