# Fairy Star Vacation Homes - Product Requirements Document

## Product Overview
A complete, interactive, conversion-optimized business website and lightweight booking/payments web app for **Fairy Star Vacation Homes** - a UAE hospitality & travel service brand.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Shadcn/UI, Framer Motion, Lucide React, react-leaflet
- **Backend:** FastAPI, MongoDB (motor), Pydantic, JWT (roles), boto3, httpx
- **Payments:** Stripe
- **Email:** Resend (mocked)
- **Storage:** S3/R2 via boto3 (mocked)
- **Calendar:** react-day-picker
- **Maps:** Leaflet + react-leaflet (OpenStreetMap/CartoDB dark tiles)

## Design System (Liquid Glass Theme)
- **Primary:** #F3A15A (warm amber-orange)
- **Background:** #333D47 (ash grey), #2D3139 (deep grey)
- **Typography:** Outfit (headings), DM Sans (body)
- **Effects:** Liquid glass, floating orbs, shimmer animations

## Architecture
```
/app/
├── backend/
│   ├── server.py           # Main FastAPI app, all API routes
│   ├── email_service.py    # Resend email logic
│   ├── storage_service.py  # S3/R2 storage logic
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx              # Navbar + Footer
│   │   │   ├── PropertyCard.jsx        # Glass property cards
│   │   │   ├── PropertyMap.jsx         # Leaflet map with markers
│   │   │   ├── PlanYourStayWizard.jsx  # 5-step wizard
│   │   │   ├── Hero3D.jsx             # CSS floating orbs
│   │   │   └── ui/ (shadcn + custom)
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── StaysPage.jsx          # Grid/List/Map view toggle
│   │   │   ├── StayDetailPage.jsx
│   │   │   ├── CustomerJourneyPage.jsx # Interactive timeline
│   │   │   ├── ServicesPage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── ContactPage.jsx
│   │   │   ├── CorporatePage.jsx
│   │   │   ├── MedicalPage.jsx
│   │   │   ├── ListPropertyPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── BookingSuccessPage.jsx
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── AdminDashboard.jsx     # Thin layout/router
│   │   │   └── admin/
│   │   │       ├── adminUtils.js
│   │   │       ├── DashboardOverview.jsx
│   │   │       ├── PropertiesManagement.jsx
│   │   │       ├── PropertyForm.jsx   # + map_lat/map_lng fields
│   │   │       ├── BookingsManagement.jsx
│   │   │       ├── LeadsManagement.jsx
│   │   │       ├── CoordinatorsManagement.jsx
│   │   │       ├── ServicesManagement.jsx
│   │   │       ├── AvailabilityCalendar.jsx
│   │   │       └── SettingsPage.jsx   # + CRM Webhook section
│   │   └── index.css
│   └── .env
└── memory/
    └── PRD.md
```

## Completed Phases
- Phase 0: End-to-end booking flow with Stripe
- Phase 1: Production-grade Backoffice (Admin Panel)
- Phase 2: Transactional email notifications (Resend - MOCKED)
- Phase 3: Cloud media storage (S3/R2 - MOCKED)
- Phase 4: Availability Calendar UI
- Phase 5: Complete UI/UX Redesign (Dec 2025) — 28/28 + 30/30 tests
- Phase 6: Admin Dashboard Refactoring (Feb 2026) — 32/32 tests
- Phase 7: New Features (Feb 2026) — 9/9 backend + all UI tests
  - Map view toggle on Stays page (Leaflet/CartoDB dark tiles, orange markers, popups with property details)
  - Customer Journey interactive timeline page (/journey) with 6 animated steps
  - CRM Webhook integration in admin Settings (enable/disable, webhook URL, test button)
  - Property coordinate fields (map_lat/map_lng) in admin PropertyForm
  - 24 properties migrated with UAE area coordinates

## Backlog (Prioritized)

### P1
- **Production Enablement:** Enable real Resend & S3/R2 credentials
- **Analytics Integration:** GA4 event tracking

### P2
- Blog/Guides Page (user said to ignore for now)

## Credentials
- **Admin:** admin@fairystar.ae / admin123
- **URL:** /admin/login

## Mocked Integrations
- Resend: RESEND_ENABLED=false
- S3/R2: STORAGE_ENABLED=false

---
*Last Updated: February 2026*
