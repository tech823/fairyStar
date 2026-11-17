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
  Heart,
  Home,
  Car,
  FileText,
  Check,
  Loader2,
  Phone,
  Shield,
  Clock,
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

const features = [
  {
    icon: Home,
    title: "Recovery-Friendly Stays",
    desc: "Ground floor, accessible, quiet",
  },
  {
    icon: Car,
    title: "Medical Transport",
    desc: "Hospital transfers & appointments",
  },
  { icon: FileText, title: "Visa Assistance", desc: "Medical visa processing" },
  { icon: Phone, title: "24/7 Support", desc: "Round-the-clock coordinator" },
];

const benefits = [
  "Proximity to healthcare facilities",
  "Wheelchair-accessible options",
  "Ground floor apartments available",
  "Quiet, peaceful environments",
  "Kitchen facilities for dietary needs",
  "Flexible booking for treatment schedules",
];

export default function MedicalPage() {
  const [formData, setFormData] = useState({
    patientName: "",
    contactName: "",
    email: "",
    phone: "",
    treatmentType: "",
    hospitalName: "",
    stayDuration: "",
    specialRequirements: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        lead_type: "medical",
        name: formData.contactName || formData.patientName,
        email: formData.email,
        phone: formData.phone,
        message: `Patient: ${formData.patientName}, Treatment: ${formData.treatmentType}, Hospital: ${formData.hospitalName}, Duration: ${formData.stayDuration}, Requirements: ${formData.specialRequirements}`,
        purpose: "medical",
      });
      toast.success(
        "Thank you! Our medical travel team will contact you within 24 hours.",
      );
      setFormData({
        patientName: "",
        contactName: "",
        email: "",
        phone: "",
        treatmentType: "",
        hospitalName: "",
        stayDuration: "",
        specialRequirements: "",
      });
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#333D47] pt-24" data-testid="medical-page">
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1767350510090-137a6ce252c0?w=1920&q=80"
            alt="Medical Travel"
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
              Medical Travel Support
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 tracking-tight"
            >
              Comfortable Recovery Stays
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/50 text-lg font-light leading-relaxed"
            >
              Specialized accommodation for medical travelers near major
              hospitals, with complete travel coordination.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-14 bg-[#2D3139]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((item, i) => (
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
                Focus on Recovery, We Handle the Rest
              </h2>
              <p className="text-white/50 mb-8 leading-relaxed">
                Our recovery-friendly accommodations are carefully selected to
                provide comfort and convenience during your treatment journey.
              </p>
              <div className="space-y-3 mb-8">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#F3A15A]/15 flex items-center justify-center">
                      <Check className="text-[#F3A15A]" size={12} />
                    </div>
                    <span className="text-white/70 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
              <GlassCard hover={false} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Heart className="text-[#F3A15A]" size={20} />
                  <h3 className="font-heading text-base font-medium text-white">
                    Complete Support
                  </h3>
                </div>
                <p className="text-white/50 text-sm mb-3">
                  From visa assistance to hospital transfers, our coordinator
                  handles everything.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Shield className="text-[#F3A15A]" size={14} />
                    <span className="text-white/60 text-xs">
                      Verified Properties
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-[#F3A15A]" size={14} />
                    <span className="text-white/60 text-xs">
                      24/7 Assistance
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <div>
              <GlassCard
                variant="solid"
                hover={false}
                className="p-6 sm:p-8"
                data-testid="medical-form"
              >
                <h3 className="font-heading text-xl font-light text-white mb-6 tracking-tight">
                  Request Medical Travel Support
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    placeholder="Patient Name *"
                    value={formData.patientName}
                    onChange={(e) =>
                      setFormData({ ...formData, patientName: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                    data-testid="patient-name-input"
                  />
                  <Input
                    placeholder="Contact Person (if different)"
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
                  <Input
                    placeholder="Type of Treatment"
                    value={formData.treatmentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        treatmentType: e.target.value,
                      })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                    data-testid="treatment-input"
                  />
                  <Input
                    placeholder="Hospital/Clinic Name"
                    value={formData.hospitalName}
                    onChange={(e) =>
                      setFormData({ ...formData, hospitalName: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                    data-testid="hospital-input"
                  />
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
                      <SelectValue placeholder="Expected Stay Duration" />
                    </SelectTrigger>
                    <SelectContent className="glass-dropdown">
                      {[
                        "1-2 weeks",
                        "2-4 weeks",
                        "1-2 months",
                        "2-3 months",
                        "3+ months",
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
                  <Textarea
                    placeholder="Special requirements (accessibility, dietary, etc.)..."
                    value={formData.specialRequirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialRequirements: e.target.value,
                      })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 min-h-[100px] text-sm"
                    data-testid="requirements-textarea"
                  />
                  <LiquidButton
                    type="submit"
                    disabled={submitting}
                    className="w-full justify-center py-4"
                    data-testid="submit-medical-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />{" "}
                        Submitting...
                      </>
                    ) : (
                      "Request Support"
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
