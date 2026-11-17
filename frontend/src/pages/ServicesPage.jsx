import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Car, Plane, FileText, Map, PlaneTakeoff, Building2, ArrowRight, Check, MessageCircle } from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const ServiceCard = ({ icon: Icon, title, description, features, price }) => (
  <GlassCard className="p-6 h-full flex flex-col">
    <div className="w-12 h-12 rounded-xl bg-[#F3A15A]/10 flex items-center justify-center mb-5">
      <Icon className="text-[#F3A15A]" size={22} />
    </div>
    <h3 className="font-heading text-lg font-medium text-white mb-2">{title}</h3>
    <p className="text-white/50 text-sm mb-4 leading-relaxed">{description}</p>
    <ul className="space-y-2 mb-6 flex-1">
      {features.map((feature, j) => (
        <li key={j} className="flex items-center gap-2 text-white/60 text-sm">
          <Check className="text-[#F3A15A] shrink-0" size={14} />{feature}
        </li>
      ))}
    </ul>
    <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
      <span className="text-[#F3A15A] font-heading font-medium text-sm">{price}</span>
      <a href="https://wa.me/971506603525" target="_blank" rel="noopener noreferrer">
        <LiquidButton variant="ghost" size="sm" className="text-[#F3A15A] text-xs px-3 py-1.5">
          Inquire <ArrowRight size={12} />
        </LiquidButton>
      </a>
    </div>
  </GlassCard>
);

const services = [
  { icon: PlaneTakeoff, title: "Airport Transfers", description: "Private pickup and drop-off services from all UAE airports.", features: ["Meet & Greet", "24/7 Availability", "All UAE Airports", "Child Seats Available"], price: "From AED 150" },
  { icon: Car, title: "Car Rental", description: "Choose from economy to luxury vehicles. Full insurance included.", features: ["Economy to Luxury", "Full Insurance", "Delivery Service", "Unlimited Mileage"], price: "From AED 120/day" },
  { icon: Map, title: "Tours & Activities", description: "Experience the best of UAE with our curated tours.", features: ["Desert Safari", "Dubai City Tour", "Abu Dhabi Day Trip", "Dhow Cruise"], price: "From AED 180/person" },
  { icon: Plane, title: "Flight Booking", description: "Let us handle your flight arrangements with the best deals.", features: ["Best Price Guarantee", "Flexible Booking", "Group Bookings", "Business Class"], price: "Service fee: AED 50" },
  { icon: FileText, title: "Visa Assistance", description: "UAE tourist visa processing made simple.", features: ["30/60/90 Day Visas", "Express Processing", "Document Support", "Extension Help"], price: "From AED 350" },
  { icon: Building2, title: "Concierge Services", description: "Restaurant reservations, event tickets, special arrangements.", features: ["Restaurant Bookings", "Event Tickets", "Special Occasions", "Local Tips"], price: "Complimentary" },
];

const steps = [
  { step: 1, title: "Tell Us", desc: "Share your requirements" },
  { step: 2, title: "We Plan", desc: "Personalized itinerary" },
  { step: 3, title: "You Confirm", desc: "Review and approve" },
  { step: 4, title: "Enjoy", desc: "We handle everything" },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#333D47] pt-24" data-testid="services-page">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1691845164135-f7dc89ae38d7?w=1920&q=80" alt="Services" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#333D47]/60 to-[#333D47]" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div initial="hidden" animate="visible" className="max-w-2xl">
            <motion.p variants={fadeUp} custom={0} className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium">More Than Just a Stay</motion.p>
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 tracking-tight">Complete Travel Services</motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-white/50 text-lg mb-8 font-light leading-relaxed">
              From the moment you land to the moment you leave, we've got everything covered.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col xs:flex-row gap-4">
              <a href="https://wa.me/971506603525" target="_blank" rel="noopener noreferrer">
                <LiquidButton data-testid="inquire-btn"><MessageCircle size={18} /> Inquire Now</LiquidButton>
              </a>
              <Link to="/stays"><LiquidButton variant="glass">Browse Stays</LiquidButton></Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 sm:py-28 bg-[#2D3139]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <ServiceCard {...service} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-[#333D47]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium">Simple Process</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="font-heading text-3xl sm:text-4xl font-light text-white tracking-tight">How It Works</motion.h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#F3A15A] text-[#1A202C] flex items-center justify-center mx-auto mb-4 font-heading text-xl font-medium shadow-[0_0_30px_rgba(243,161,90,0.3)]">
                  {item.step}
                </div>
                <h3 className="font-heading text-base font-medium text-white mb-1">{item.title}</h3>
                <p className="text-white/40 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-[#2D3139]">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-light text-white mb-6 tracking-tight">Ready to Plan Your Trip?</h2>
          <p className="text-white/50 text-lg mb-10 font-light">Our coordinators are ready to help you create the perfect UAE experience</p>
          <a href="https://wa.me/971506603525" target="_blank" rel="noopener noreferrer">
            <LiquidButton size="xl" data-testid="cta-contact-btn"><MessageCircle size={18} /> Chat on WhatsApp</LiquidButton>
          </a>
        </div>
      </section>
    </div>
  );
}
