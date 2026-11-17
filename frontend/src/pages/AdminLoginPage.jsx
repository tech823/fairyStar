import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/ui/GlassCard";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://api.fairystar.ae"}/api/api`;
const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_dubai-getaway/artifacts/8x335zix_FairyStar%20logo%20white.png";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, formData);
      localStorage.setItem("admin_token", res.data.token);
      localStorage.setItem("admin_user", JSON.stringify(res.data.user));
      toast.success("Welcome back!");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#333D47] flex items-center justify-center px-6"
      data-testid="admin-login-page"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={LOGO_URL}
            alt="Fairy Star"
            className="h-12 w-auto mx-auto mb-6"
          />
          <h1 className="font-heading text-2xl font-light text-white tracking-tight">
            Admin Login
          </h1>
          <p className="text-white/40 mt-2 text-sm">Fairy Star Backoffice</p>
        </div>
        <GlassCard variant="solid" hover={false} className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="admin@fairystar.ae"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
                data-testid="admin-email-input"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-2 block uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30"
                data-testid="admin-password-input"
              />
            </div>
            <LiquidButton
              type="submit"
              disabled={loading}
              className="w-full justify-center py-4 text-base"
              data-testid="admin-login-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} /> Logging
                  in...
                </>
              ) : (
                <>
                  <Lock size={16} className="mr-2" /> Login
                </>
              )}
            </LiquidButton>
          </form>
          <p className="text-white/25 text-xs text-center mt-6">
            Default: admin@fairystar.ae / admin123
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
