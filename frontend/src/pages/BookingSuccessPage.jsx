import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Phone,
  MessageCircle,
} from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;

export default function BookingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("loading");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    const pollStatus = async (sid, attempts = 0) => {
      if (attempts >= 10) {
        setStatus("timeout");
        return;
      }
      try {
        const res = await axios.get(`${API}/payments/status/${sid}`);
        setPaymentInfo(res.data);
        if (res.data.booking) setBooking(res.data.booking);
        if (res.data.payment_status === "paid") {
          setStatus("success");
          return;
        } else if (res.data.status === "expired") {
          setStatus("failed");
          return;
        }
        setTimeout(() => pollStatus(sid, attempts + 1), 1500);
      } catch (err) {
        if (attempts >= 3) setStatus("error");
        else setTimeout(() => pollStatus(sid, attempts + 1), 1500);
      }
    };
    pollStatus(sessionId);
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div
        className="min-h-screen bg-[#333D47] pt-24 flex items-center justify-center"
        data-testid="payment-loading"
      >
        <div className="text-center">
          <Loader2
            className="animate-spin text-[#F3A15A] mx-auto mb-4"
            size={40}
          />
          <p className="text-white font-heading text-lg font-light">
            Confirming your payment...
          </p>
          <p className="text-white/30 text-sm mt-2">
            This may take a few seconds
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    const amountPaid = paymentInfo?.amount
      ? paymentInfo.amount / 100
      : booking?.payment_type === "deposit"
        ? booking?.deposit_amount
        : booking?.total_amount;
    return (
      <div
        className="min-h-screen bg-[#333D47] pt-24"
        data-testid="payment-success"
      >
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#F3A15A]/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="text-[#F3A15A]" size={36} />
            </div>
            <h1
              className="font-heading text-2xl sm:text-3xl font-light text-white mb-2 tracking-tight"
              data-testid="booking-confirmed-title"
            >
              Booking Confirmed!
            </h1>
            <p className="text-white/50 text-sm">
              Your reservation has been successfully processed
            </p>
          </div>

          {booking && (
            <GlassCard
              variant="solid"
              hover={false}
              className="overflow-hidden mb-6"
              data-testid="booking-details-card"
            >
              <div className="p-6 border-b border-white/[0.06]">
                <h2
                  className="font-heading text-lg font-medium text-white mb-4"
                  data-testid="property-title"
                >
                  {booking.property_title}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    {
                      icon: Calendar,
                      label: "Check-in",
                      value: booking.check_in,
                      tid: "check-in-date",
                    },
                    {
                      icon: Calendar,
                      label: "Check-out",
                      value: booking.check_out,
                      tid: "check-out-date",
                    },
                    {
                      icon: Users,
                      label: "Guests",
                      value: `${booking.guests} Guest${booking.guests > 1 ? "s" : ""}`,
                      tid: "guests-count",
                    },
                    {
                      icon: Calendar,
                      label: "Duration",
                      value: `${booking.nights} Night${booking.nights > 1 ? "s" : ""}`,
                      tid: "nights-count",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#F3A15A]/10">
                        <item.icon className="text-[#F3A15A]" size={16} />
                      </div>
                      <div>
                        <p className="text-white/30 text-xs">{item.label}</p>
                        <p
                          className="text-white font-medium"
                          data-testid={item.tid}
                        >
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="p-6 border-b border-white/[0.06] text-sm"
                data-testid="price-breakdown"
              >
                <h3 className="font-heading text-base font-medium text-white mb-4">
                  Price Breakdown
                </h3>
                <div className="space-y-2">
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
                  <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-white font-medium">Total</span>
                    <span
                      className="text-[#F3A15A] font-medium"
                      data-testid="total-amount"
                    >
                      AED {booking.total_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="p-6 bg-[#F3A15A]/[0.04]"
                data-testid="payment-info"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {booking.payment_type === "deposit"
                        ? "Deposit Paid (30%)"
                        : "Full Payment"}
                    </p>
                    {booking.payment_type === "deposit" && (
                      <p className="text-white/30 text-xs">
                        Remaining AED{" "}
                        {(
                          booking.total_amount - booking.deposit_amount
                        )?.toLocaleString()}{" "}
                        due at check-in
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className="text-[#F3A15A] font-heading text-2xl font-light"
                      data-testid="amount-paid"
                    >
                      AED {amountPaid?.toLocaleString()}
                    </p>
                    <p className="text-green-400 text-xs font-medium">Paid</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard
            variant="highlight"
            hover={false}
            className="p-5 mb-6"
            data-testid="coordinator-message"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-[#F3A15A]/15">
                <Phone className="text-[#F3A15A]" size={20} />
              </div>
              <div>
                <h3 className="font-heading text-sm font-medium text-white mb-1">
                  Your Coordinator Will Contact You
                </h3>
                <p className="text-white/50 text-xs leading-relaxed">
                  A dedicated Fairy Star coordinator will reach out within 24
                  hours to confirm booking details and assist with special
                  requests.
                </p>
              </div>
            </div>
          </GlassCard>

          {booking && (
            <GlassCard
              hover={false}
              className="p-5 mb-6"
              data-testid="guest-details"
            >
              <h3 className="font-heading text-sm font-medium text-white mb-3">
                Guest Details
              </h3>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-white/30">Name</p>
                  <p className="text-white font-medium">{booking.guest_name}</p>
                </div>
                <div>
                  <p className="text-white/30">Email</p>
                  <p className="text-white font-medium">
                    {booking.guest_email}
                  </p>
                </div>
                <div>
                  <p className="text-white/30">Phone</p>
                  <p className="text-white font-medium">
                    {booking.guest_phone}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/">
              <LiquidButton variant="glass" data-testid="go-home-btn">
                Go Home
              </LiquidButton>
            </Link>
            <a
              href="https://wa.me/971506603525"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LiquidButton data-testid="whatsapp-btn">
                <MessageCircle size={16} /> Chat on WhatsApp
              </LiquidButton>
            </a>
          </div>
          <p className="text-white/25 text-xs text-center mt-6">
            A confirmation email has been sent to{" "}
            {booking?.guest_email || "your email"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#333D47] pt-24"
      data-testid="payment-failed"
    >
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-red-500" size={36} />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-light text-white mb-4 tracking-tight">
          {status === "timeout"
            ? "Payment Verification Timeout"
            : "Payment Issue"}
        </h1>
        <p className="text-white/50 mb-8 text-sm">
          {status === "timeout"
            ? "We're still processing your payment. Please check your email."
            : "We couldn't confirm your payment. Please try again."}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/stays">
            <LiquidButton variant="glass" data-testid="browse-stays-btn">
              Browse Stays
            </LiquidButton>
          </Link>
          <a
            href="https://wa.me/971506603525"
            target="_blank"
            rel="noopener noreferrer"
          >
            <LiquidButton data-testid="contact-support-btn">
              Contact Support
            </LiquidButton>
          </a>
        </div>
      </div>
    </div>
  );
}
