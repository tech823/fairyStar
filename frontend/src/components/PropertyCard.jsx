import { Link } from "react-router-dom";
import { MapPin, Users, Bed, Bath, Star, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PropertyCard = ({ property }) => {
  const { id, title, city, bedrooms, bathrooms, max_guests, images, pricing, badges, is_featured } = property;

  return (
    <Link to={`/stays/${id}`} data-testid={`property-card-${id}`}>
      <div className="rounded-2xl overflow-hidden property-card group bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] hover:border-white/[0.12] transition-all duration-400">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={images?.[0] || "https://images.unsplash.com/photo-1638454795595-0a0abf68614d?w=800"}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {is_featured && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-[#F3A15A] text-[#1A202C] border-none font-semibold text-xs shadow-lg px-3 py-1">
                <Star size={11} className="mr-1 fill-current" /> Featured
              </Badge>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A202C]/80 via-transparent to-transparent opacity-60" />
          
          {/* Quick Price on hover */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="liquid-glass px-3 py-1.5 rounded-full">
              <span className="text-[#F3A15A] font-heading font-medium text-sm">
                AED {pricing?.nightly?.toLocaleString()}/night
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {badges?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {badges.slice(0, 3).map((badge, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/50 border border-white/[0.06] uppercase tracking-wider">
                  {badge}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-heading text-base font-medium text-white mb-1.5 line-clamp-1 group-hover:text-[#F3A15A] transition-colors duration-200">
            {title}
          </h3>

          <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
            <MapPin size={12} className="text-[#F3A15A] shrink-0" />
            <span className="truncate">{city}</span>
          </div>

          <div className="flex items-center gap-4 text-white/40 text-xs mb-4">
            <div className="flex items-center gap-1"><Bed size={13} /> {bedrooms} Bed{bedrooms !== 1 ? "s" : ""}</div>
            <div className="flex items-center gap-1"><Bath size={13} /> {bathrooms} Bath{bathrooms !== 1 ? "s" : ""}</div>
            <div className="flex items-center gap-1"><Users size={13} /> {max_guests}</div>
          </div>

          <div className="flex items-end justify-between pt-4 border-t border-white/[0.06]">
            <div>
              <span className="text-[#F3A15A] font-heading text-xl font-medium">
                AED {pricing?.nightly?.toLocaleString()}
              </span>
              <span className="text-white/30 text-xs"> /night</span>
              <div className="text-white/30 text-[10px] mt-0.5">
                AED {pricing?.monthly?.toLocaleString()} /month
              </div>
            </div>
            <button 
              className="p-2 rounded-full bg-white/[0.04] text-white/40 hover:bg-[#F3A15A]/10 hover:text-[#F3A15A] transition-all duration-200"
              onClick={(e) => { e.preventDefault(); window.open("https://wa.me/971506603525", "_blank"); }}
              data-testid={`contact-property-${id}`}
            >
              <MessageCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
