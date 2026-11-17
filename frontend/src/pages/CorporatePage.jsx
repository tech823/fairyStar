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
  Building2,
  Users,
  Calendar,
  FileText,
  Check,
  Loader2,
  Briefcase,
  Clock,
  Shield,
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
    icon: Building2,
    title: "Flexible Stays",
    desc: "Short-term to long-term options",
  },
  { icon: Users, title: "Group Bookings", desc: "Multiple rooms, one invoice" },
  {
    icon: Calendar,
    title: "Easy Extensions",
    desc: "Extend stays with one message",
  },
  {
    icon: FileText,
    title: "Corporate Billing",
    desc: "Monthly invoicing available",
  },
];

const features = [
  "Dedicated corporate account manager",
  "Priority booking and availability",
  "Flexible cancellation policies",
  "Consolidated billing and invoicing",
  "Employee travel coordination",
  "24/7 emergency support",
];

export default function CorporatePage() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    employeeCount: "",
    stayDuration: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        lead_type: "corporate",
        name: formData.contactName || formData.companyName,
        email: formData.email,
        phone: formData.phone,
        message: `Company: ${formData.companyName}, Employees: ${formData.employeeCount}, Duration: ${formData.stayDuration}, Notes: ${formData.message}`,
        purpose: "corporate",
      });
      toast.success(
        "Thank you! Our corporate team will contact you within 24 hours.",
      );
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        employeeCount: "",
        stayDuration: "",
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
      data-testid="corporate-page"
    >
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
            alt="Corporate"
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
              Corporate Solutions
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 tracking-tight"
            >
              Business Travel, Simplified
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/50 text-lg font-light leading-relaxed"
            >
              Tailored accommodation solutions for businesses. Employee
              relocations, project teams, and long-term stays.
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
                Why Companies Choose Us
              </h2>
              <p className="text-white/50 mb-8 leading-relaxed">
                We understand corporate travel. From short trips to multi-month
                relocations, we provide flexibility your business needs.
              </p>
              <div className="space-y-3 mb-8">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#F3A15A]/15 flex items-center justify-center">
                      <Check className="text-[#F3A15A]" size={12} />
                    </div>
                    <span className="text-white/70 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <GlassCard hover={false} className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Briefcase, val: "50+", label: "Corporate Clients" },
                    { icon: Clock, val: "24h", label: "Response Time" },
                    { icon: Shield, val: "100%", label: "Satisfaction" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <s.icon
                        size={18}
                        className="text-[#F3A15A] mx-auto mb-2"
                      />
                      <p className="text-white font-heading text-xl font-light">
                        {s.val}
                      </p>
                      <p className="text-white/30 text-[10px] uppercase tracking-wider">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div>
              <GlassCard
                variant="solid"
                hover={false}
                className="p-6 sm:p-8"
                data-testid="corporate-form"
              >
                <h3 className="font-heading text-xl font-light text-white mb-6 tracking-tight">
                  Get a Corporate Quote
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Company Name *"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                    data-testid="company-name-input"
                  />
                  <Input
                    placeholder="Contact Person Name"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                    data-testid="contact-name-input"
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
                      value={formData.employeeCount}
                      onValueChange={(val) =>
                        setFormData({ ...formData, employeeCount: val })
                      }
                    >
                      <SelectTrigger
                        className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        data-testid="employee-count-select"
                      >
                        <SelectValue placeholder="# of Employees" />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        {["1-5", "6-10", "11-20", "21-50", "50+"].map((opt) => (
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
                      value={formData.stayDuration}
                      onValueChange={(val) =>
                        setFormData({ ...formData, stayDuration: val })
                      }
                    >
                      <SelectTrigger
                        className="bg-white/[0.04] border-white/[0.08] text-white text-sm"
                        data-testid="duration-select"
                      >
                        <SelectValue placeholder="Expected Duration" />
                      </SelectTrigger>
                      <SelectContent className="glass-dropdown">
                        {[
                          "1-2 weeks",
                          "1-3 months",
                          "3-6 months",
                          "6+ months",
                          "Ongoing",
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
                    placeholder="Additional requirements..."
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
                    data-testid="submit-corporate-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />{" "}
                        Submitting...
                      </>
                    ) : (
                      "Request Corporate Quote"
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
