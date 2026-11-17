import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";
import StatsCounter from "@/components/StatsCounter";
import {
  ArrowRight,
  Star,
  Shield,
  Users,
  MapPin,
  Phone,
  Car,
  Plane,
  FileText,
  Map,
  CheckCircle,
  Quote,
  ChevronRight,
} from "lucide-react";
import PlanYourStayWizard from "@/components/PlanYourStayWizard";
import PropertyCard from "@/components/PropertyCard";
import Hero3D from "@/components/Hero3D";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

const heroImages = [
  "https://images.unsplash.com/photo-1745750327932-7fb1d6f60b9b?w=1920&q=80",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80",
];

const features = [
  {
    icon: Shield,
    title: "Verified Properties",
    description:
      "Every property is professionally managed with strict quality standards.",
  },
  {
    icon: Users,
    title: "Personal Coordinator",
    description:
      "A dedicated coordinator supports you before, during, and after your stay.",
  },
  {
    icon: CheckCircle,
    title: "Transparent Pricing",
    description:
      "Clear nightly & monthly rates with upfront taxes and fees. No hidden costs.",
  },
  {
    icon: Phone,
    title: "24/7 Support",
    description: "Round-the-clock assistance via WhatsApp, phone, or email.",
  },
];

const services = [
  { icon: Car, title: "Airport Transfers", desc: "Private pickup & drop-off" },
  { icon: Plane, title: "Flight Booking", desc: "Best deals on flights" },
  { icon: FileText, title: "Visa Assistance", desc: "UAE visa processing" },
  { icon: Map, title: "Tours & Activities", desc: "Desert safaris & more" },
];

const testimonials = [
  {
    name: "Sarah & Family",
    location: "London, UK",
    text: "Fairy Star made our Dubai vacation completely hassle-free. The apartment was spotless and the coordinator helped us with everything!",
    rating: 5,
  },
  {
    name: "Ahmed R.",
    location: "Cairo, Egypt",
    text: "Best experience for my medical travel. They coordinated everything from visa to transportation to a recovery-friendly apartment.",
    rating: 5,
  },
  {
    name: "Corporate Client",
    location: "Singapore",
    text: "We book all our employee relocations through Fairy Star. Reliable, professional, and great value for long-term stays.",
    rating: 5,
  },
];

const stats = [
  { number: "500+", label: "Happy Guests" },
  { number: "50+", label: "Verified Properties" },
  { number: "3", label: "UAE Cities" },
  { number: "24/7", label: "Support" },
];

const uaeCities = [
  {
    name: "Dubai",
    stays: 30,
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
  },
  {
    name: "Sharjah",
    stays: 12,
    image:
      "https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=600&q=80",
  },
  {
    name: "Ras Al Khaimah",
    stays: 8,
    image:
      "https://images.unsplash.com/photo-1597656303066-85eb659aeb29?w=600&q=80",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.05]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios.post(`${API}/seed`);
        const res = await axios.get(`${API}/properties?featured=true`);
        setFeaturedProperties(res.data.slice(0, 3));
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div data-testid="home-page">
      {/* ========== HERO ========== */}
      <section className="hero-section relative" data-testid="hero-section">
        {/* Parallax Background */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ scale: heroScale }}
        >
          {heroImages.map((img, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ${heroIndex === i ? "opacity-100" : "opacity-0"}`}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#333D47]/50 via-[#333D47]/60 to-[#333D47]" />
        </motion.div>

        {/* Decorative Orbs */}
        <div className="orb orb-orange w-[500px] h-[500px] -top-20 -right-20 z-[1] hidden lg:block" />
        <div className="orb orb-white w-[300px] h-[300px] bottom-40 left-10 z-[1] hidden lg:block" />

        {/* 3D Elements */}
        <Hero3D />

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 pt-32 sm:pt-40 pb-20 min-h-screen flex flex-col justify-center"
        >
          <motion.div initial="hidden" animate="visible" className="max-w-3xl">
            <motion.span
              variants={fadeUp}
              custom={0}
              className="inline-block px-4 py-2 rounded-full liquid-glass text-white/80 text-xs sm:text-sm font-medium mb-6 tracking-wide uppercase"
            >
              Your Complete Stay & Travel Partner in the UAE
            </motion.span>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1] mb-6 tracking-tight"
            >
              Stay Better.
              <br />
              <span className="gradient-text font-medium">Travel Easier.</span>
              <br />
              Feel Supported.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-base sm:text-lg text-white/60 mb-10 max-w-xl leading-relaxed font-light"
            >
              Short stays, managed rentals, and end-to-end travel services with
              a personal coordinator.{" "}
              <span className="text-[#F3A15A]">
                One partner. One coordinator. Zero hassle.
              </span>
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col xs:flex-row gap-4"
            >
              <Link to="/stays">
                <LiquidButton size="lg" data-testid="hero-find-stay-btn">
                  Find a Stay <ArrowRight size={18} />
                </LiquidButton>
              </Link>
              <a href="#plan-your-stay">
                <LiquidButton
                  variant="glass"
                  size="lg"
                  data-testid="hero-plan-trip-btn"
                >
                  Plan My Trip
                </LiquidButton>
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-xs uppercase tracking-[0.3em]">
            Scroll
          </span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </motion.div>
      </section>

      {/* ========== STATS ========== */}
      <section className="py-20 sm:py-28 bg-[#333D47] relative">
        <div className="section-divider absolute top-0 left-0 right-0" />
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <StatsCounter stats={stats} />
        </div>
      </section>

      {/* ========== PLAN YOUR STAY ========== */}
      <section
        id="plan-your-stay"
        className="py-20 sm:py-28 bg-[#2D3139]"
        data-testid="plan-stay-section"
      >
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
            >
              Personalized Planning
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 tracking-tight"
            >
              Plan Your Stay
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/50 text-lg font-light"
            >
              Tell us about your trip and get personalized options within 24
              hours
            </motion.p>
          </motion.div>
          <PlanYourStayWizard />
        </div>
      </section>

      {/* ========== FEATURED PROPERTIES ========== */}
      <section
        className="py-20 sm:py-28 bg-[#333D47]"
        data-testid="featured-properties-section"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-14"
          >
            <div>
              <motion.p
                variants={fadeUp}
                custom={0}
                className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
              >
                Handpicked Collection
              </motion.p>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight"
              >
                Featured Stays
              </motion.h2>
            </div>
            <motion.div variants={fadeUp} custom={2}>
              <Link
                to="/stays"
                className="group flex items-center gap-2 text-white/60 hover:text-[#F3A15A] transition-colors text-sm"
              >
                View All Stays{" "}
                <ChevronRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </motion.div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-shimmer h-[400px] rounded-2xl"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property, i) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.15,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ========== WHY FAIRY STAR ========== */}
      <section
        className="py-20 sm:py-28 bg-[#2D3139]"
        data-testid="why-section"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
            >
              The Fairy Star Difference
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 tracking-tight"
            >
              Why Choose Us?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/50 text-lg max-w-2xl mx-auto font-light"
            >
              We're more than a booking platform. We're your complete stay and
              travel partner.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <GlassCard className="p-6 h-full">
                  <div className="w-12 h-12 rounded-xl bg-[#F3A15A]/10 flex items-center justify-center mb-5">
                    <feature.icon className="text-[#F3A15A]" size={22} />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SERVICES - EDITORIAL LAYOUT ========== */}
      <section
        className="py-20 sm:py-28 bg-[#333D47] overflow-hidden"
        data-testid="services-section"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.p
                variants={fadeUp}
                custom={0}
                className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
              >
                End-to-End Travel
              </motion.p>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 tracking-tight"
              >
                More Than Just a Stay
              </motion.h2>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-white/50 text-lg mb-10 leading-relaxed font-light"
              >
                From airport pickup to tours and visa assistance, we handle
                everything so you can focus on enjoying your trip.
              </motion.p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {services.map((service, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <GlassCard
                      hover={false}
                      className="flex items-start gap-3 p-4"
                    >
                      <div className="p-2 rounded-lg bg-[#F3A15A]/10 shrink-0">
                        <service.icon className="text-[#F3A15A]" size={18} />
                      </div>
                      <div>
                        <h4 className="font-heading font-medium text-white text-sm">
                          {service.title}
                        </h4>
                        <p className="text-white/40 text-xs mt-0.5">
                          {service.desc}
                        </p>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              <Link to="/services">
                <LiquidButton data-testid="view-services-btn">
                  View All Services <ArrowRight size={16} />
                </LiquidButton>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1691845164135-f7dc89ae38d7?w=800&q=80"
                  alt="Luxury concierge service"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#333D47]/80 via-transparent to-transparent" />
              </div>
              {/* Floating glass stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -left-6 md:left-6 liquid-glass-strong rounded-xl p-5"
              >
                <p className="text-[#F3A15A] font-heading text-3xl font-light">
                  100%
                </p>
                <p className="text-white/60 text-sm">Coordinated Service</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========== DESTINATIONS ========== */}
      <section
        className="py-20 sm:py-28 bg-[#2D3139]"
        data-testid="locations-section"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
            >
              Our Destinations
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 tracking-tight"
            >
              Where We Operate
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-white/50 text-lg font-light"
            >
              Premium stays across the UAE's most sought-after destinations
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {uaeCities.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link
                  to={`/stays?city=${city.name}`}
                  data-testid={`destination-${city.name.toLowerCase().replace(/ /g, "-")}`}
                >
                  <div className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A202C]/90 via-[#1A202C]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="liquid-glass rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-heading text-xl font-medium text-white">
                              {city.name}
                            </h3>
                            <p className="text-[#F3A15A] text-sm">
                              {city.stays}+ verified stays
                            </p>
                          </div>
                          <ChevronRight
                            className="text-white/40 group-hover:text-[#F3A15A] group-hover:translate-x-1 transition-all"
                            size={20}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section
        className="py-20 sm:py-28 bg-[#333D47]"
        data-testid="testimonials-section"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-[#F3A15A] text-sm uppercase tracking-[0.2em] mb-4 font-medium"
            >
              Guest Experiences
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 tracking-tight"
            >
              What Our Guests Say
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <GlassCard className="p-6 h-full flex flex-col">
                  <Quote className="text-[#F3A15A]/20 mb-4" size={32} />
                  <p className="text-white/70 text-sm leading-relaxed mb-6 flex-1">
                    {t.text}
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="text-[#F3A15A] fill-[#F3A15A]"
                        size={14}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                    <div className="w-10 h-10 rounded-full bg-[#F3A15A]/10 flex items-center justify-center">
                      <span className="text-[#F3A15A] font-heading font-medium text-sm">
                        {t.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{t.name}</p>
                      <p className="text-white/40 text-xs">{t.location}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section
        className="py-24 sm:py-32 bg-[#2D3139] relative overflow-hidden"
        data-testid="cta-section"
      >
        <div className="orb orb-orange w-[400px] h-[400px] -top-40 left-1/4 hidden lg:block" />
        <div className="orb orb-white w-[300px] h-[300px] -bottom-20 right-1/4 hidden lg:block" />
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="font-heading text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 tracking-tight"
            >
              Ready to Experience the UAE?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-white/50 text-lg mb-10 font-light"
            >
              Let us handle everything. From finding the perfect stay to
              coordinating your entire trip.
            </motion.p>
            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link to="/stays">
                <LiquidButton size="xl" data-testid="cta-find-stay-btn">
                  Find a Stay
                </LiquidButton>
              </Link>
              <Link to="/contact">
                <LiquidButton
                  variant="glass"
                  size="xl"
                  data-testid="cta-contact-btn"
                >
                  Talk to a Coordinator
                </LiquidButton>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
