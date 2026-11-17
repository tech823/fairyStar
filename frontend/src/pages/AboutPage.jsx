import { motion } from "framer-motion";
import { MapPin, Users, Heart, Award } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const team = [
  { name: "Ahmed Al-Rashid", role: "Founder & CEO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
  { name: "Sarah Johnson", role: "Operations Director", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
  { name: "Mohammed Ali", role: "Guest Experience Lead", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" },
];

const values = [
  { icon: Heart, title: "Guest First", desc: "Every decision starts with what's best for our guests" },
  { icon: Award, title: "Excellence", desc: "We set and exceed the highest standards" },
  { icon: Users, title: "Personal Touch", desc: "Real people, real support, real relationships" },
  { icon: MapPin, title: "Local Expertise", desc: "Deep knowledge of UAE hospitality" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#333D47] pt-24" data-testid="about-page">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80" alt="Dubai" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#333D47]/60 to-[#333D47]" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div initial="hidden" animate="visible" className="max-w-2xl">
            <motion.p variants={fadeUp} custom={0} className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium">Our Story</motion.p>
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 tracking-tight">About Fairy Star</motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg font-light leading-relaxed">
              Your complete stay and travel partner in the UAE. We're on a mission to make every trip comfortable, memorable, and hassle-free.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 sm:py-28 bg-[#2D3139]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.p variants={fadeUp} custom={0} className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium">Our Beginning</motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl font-light text-white mb-6 tracking-tight">Born from a Simple Idea</motion.h2>
              <motion.div variants={fadeUp} custom={2} className="space-y-4 text-white/50 leading-relaxed">
                <p>Fairy Star was founded with a simple belief: traveling to the UAE should be easier. Too often, visitors juggle multiple providers with no single point of contact.</p>
                <p>We changed that. Today, Fairy Star is a complete hospitality and travel service platform, offering professionally managed stays and end-to-end travel coordination.</p>
                <p>Our promise? <span className="text-[#F3A15A] font-medium">One partner. One coordinator. Zero hassle.</span></p>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative">
              <img src="https://images.unsplash.com/photo-1768069794857-9306ac167c6e?w=800&q=80" alt="Dubai skyline" className="rounded-2xl w-full aspect-[4/5] object-cover" />
              <div className="absolute -bottom-6 -left-6 liquid-glass-strong rounded-xl p-5">
                <p className="text-[#F3A15A] font-heading text-3xl font-light">2020</p>
                <p className="text-white/50 text-sm">Year Founded</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-28 bg-[#333D47]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium">What Drives Us</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl font-light text-white tracking-tight">Our Values</motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <GlassCard className="p-6 text-center h-full">
                  <div className="w-14 h-14 rounded-xl bg-[#F3A15A]/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="text-[#F3A15A]" size={24} />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-white mb-2">{value.title}</h3>
                  <p className="text-white/50 text-sm">{value.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-20 sm:py-28 bg-[#2D3139]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium">Our Reach</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl font-light text-white tracking-tight">Where We Operate</motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { city: "Dubai", properties: "30+", desc: "Marina, Downtown, Palm, JBR & more" },
              { city: "Sharjah", properties: "12+", desc: "Al Majaz, Corniche, City Centre" },
              { city: "Ras Al Khaimah", properties: "8+", desc: "Al Hamra, Beach areas, Mountain views" },
            ].map((location, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <GlassCard variant="solid" className="p-8 h-full">
                  <MapPin className="text-[#F3A15A] mb-4" size={28} />
                  <h3 className="font-heading text-2xl font-light text-white mb-1">{location.city}</h3>
                  <p className="text-[#F3A15A] font-medium text-sm mb-2">{location.properties} Properties</p>
                  <p className="text-white/40 text-sm">{location.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-28 bg-[#333D47]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium">Leadership</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl font-light text-white tracking-tight">Meet the Team</motion.h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-5 border-2 border-[#F3A15A]/20 shadow-[0_0_30px_rgba(243,161,90,0.1)]">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-heading text-lg font-medium text-white">{member.name}</h3>
                <p className="text-[#F3A15A] text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
