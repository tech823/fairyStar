import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { Link } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    const loadBooking = async () => {
      try {
        const res = await axios.get(`${API}/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        console.error("Error fetching booking:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [bookingId]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await axios.post(`${API}/payments/create-checkout`, null, {
        params: { booking_id: bookingId, origin_url: window.location.origin },
      });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#333D47] pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#F3A15A]" size={40} />
      </div>
    );

  if (!bookingId || !booking) {
    return (
      <div
        className="min-h-screen bg-[#333D47] pt-24"
        data-testid="checkout-cancel-page"
      >
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-light text-white mb-4 tracking-tight">
            Payment Cancelled
          </h1>
          <p className="text-white/50 mb-8 text-sm">
            Your payment was not completed. Your booking is still saved.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/stays">
              <LiquidButton variant="glass">
                <ArrowLeft size={16} /> Browse Stays
              </LiquidButton>
            </Link>
            <Link to="/">
              <LiquidButton>Go Home</LiquidButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const paymentAmount =
    booking.payment_type === "deposit"
      ? booking.deposit_amount
      : booking.total_amount;

  return (
    <div
      className="min-h-screen bg-[#333D47] pt-24"
      data-testid="checkout-page"
    >
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-heading text-2xl sm:text-3xl font-light text-white mb-8 tracking-tight">
          Complete Your Booking
        </h1>
        <GlassCard variant="solid" hover={false} className="p-6 mb-6">
          <h2 className="font-heading text-lg font-medium text-white mb-4">
            {booking.property_title}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">
                Check-in
              </p>
              <p className="text-white font-medium">{booking.check_in}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">
                Check-out
              </p>
              <p className="text-white font-medium">{booking.check_out}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">
                Guests
              </p>
              <p className="text-white font-medium">{booking.guests}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">
                Nights
              </p>
              <p className="text-white font-medium">{booking.nights}</p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-white/40">
              <span>Base price ({booking.nights} nights)</span>
              <span>AED {booking.base_price?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Cleaning fee</span>
              <span>AED {booking.cleaning_fee?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-white/40">
              <span>Service fee</span>
              <span>AED {booking.service_fee?.toLocaleString()}</span>
            </div>
            {booking.add_ons_total > 0 && (
              <div className="flex justify-between text-white/40">
                <span>Add-ons</span>
                <span>AED {booking.add_ons_total?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-medium pt-2 border-t border-white/[0.06]">
              <span>Total</span>
              <span className="text-[#F3A15A]">
                AED {booking.total_amount?.toLocaleString()}
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-medium text-sm">
                {booking.payment_type === "deposit"
                  ? "Deposit (30%)"
                  : "Full Payment"}
              </p>
              {booking.payment_type === "deposit" && (
                <p className="text-white/30 text-xs">
                  Remaining balance due at check-in
                </p>
              )}
            </div>
            <p className="text-[#F3A15A] font-heading text-2xl font-light">
              AED {paymentAmount?.toLocaleString()}
            </p>
          </div>
        </GlassCard>

        <LiquidButton
          onClick={handlePayment}
          disabled={processing}
          className="w-full justify-center py-4 text-base"
          data-testid="pay-now-btn"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={18} /> Redirecting...
            </>
          ) : (
            <>
              <CreditCard size={18} className="mr-2" /> Pay AED{" "}
              {paymentAmount?.toLocaleString()}
            </>
          )}
        </LiquidButton>
        <p className="text-white/25 text-xs text-center mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
}
