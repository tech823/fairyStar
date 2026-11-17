import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Search,
  CalendarCheck,
  CreditCard,
  Key,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

const journeySteps = [
  {
    icon: Search,
    title: "Explore & Discover",
    subtitle: "Find Your Perfect Stay",
    description: "Browse our curated collection of premium vacation homes across the UAE. Use our smart filters to find properties that match your style, budget, and needs — from beachfront villas to downtown apartments.",
    detail: "Filter by city, property type, budget, and amenities to find your ideal match.",
    color: "#F3A15A",
  },
  {
    icon: CalendarCheck,
    title: "Plan & Inquire",
    subtitle: "Tailored to Your Schedule",
    description: "Select your dates, review real-time availability, and submit your inquiry. Our team typically responds within 2 hours to help you finalize every detail of your stay.",
    detail: "Our Plan Your Stay wizard makes booking as easy as 1-2-3.",
    color: "#4ECDC4",
  },
  {
    icon: CreditCard,
    title: "Book & Pay Securely",
    subtitle: "Safe & Transparent",
    description: "Confirm your reservation with our secure Stripe-powered checkout. No hidden fees — you'll see the full breakdown including nightly rate, cleaning, taxes, and any add-on services before you pay.",
    detail: "All prices in AED. Instant booking confirmation via email.",
    color: "#FF6B6B",
  },
  {
    icon: Key,
    title: "Arrive & Check In",
    subtitle: "Seamless Welcome",
    description: "Your dedicated coordinator will share all check-in details, including access codes, parking instructions, and a personalized welcome guide. We're available 24/7 for anything you need.",
    detail: "Airport pickup, car rental, and tour packages available as add-ons.",
    color: "#A78BFA",
  },
  {
    icon: Sparkles,
    title: "Enjoy Your Stay",
    subtitle: "Live the Experience",
    description: "Relax, explore, and make memories. Whether it's a family vacation, a business trip, or a wellness retreat — your home away from home is fully equipped for comfort and convenience.",
    detail: "Request housekeeping, maintenance, or concierge services anytime.",
    color: "#F59E0B",
  },
  {
    icon: HeartHandshake,
    title: "Check Out & Stay Connected",
    subtitle: "Until Next Time",
    description: "Check out at your convenience. Share your feedback — it helps us improve. As a returning guest, you'll enjoy priority booking and exclusive offers on your next stay.",
    detail: "Returning guests receive up to 15% off their next booking.",
    color: "#10B981",
  },
];

const StepCard = ({ step, index, isLast }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className="relative" data-testid={`journey-step-${index}`}>
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-1/2 -translate-x-px top-full w-[2px] h-16 sm:h-20"
          style={{ background: `linear-gradient(to bottom, ${step.color}40, transparent)` }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative"
      >
        {/* Step Number + Icon */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 relative"
            style={{ background: `${step.color}20`, border: `2px solid ${step.color}40` }}
          >
            <step.icon size={28} style={{ color: step.color }} />
            <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1A202C] border-2 flex items-center justify-center text-xs font-bold"
              style={{ borderColor: step.color, color: step.color }}
            >
              {index + 1}
            </span>
          </motion.div>
        </div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, x: isEven ? -20 : 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="liquid-glass rounded-xl p-6 sm:p-8 max-w-2xl mx-auto"
        >
          <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: step.color }}>
            {step.subtitle}
          </p>
          <h3 className="font-heading text-xl sm:text-2xl font-medium text-white mb-3">
            {step.title}
          </h3>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-4">
            {step.description}
          </p>
          <div className="px-4 py-3 rounded-lg" style={{ background: `${step.color}10`, borderLeft: `3px solid ${step.color}` }}>
            <p className="text-white/80 text-sm">{step.detail}</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function CustomerJourneyPage() {
  return (
    <div className="min-h-screen" data-testid="customer-journey-page">
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F3A15A]/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#F3A15A] uppercase tracking-[0.3em] text-xs sm:text-sm mb-4"
          >
            Your Experience
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-6"
          >
            The Guest Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto"
          >
            From discovery to departure, we've designed every touchpoint for comfort, 
            transparency, and delight. Here's what to expect.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10"
          >
            <ChevronDown className="mx-auto text-white/20 animate-bounce" size={28} />
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-8 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-16 sm:space-y-20">
          {journeySteps.map((step, i) => (
            <StepCard key={i} step={step} index={i} isLast={i === journeySteps.length - 1} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-heading text-2xl sm:text-3xl font-light text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-white/50 mb-8">
            Browse our collection or tell us exactly what you're looking for.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/stays"
              data-testid="journey-explore-btn"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#F3A15A] text-[#1A202C] font-medium hover:bg-[#E8935A] transition-colors"
            >
              Explore Stays <ArrowRight size={18} />
            </Link>
            <Link
              to="/contact"
              data-testid="journey-contact-btn"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
