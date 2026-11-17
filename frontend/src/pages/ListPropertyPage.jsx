import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building,
  Percent,
  BarChart,
  Shield,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const benefits = [
  {
    icon: Percent,
    title: "Higher Returns",
    desc: "Optimized pricing strategies",
  },
  {
    icon: Building,
    title: "Full Management",
    desc: "We handle everything for you",
  },
  { icon: BarChart, title: "Market Insights", desc: "Data-driven decisions" },
  { icon: Shield, title: "Protection", desc: "Guest screening & insurance" },
];

const services = [
  "Professional photography and listing creation",
  "Dynamic pricing optimization",
  "24/7 guest communication",
  "Check-in/check-out coordination",
  "Professional cleaning services",
  "Maintenance and repairs",
  "Monthly owner reports",
  "Legal compliance management",
];

export default function ListPropertyPage() {
  const [formData, setFormData] = useState({
    ownerName: "",
    email: "",
    phone: "",
    propertyType: "",
    city: "",
    bedrooms: "",
    currentlyRented: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ownerName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        lead_type: "property_owner",
        name: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        stay_type: formData.propertyType,
        message: `Bedrooms: ${formData.bedrooms}, Currently rented: ${formData.currentlyRented}, Notes: ${formData.message}`,
      });
      toast.success(
        "Thank you! Our property management team will contact you within 24 hours.",
      );
      setFormData({
        ownerName: "",
        email: "",
        phone: "",
        propertyType: "",
        city: "",
        bedrooms: "",
        currentlyRented: "",
        message: "",
      });
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#333D47] pt-24"
      data-testid="list-property-page"
    >
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1757439402296-000be181e38b?w=1920&q=80"
            alt="Property Management"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#333D47]/60 to-[#333D47]" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div initial="hidden" animate="visible" className="max-w-2xl">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
            >
              Property Management
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 tracking-tight"
            >
              List Your Property With Us
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/50 text-lg font-light leading-relaxed"
            >
              Turn your property into a profitable, hassle-free investment. We
              handle everything.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-14 bg-[#2D3139]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-5 text-center h-full">
                  <item.icon
                    className="mx-auto text-[#F3A15A] mb-3"
                    size={26}
                  />
                  <h3 className="font-heading text-sm font-medium text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-white/40 text-xs">{item.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-[#333D47]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-light text-white mb-6 tracking-tight">
                Full-Service Property Management
              </h2>
              <p className="text-white/50 mb-8 leading-relaxed">
                We take care of your property like it's our own. From
                professional listings to guest management and financial
                reporting.
              </p>
              <div className="space-y-3 mb-8">
                {services.map((service, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#F3A15A]/15 flex items-center justify-center">
                      <Check className="text-[#F3A15A]" size={12} />
                    </div>
                    <span className="text-white/70 text-sm">{service}</span>
                  </div>
                ))}
              </div>
              <GlassCard variant="highlight" hover={false} className="p-5">
                <h3 className="font-heading text-base font-medium text-white mb-2">
                  Transparent Pricing
                </h3>
                <p className="text-white/50 text-sm mb-3">
                  Our management fee is a percentage of booking revenue. No
                  upfront costs, no hidden fees.
                </p>
                <span className="inline-flex items-center gap-1.5 text-[#F3A15A] font-medium text-sm">
                  Learn about our pricing <ArrowRight size={14} />
                </span>
              </GlassCard>
            </div>

            <div>
              <GlassCard
                variant="solid"
                hover={false}
                className="p-6 sm:p-8"
                data-testid="list-property-form"
              >
                <h3 className="font-heading text-xl font-light text-white mb-6 tracking-tight">
                  Get a Free Property Assessment
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Your Name *"
                    value={formData.ownerName}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerName: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                    data-testid="owner-name-input"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                      data-testid="email-input"
                    />
                    <Input
                      type="tel"
                      placeholder="Phone *"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                      data-testid="phone-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={formData.propertyType}
                      onValueChange={(val) =>
                        setFormData({ ...formData, propertyType: val })
                      }
                    >
                      <SelectTrigger
                        className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        data-testid="property-type-select"
                      >
                        <SelectValue placeholder="Property Type" />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        {[
                          "Apartment",
                          "Villa",
                          "Townhouse",
                          "Studio",
                          "Penthouse",
                        ].map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            className="text-white"
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.city}
                      onValueChange={(val) =>
                        setFormData({ ...formData, city: val })
                      }
                    >
                      <SelectTrigger
                        className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        data-testid="city-select"
                      >
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        {[
                          "Dubai",
                          "Sharjah",
                          "Ras Al Khaimah",
                          "Abu Dhabi",
                        ].map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            className="text-white"
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      value={formData.bedrooms}
                      onValueChange={(val) =>
                        setFormData({ ...formData, bedrooms: val })
                      }
                    >
                      <SelectTrigger
                        className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        data-testid="bedrooms-select"
                      >
                        <SelectValue placeholder="Bedrooms" />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        {["Studio", "1", "2", "3", "4", "5+"].map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            className="text-white"
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={formData.currentlyRented}
                      onValueChange={(val) =>
                        setFormData({ ...formData, currentlyRented: val })
                      }
                    >
                      <SelectTrigger
                        className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        data-testid="rented-select"
                      >
                        <SelectValue placeholder="Currently Rented?" />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        {[
                          "Yes - Long term",
                          "Yes - Short term",
                          "No - Empty",
                          "No - Personal use",
                        ].map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            className="text-white"
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Tell us more about your property..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 min-h-[100px] text-sm"
                    data-testid="message-textarea"
                  />
                  <LiquidButton
                    type="submit"
                    disabled={submitting}
                    className="w-full justify-center py-4"
                    data-testid="submit-property-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />{" "}
                        Submitting...
                      </>
                    ) : (
                      "Get Free Assessment"
                    )}
                  </LiquidButton>
                </form>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
