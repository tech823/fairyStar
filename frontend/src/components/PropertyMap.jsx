import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bed, Bath, Users, Star } from "lucide-react";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const orangeIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#F3A15A"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`),
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

export const PropertyMap = ({ properties }) => {
  const navigate = useNavigate();

  const mappable = useMemo(
    () => properties.filter((p) => p.map_lat && p.map_lng),
    [properties]
  );

  const center = useMemo(() => {
    if (mappable.length === 0) return [25.2048, 55.2708]; // Dubai center
    const avgLat = mappable.reduce((s, p) => s + p.map_lat, 0) / mappable.length;
    const avgLng = mappable.reduce((s, p) => s + p.map_lng, 0) / mappable.length;
    return [avgLat, avgLng];
  }, [mappable]);

  if (mappable.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white/[0.04] rounded-xl border border-white/[0.06]">
        <p className="text-white/40">No properties with coordinates to display on map.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06]" data-testid="property-map">
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: "550px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {mappable.map((property) => (
          <Marker
            key={property.id}
            position={[property.map_lat, property.map_lng]}
            icon={orangeIcon}
          >
            <Popup className="property-popup">
              <div
                className="cursor-pointer min-w-[220px]"
                onClick={() => navigate(`/stays/${property.slug || property.id}`)}
              >
                {property.images?.[0] && (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-28 object-cover rounded-t"
                  />
                )}
                <div className="p-2">
                  <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                    {property.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {property.area ? `${property.area}, ` : ""}{property.city}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                    <span className="flex items-center gap-1"><Bed size={12} /> {property.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {property.max_guests}</span>
                  </div>
                  <p className="text-sm font-bold text-[#F3A15A]">
                    AED {property.pricing?.nightly}/night
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
