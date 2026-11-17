import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  Loader2,
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

const contactInfo = [
  {
    icon: Phone,
    label: "Phone",
    value: "+971 50 660 3525",
    href: "tel:+971506603525",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@fairystar.ae",
    href: "mailto:info@fairystar.ae",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+971 50 660 3525",
    href: "https://wa.me/971506603525",
  },
  { icon: MapPin, label: "Location", value: "Dubai, UAE", href: "#" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/leads`, {
        lead_type: "guest",
        name: formData.name,
        email: formData.email,
        phone: formData.phone || "Not provided",
        message: `Subject: ${formData.subject || "General Inquiry"}\n\n${formData.message}`,
      });
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#333D47] pt-24" data-testid="contact-page">
      <section className="py-12 sm:py-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center max-w-2xl mx-auto"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
            >
              Reach Out
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 tracking-tight"
            >
              Get in Touch
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/50 text-lg font-light"
            >
              Have questions? We're here to help. Our team responds within 24
              hours.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-6 sm:py-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {contactInfo.map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                data-testid={`contact-${item.label.toLowerCase()}`}
              >
                <GlassCard className="p-5 text-center hover:border-[#F3A15A]/20">
                  <item.icon
                    className="mx-auto text-[#F3A15A] mb-3"
                    size={20}
                  />
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.15em] mb-1">
                    {item.label}
                  </p>
                  <p className="text-white font-medium text-xs truncate">
                    {item.value}
                  </p>
                </GlassCard>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-light text-white mb-5 tracking-tight">
                Send Us a Message
              </h2>
              <p className="text-white/50 mb-8 text-sm leading-relaxed">
                Fill out the form and our team will get back to you. For urgent
                inquiries, contact us directly.
              </p>
              <GlassCard hover={false} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="text-[#F3A15A] shrink-0" size={18} />
                  <h3 className="font-heading text-base font-medium text-white">
                    Response Time
                  </h3>
                </div>
                <p className="text-white/50 text-sm mb-3">
                  We typically respond within 2-4 hours (9 AM - 9 PM UAE time).
                </p>
                <a
                  href="https://wa.me/971506603525"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#25D366] font-medium text-sm"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
              </GlassCard>
            </div>
            <div>
              <GlassCard
                variant="solid"
                hover={false}
                className="p-6 sm:p-8"
                data-testid="contact-form"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      placeholder="Your Name *"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                      data-testid="name-input"
                    />
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                      data-testid="phone-input"
                    />
                    <Input
                      placeholder="Subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 text-sm"
                      data-testid="subject-input"
                    />
                  </div>
                  <Textarea
                    placeholder="Your message *"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 min-h-[130px] text-sm"
                    data-testid="message-textarea"
                  />
                  <LiquidButton
                    type="submit"
                    disabled={submitting}
                    className="w-full justify-center py-4"
                    data-testid="send-message-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />{" "}
                        Sending...
                      </>
                    ) : (
                      "Send Message"
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
