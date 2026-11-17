import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import StaysPage from "@/pages/StaysPage";
import StayDetailPage from "@/pages/StayDetailPage";
import ServicesPage from "@/pages/ServicesPage";
import CorporatePage from "@/pages/CorporatePage";
import MedicalPage from "@/pages/MedicalPage";
import ListPropertyPage from "@/pages/ListPropertyPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import CheckoutPage from "@/pages/CheckoutPage";
import BookingSuccessPage from "@/pages/BookingSuccessPage";
import CustomerJourneyPage from "@/pages/CustomerJourneyPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import Layout from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";

function App() {
  return (
    <div className="min-h-screen bg-[#333D47]">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/stays" element={<StaysPage />} />
            <Route path="/stays/:id" element={<StayDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/corporate" element={<CorporatePage />} />
            <Route path="/medical" element={<MedicalPage />} />
            <Route path="/list-property" element={<ListPropertyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/journey" element={<CustomerJourneyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/checkout/:bookingId" element={<CheckoutPage />} />
            <Route path="/booking/success" element={<BookingSuccessPage />} />
            <Route path="/booking/cancel" element={<CheckoutPage />} />
          </Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
