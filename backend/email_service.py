"""
Fairy Star Vacation Homes - Email Service Module
Handles all transactional emails via Resend API
"""

import os
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import resend

logger = logging.getLogger(__name__)

# Email configuration from environment
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM = os.environ.get("RESEND_FROM", "Fairy Star <noreply@fairystar.ae>")
RESEND_REPLY_TO = os.environ.get("RESEND_REPLY_TO", "support@fairystar.ae")
RESEND_TEST_RECIPIENTS = os.environ.get("RESEND_TEST_RECIPIENTS", "").split(",")
RESEND_ENABLED = os.environ.get("RESEND_ENABLED", "false").lower() == "true"

# Initialize Resend
if RESEND_API_KEY and RESEND_API_KEY != "re_placeholder_add_your_key_here":
    resend.api_key = RESEND_API_KEY

# Email templates
def get_base_template(content: str, title: str = "Fairy Star Vacation Homes") -> str:
    """Base HTML email template with Fairy Star branding"""
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #333D47; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #333D47;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #3D4852; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F3A15A 0%, #E8935A 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #333D47; font-size: 28px; font-weight: bold;">FAIRY<span style="color: white;">ST</span><span style="color: #333D47;">AR</span></h1>
                            <p style="margin: 5px 0 0; color: #333D47; font-size: 12px; letter-spacing: 1px;">VACATION HOMES</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            {content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2D3748; padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                            <p style="margin: 0 0 10px; color: rgba(255,255,255,0.6); font-size: 14px;">
                                Need help? Contact us anytime
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <a href="https://wa.me/971506603525" style="display: inline-block; background-color: #25D366; color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-size: 14px;">WhatsApp</a>
                                    </td>
                                    <td style="padding: 0 10px;">
                                        <a href="tel:+971506603525" style="display: inline-block; background-color: rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-size: 14px;">Call Us</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 20px 0 0; color: rgba(255,255,255,0.4); font-size: 12px;">
                                © 2025 Fairy Star Vacation Homes. All rights reserved.<br>
                                Dubai, United Arab Emirates
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def booking_confirmation_template(booking: Dict[str, Any]) -> str:
    """Email template for booking confirmation"""
    add_ons_html = ""
    if booking.get("add_ons") and len(booking["add_ons"]) > 0:
        add_ons_items = "".join([
            f'<tr><td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 14px;">{addon.get("name", "")}</td><td style="padding: 8px 0; color: white; font-size: 14px; text-align: right;">AED {addon.get("price", 0):,.0f}</td></tr>'
            for addon in booking["add_ons"]
        ])
        add_ons_html = f"""
        <tr>
            <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Add-ons</td>
            <td style="padding: 8px 0; color: white; font-size: 14px; text-align: right;">AED {booking.get('add_ons_total', 0):,.0f}</td>
        </tr>
        """
    
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background-color: rgba(243,161,90,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">✓</span>
        </div>
        <h2 style="margin: 0; color: white; font-size: 24px;">Booking Confirmed!</h2>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.6); font-size: 16px;">Your reservation has been successfully processed</p>
    </div>
    
    <!-- Booking Reference -->
    <div style="background-color: rgba(243,161,90,0.1); border: 1px solid rgba(243,161,90,0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Booking Reference</p>
        <p style="margin: 5px 0 0; color: #F3A15A; font-size: 20px; font-weight: bold; font-family: monospace;">{booking.get('id', '')[:8].upper()}</p>
    </div>
    
    <!-- Property Details -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px; color: #F3A15A; font-size: 18px;">{booking.get('property_title', 'Property')}</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td width="50%" style="padding: 8px 0;">
                    <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">CHECK-IN</p>
                    <p style="margin: 4px 0 0; color: white; font-size: 16px; font-weight: bold;">{booking.get('check_in', '')}</p>
                </td>
                <td width="50%" style="padding: 8px 0;">
                    <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">CHECK-OUT</p>
                    <p style="margin: 4px 0 0; color: white; font-size: 16px; font-weight: bold;">{booking.get('check_out', '')}</p>
                </td>
            </tr>
            <tr>
                <td width="50%" style="padding: 8px 0;">
                    <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">GUESTS</p>
                    <p style="margin: 4px 0 0; color: white; font-size: 16px;">{booking.get('guests', 0)} Guest{'s' if booking.get('guests', 0) > 1 else ''}</p>
                </td>
                <td width="50%" style="padding: 8px 0;">
                    <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px;">NIGHTS</p>
                    <p style="margin: 4px 0 0; color: white; font-size: 16px;">{booking.get('nights', 0)} Night{'s' if booking.get('nights', 0) > 1 else ''}</p>
                </td>
            </tr>
        </table>
    </div>
    
    <!-- Price Breakdown -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Price Breakdown</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Base price ({booking.get('nights', 0)} nights)</td>
                <td style="padding: 8px 0; color: white; font-size: 14px; text-align: right;">AED {booking.get('base_price', 0):,.0f}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Cleaning fee</td>
                <td style="padding: 8px 0; color: white; font-size: 14px; text-align: right;">AED {booking.get('cleaning_fee', 0):,.0f}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Service fee</td>
                <td style="padding: 8px 0; color: white; font-size: 14px; text-align: right;">AED {booking.get('service_fee', 0):,.0f}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Taxes</td>
                <td style="padding: 8px 0; color: white; font-size: 14px; text-align: right;">AED {booking.get('taxes', 0):,.0f}</td>
            </tr>
            {add_ons_html}
            <tr>
                <td colspan="2" style="padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);"></td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: white; font-size: 16px; font-weight: bold;">Total</td>
                <td style="padding: 8px 0; color: #F3A15A; font-size: 20px; font-weight: bold; text-align: right;">AED {booking.get('total_amount', 0):,.0f}</td>
            </tr>
        </table>
    </div>
    
    <!-- Payment Status -->
    <div style="background-color: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td>
                    <p style="margin: 0; color: white; font-size: 16px; font-weight: bold;">
                        {'Deposit Paid (30%)' if booking.get('payment_type') == 'deposit' else 'Full Payment'}
                    </p>
                    {'<p style="margin: 5px 0 0; color: rgba(255,255,255,0.6); font-size: 14px;">Remaining AED ' + f"{(booking.get('total_amount', 0) - booking.get('deposit_amount', 0)):,.0f}" + ' due at check-in</p>' if booking.get('payment_type') == 'deposit' else ''}
                </td>
                <td style="text-align: right;">
                    <p style="margin: 0; color: #22C55E; font-size: 24px; font-weight: bold;">
                        AED {(booking.get('deposit_amount', 0) if booking.get('payment_type') == 'deposit' else booking.get('total_amount', 0)):,.0f}
                    </p>
                    <p style="margin: 5px 0 0; color: #22C55E; font-size: 14px;">✓ Paid</p>
                </td>
            </tr>
        </table>
    </div>
    
    <!-- Coordinator Message -->
    <div style="background: linear-gradient(135deg, rgba(243,161,90,0.2) 0%, rgba(243,161,90,0.05) 100%); border: 1px solid rgba(243,161,90,0.3); border-radius: 12px; padding: 25px; text-align: center;">
        <p style="margin: 0; font-size: 36px;">📞</p>
        <h3 style="margin: 15px 0 10px; color: white; font-size: 18px;">Your Personal Coordinator Will Contact You</h3>
        <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;">
            A dedicated Fairy Star coordinator will reach out within 24 hours to confirm your booking details, 
            provide check-in instructions, and assist with any special requests or add-on services.
        </p>
    </div>
    """
    return get_base_template(content, "Booking Confirmed - Fairy Star")


def coordinator_assigned_template(booking: Dict[str, Any], coordinator: Dict[str, Any]) -> str:
    """Email template for coordinator assignment notification"""
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background-color: rgba(243,161,90,0.2); border-radius: 50%; margin: 0 auto 20px;">
            <span style="font-size: 40px; line-height: 80px;">👤</span>
        </div>
        <h2 style="margin: 0; color: white; font-size: 24px;">Your Coordinator Has Been Assigned</h2>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.6); font-size: 16px;">Great news! Your personal coordinator is ready to assist you.</p>
    </div>
    
    <!-- Coordinator Details -->
    <div style="background-color: rgba(243,161,90,0.1); border: 1px solid rgba(243,161,90,0.3); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
        <h3 style="margin: 0 0 5px; color: #F3A15A; font-size: 22px;">{coordinator.get('name', 'Your Coordinator')}</h3>
        <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px;">Personal Coordinator</p>
        <div style="margin-top: 20px;">
            <a href="mailto:{coordinator.get('email', '')}" style="display: inline-block; background-color: rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-size: 14px; margin: 5px;">{coordinator.get('email', '')}</a>
            <a href="tel:{coordinator.get('phone', '')}" style="display: inline-block; background-color: rgba(255,255,255,0.1); color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-size: 14px; margin: 5px;">{coordinator.get('phone', '')}</a>
        </div>
    </div>
    
    <!-- Booking Reference -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Your Booking</h3>
        <p style="margin: 0 0 10px; color: #F3A15A; font-size: 18px; font-weight: bold;">{booking.get('property_title', '')}</p>
        <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px;">
            {booking.get('check_in', '')} → {booking.get('check_out', '')} · {booking.get('guests', 0)} Guest{'s' if booking.get('guests', 0) > 1 else ''}
        </p>
        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.4); font-size: 12px; font-family: monospace;">
            Ref: {booking.get('id', '')[:8].upper()}
        </p>
    </div>
    
    <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 14px; text-align: center; line-height: 1.6;">
        {coordinator.get('name', 'Your coordinator')} will be reaching out shortly to assist with check-in details, 
        local recommendations, and any additional services you may need during your stay.
    </p>
    """
    return get_base_template(content, "Coordinator Assigned - Fairy Star")


def new_booking_alert_template(booking: Dict[str, Any]) -> str:
    """Email template for admin new booking alert"""
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background-color: rgba(34,197,94,0.2); border-radius: 50%; margin: 0 auto 20px;">
            <span style="font-size: 40px; line-height: 80px;">💰</span>
        </div>
        <h2 style="margin: 0; color: white; font-size: 24px;">New Booking Received!</h2>
        <p style="margin: 10px 0 0; color: #22C55E; font-size: 20px; font-weight: bold;">AED {booking.get('total_amount', 0):,.0f}</p>
    </div>
    
    <!-- Guest Info -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Guest Information</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Name:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{booking.get('guest_name', '')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Email:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{booking.get('guest_email', '')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Phone:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{booking.get('guest_phone', '')}</td>
            </tr>
        </table>
    </div>
    
    <!-- Booking Details -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Booking Details</h3>
        <p style="margin: 0 0 10px; color: #F3A15A; font-size: 18px; font-weight: bold;">{booking.get('property_title', '')}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Dates:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{booking.get('check_in', '')} → {booking.get('check_out', '')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Guests:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{booking.get('guests', 0)}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Nights:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{booking.get('nights', 0)}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Payment:</td>
                <td style="padding: 5px 0; color: #22C55E; font-size: 14px; font-weight: bold;">{'Deposit 30%' if booking.get('payment_type') == 'deposit' else 'Full'} - PAID</td>
            </tr>
        </table>
    </div>
    
    <!-- Action Required -->
    <div style="background-color: rgba(243,161,90,0.1); border: 1px solid rgba(243,161,90,0.3); border-radius: 12px; padding: 20px; text-align: center;">
        <p style="margin: 0 0 15px; color: white; font-size: 16px; font-weight: bold;">⚠️ Action Required</p>
        <p style="margin: 0 0 15px; color: rgba(255,255,255,0.7); font-size: 14px;">Please assign a coordinator to this booking in the Backoffice.</p>
        <a href="#" style="display: inline-block; background-color: #F3A15A; color: #333D47; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-size: 14px; font-weight: bold;">View in Backoffice</a>
    </div>
    
    <p style="margin: 20px 0 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; font-family: monospace;">
        Booking ID: {booking.get('id', '')}
    </p>
    """
    return get_base_template(content, "New Booking Alert - Fairy Star")


def new_lead_alert_template(lead: Dict[str, Any]) -> str:
    """Email template for admin new lead alert"""
    lead_type_colors = {
        "guest": "#22C55E",
        "corporate": "#3B82F6",
        "medical": "#A855F7",
        "property_owner": "#F3A15A"
    }
    color = lead_type_colors.get(lead.get("lead_type", "guest"), "#22C55E")
    
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background-color: rgba(59,130,246,0.2); border-radius: 50%; margin: 0 auto 20px;">
            <span style="font-size: 40px; line-height: 80px;">📋</span>
        </div>
        <h2 style="margin: 0; color: white; font-size: 24px;">New Lead Received!</h2>
        <span style="display: inline-block; margin-top: 10px; background-color: {color}20; color: {color}; padding: 5px 15px; border-radius: 15px; font-size: 14px; text-transform: capitalize;">{lead.get('lead_type', 'guest')}</span>
    </div>
    
    <!-- Contact Info -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Contact Information</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Name:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px; font-weight: bold;">{lead.get('name', '')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Email:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{lead.get('email', '')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Phone:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{lead.get('phone', '')}</td>
            </tr>
            {f'<tr><td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">City:</td><td style="padding: 5px 0; color: white; font-size: 14px;">{lead.get("city", "")}</td></tr>' if lead.get("city") else ''}
        </table>
    </div>
    
    <!-- Inquiry Details -->
    {f'''<div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Inquiry Details</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            {f'<tr><td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Dates:</td><td style="padding: 5px 0; color: white; font-size: 14px;">{lead.get("check_in", "")} - {lead.get("check_out", "")}</td></tr>' if lead.get("check_in") else ''}
            {f'<tr><td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Guests:</td><td style="padding: 5px 0; color: white; font-size: 14px;">{lead.get("guests", "")}</td></tr>' if lead.get("guests") else ''}
            {f'<tr><td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Purpose:</td><td style="padding: 5px 0; color: white; font-size: 14px;">{lead.get("purpose", "")}</td></tr>' if lead.get("purpose") else ''}
        </table>
    </div>''' if lead.get("check_in") or lead.get("guests") or lead.get("purpose") else ''}
    
    <!-- Message -->
    {f'''<div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Message</h3>
        <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 14px; line-height: 1.6;">{lead.get("message", "")}</p>
    </div>''' if lead.get("message") else ''}
    
    <!-- Action -->
    <div style="text-align: center;">
        <a href="#" style="display: inline-block; background-color: #F3A15A; color: #333D47; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-size: 14px; font-weight: bold;">View in Backoffice</a>
    </div>
    
    <p style="margin: 20px 0 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; font-family: monospace;">
        Lead ID: {lead.get('id', '')}
    </p>
    """
    return get_base_template(content, "New Lead Alert - Fairy Star")


def service_request_alert_template(request: Dict[str, Any]) -> str:
    """Email template for admin service request alert"""
    content = f"""
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 80px; height: 80px; background-color: rgba(168,85,247,0.2); border-radius: 50%; margin: 0 auto 20px;">
            <span style="font-size: 40px; line-height: 80px;">🎫</span>
        </div>
        <h2 style="margin: 0; color: white; font-size: 24px;">New Service Request</h2>
        <p style="margin: 10px 0 0; color: #A855F7; font-size: 18px; font-weight: bold; text-transform: capitalize;">{request.get('service_type', '').replace('_', ' ')}</p>
    </div>
    
    <!-- Service Details -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Service Details</h3>
        <p style="margin: 0 0 10px; color: #F3A15A; font-size: 18px; font-weight: bold;">{request.get('service_name', '')}</p>
        {f'<p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px;">{request.get("details", "")}</p>' if request.get("details") else ''}
    </div>
    
    <!-- Guest Info -->
    <div style="background-color: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px; color: white; font-size: 16px;">Guest Information</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Name:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{request.get('guest_name', '')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Email:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{request.get('guest_email', '')}</td>
            </tr>
            <tr>
                <td style="padding: 5px 0; color: rgba(255,255,255,0.6); font-size: 14px;">Phone:</td>
                <td style="padding: 5px 0; color: white; font-size: 14px;">{request.get('guest_phone', '')}</td>
            </tr>
        </table>
    </div>
    
    <!-- Action -->
    <div style="text-align: center;">
        <a href="#" style="display: inline-block; background-color: #F3A15A; color: #333D47; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-size: 14px; font-weight: bold;">View in Backoffice</a>
    </div>
    
    <p style="margin: 20px 0 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; font-family: monospace;">
        Request ID: {request.get('id', '')}
    </p>
    """
    return get_base_template(content, "Service Request Alert - Fairy Star")


class EmailService:
    """Email service for sending transactional emails via Resend"""
    
    def __init__(self, db):
        self.db = db
        self.enabled = RESEND_ENABLED
        self.test_mode = bool(RESEND_TEST_RECIPIENTS and RESEND_TEST_RECIPIENTS[0])
    
    def _get_recipients(self, to_email: str) -> list:
        """Get recipients - in test mode, use test recipients only"""
        if self.test_mode and RESEND_TEST_RECIPIENTS[0]:
            logger.info(f"Test mode: redirecting email from {to_email} to {RESEND_TEST_RECIPIENTS}")
            return [r.strip() for r in RESEND_TEST_RECIPIENTS if r.strip()]
        return [to_email]
    
    async def _send_email(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        """Internal method to send email via Resend"""
        if not self.enabled:
            logger.info(f"Email disabled: would send '{subject}' to {to_email}")
            return {"status": "disabled", "message": "Email sending is disabled"}
        
        if not RESEND_API_KEY or RESEND_API_KEY == "re_placeholder_add_your_key_here":
            logger.warning("Resend API key not configured")
            return {"status": "not_configured", "message": "Resend API key not configured"}
        
        try:
            recipients = self._get_recipients(to_email)
            params = {
                "from": RESEND_FROM,
                "to": recipients,
                "subject": subject,
                "html": html_content,
            }
            if RESEND_REPLY_TO:
                params["reply_to"] = RESEND_REPLY_TO
            
            # Run sync SDK in thread to keep async
            result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email sent: '{subject}' to {recipients}, id: {result.get('id')}")
            return {"status": "sent", "email_id": result.get("id"), "recipients": recipients}
        except Exception as e:
            logger.error(f"Failed to send email '{subject}' to {to_email}: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def _check_email_sent(self, collection: str, doc_id: str, email_type: str) -> bool:
        """Check if email was already sent (idempotency)"""
        doc = await self.db[collection].find_one({"id": doc_id}, {"_id": 0, "emails": 1})
        if doc and doc.get("emails", {}).get(email_type, {}).get("sent_at"):
            return True
        return False
    
    async def _mark_email_sent(self, collection: str, doc_id: str, email_type: str, result: Dict[str, Any]):
        """Mark email as sent in database"""
        await self.db[collection].update_one(
            {"id": doc_id},
            {"$set": {
                f"emails.{email_type}.sent_at": datetime.now(timezone.utc).isoformat(),
                f"emails.{email_type}.status": result.get("status"),
                f"emails.{email_type}.email_id": result.get("email_id"),
                f"emails.{email_type}.error": result.get("message") if result.get("status") == "error" else None
            }}
        )
    
    async def send_booking_confirmation(self, booking_id: str) -> Dict[str, Any]:
        """Send booking confirmation email to guest"""
        email_type = "booking_confirmation"
        
        # Idempotency check
        if await self._check_email_sent("bookings", booking_id, email_type):
            logger.info(f"Booking confirmation already sent for {booking_id}")
            return {"status": "already_sent", "booking_id": booking_id}
        
        # Get booking
        booking = await self.db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        
        # Generate and send email
        html = booking_confirmation_template(booking)
        result = await self._send_email(
            booking["guest_email"],
            f"Booking Confirmed - {booking['property_title']}",
            html
        )
        
        # Mark as sent
        await self._mark_email_sent("bookings", booking_id, email_type, result)
        return result
    
    async def send_new_booking_alert(self, booking_id: str) -> Dict[str, Any]:
        """Send new booking alert to admin/ops team"""
        email_type = "new_booking_alert"
        
        # Idempotency check
        if await self._check_email_sent("bookings", booking_id, email_type):
            logger.info(f"New booking alert already sent for {booking_id}")
            return {"status": "already_sent", "booking_id": booking_id}
        
        # Get booking
        booking = await self.db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        
        # Get admin email from settings or use default
        settings = await self.db.email_settings.find_one({"id": "default"}, {"_id": 0})
        admin_email = settings.get("admin_email", "admin@fairystar.ae") if settings else "admin@fairystar.ae"
        
        # Generate and send email
        html = new_booking_alert_template(booking)
        result = await self._send_email(
            admin_email,
            f"💰 New Booking: {booking['guest_name']} - AED {booking['total_amount']:,.0f}",
            html
        )
        
        # Mark as sent
        await self._mark_email_sent("bookings", booking_id, email_type, result)
        return result
    
    async def send_coordinator_assigned(self, booking_id: str) -> Dict[str, Any]:
        """Send coordinator assigned notification to guest"""
        email_type = "coordinator_assigned"
        
        # Idempotency check
        if await self._check_email_sent("bookings", booking_id, email_type):
            logger.info(f"Coordinator assigned email already sent for {booking_id}")
            return {"status": "already_sent", "booking_id": booking_id}
        
        # Get booking
        booking = await self.db.bookings.find_one({"id": booking_id}, {"_id": 0})
        if not booking:
            return {"status": "error", "message": "Booking not found"}
        
        if not booking.get("coordinator_id"):
            return {"status": "error", "message": "No coordinator assigned"}
        
        # Get coordinator
        coordinator = await self.db.coordinators.find_one({"id": booking["coordinator_id"]}, {"_id": 0})
        if not coordinator:
            return {"status": "error", "message": "Coordinator not found"}
        
        # Generate and send email
        html = coordinator_assigned_template(booking, coordinator)
        result = await self._send_email(
            booking["guest_email"],
            f"Your Coordinator Has Been Assigned - {coordinator['name']}",
            html
        )
        
        # Mark as sent
        await self._mark_email_sent("bookings", booking_id, email_type, result)
        return result
    
    async def send_new_lead_alert(self, lead_id: str) -> Dict[str, Any]:
        """Send new lead alert to admin/ops team"""
        email_type = "lead_alert"
        
        # Idempotency check
        if await self._check_email_sent("leads", lead_id, email_type):
            logger.info(f"Lead alert already sent for {lead_id}")
            return {"status": "already_sent", "lead_id": lead_id}
        
        # Get lead
        lead = await self.db.leads.find_one({"id": lead_id}, {"_id": 0})
        if not lead:
            return {"status": "error", "message": "Lead not found"}
        
        # Get admin email
        settings = await self.db.email_settings.find_one({"id": "default"}, {"_id": 0})
        admin_email = settings.get("admin_email", "admin@fairystar.ae") if settings else "admin@fairystar.ae"
        
        # Generate and send email
        html = new_lead_alert_template(lead)
        result = await self._send_email(
            admin_email,
            f"📋 New {lead['lead_type'].title()} Lead: {lead['name']}",
            html
        )
        
        # Mark as sent
        await self._mark_email_sent("leads", lead_id, email_type, result)
        return result
    
    async def send_service_request_alert(self, request_id: str) -> Dict[str, Any]:
        """Send service request alert to admin/ops team"""
        email_type = "service_alert"
        
        # Idempotency check
        if await self._check_email_sent("service_requests", request_id, email_type):
            logger.info(f"Service request alert already sent for {request_id}")
            return {"status": "already_sent", "request_id": request_id}
        
        # Get request
        request = await self.db.service_requests.find_one({"id": request_id}, {"_id": 0})
        if not request:
            return {"status": "error", "message": "Service request not found"}
        
        # Get admin email
        settings = await self.db.email_settings.find_one({"id": "default"}, {"_id": 0})
        admin_email = settings.get("admin_email", "admin@fairystar.ae") if settings else "admin@fairystar.ae"
        
        # Generate and send email
        html = service_request_alert_template(request)
        result = await self._send_email(
            admin_email,
            f"🎫 New Service Request: {request['service_name']}",
            html
        )
        
        # Mark as sent
        await self._mark_email_sent("service_requests", request_id, email_type, result)
        return result
