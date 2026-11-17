import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, HardDrive, Webhook, Send } from "lucide-react";
import { API, getAuthHeaders } from "./adminUtils";
import axios from "axios";

export const SettingsPage = () => {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [emailSettings, setEmailSettings] = useState(null);
  const [storageConfig, setStorageConfig] = useState(null);
  const [crmSettings, setCrmSettings] = useState(null);
  const [testingCrm, setTestingCrm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "operations" });
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testingStorage, setTestingStorage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, logsRes, emailRes, configRes, crmRes] = await Promise.all([
        axios.get(`${API}/admin/users`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/audit-logs?limit=50`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/email/settings`, { headers: getAuthHeaders() }),
        axios.get(`${API}/health/config`),
        axios.get(`${API}/admin/crm/settings`, { headers: getAuthHeaders() })
      ]);
      setUsers(usersRes.data);
      setAuditLogs(logsRes.data);
      setEmailSettings(emailRes.data);
      setStorageConfig(configRes.data);
      setCrmSettings(crmRes.data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testStorage = async () => {
    setTestingStorage(true);
    try {
      const res = await axios.post(`${API}/admin/storage/test`, null, { headers: getAuthHeaders() });
      if (res.data.status === "success") {
        toast.success(res.data.message);
      } else if (res.data.status === "disabled") {
        toast.warning(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Storage test failed");
    } finally {
      setTestingStorage(false);
    }
  };

  const createUser = async () => {
    try {
      await axios.post(`${API}/auth/register`, newUser, { headers: getAuthHeaders() });
      toast.success("User created");
      setShowUserForm(false);
      setNewUser({ name: "", email: "", password: "", role: "operations" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error creating user");
    }
  };

  const updateEmailSettings = async (field, value) => {
    const updated = { ...emailSettings, [field]: value };
    setEmailSettings(updated);
    try {
      await axios.put(`${API}/admin/email/settings`, {
        enabled: updated.enabled,
        admin_email: updated.admin_email,
        booking_confirmation_enabled: updated.booking_confirmation_enabled,
        new_booking_alert_enabled: updated.new_booking_alert_enabled,
        coordinator_assigned_enabled: updated.coordinator_assigned_enabled,
        lead_alert_enabled: updated.lead_alert_enabled,
        service_alert_enabled: updated.service_alert_enabled
      }, { headers: getAuthHeaders() });
      toast.success("Email settings updated");
    } catch (err) {
      toast.error("Error updating settings");
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Enter a test email address");
      return;
    }
    setSendingTest(true);
    try {
      const res = await axios.post(`${API}/admin/email/test?email_type=test&test_email=${encodeURIComponent(testEmail)}`, null, { headers: getAuthHeaders() });
      if (res.data.status === "sent") {
        toast.success(`Test email sent to ${testEmail}`);
      } else if (res.data.status === "not_configured") {
        toast.error("Resend API key not configured");
      } else {
        toast.error(res.data.message || "Failed to send");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending test email");
    } finally {
      setSendingTest(false);
    }
  };

  const updateCrmSettings = async (field, value) => {
    const updated = { ...crmSettings, [field]: value };
    setCrmSettings(updated);
    try {
      await axios.put(`${API}/admin/crm/settings`, {
        webhook_url: updated.webhook_url || "",
        enabled: updated.enabled || false,
        include_fields: updated.include_fields || []
      }, { headers: getAuthHeaders() });
      toast.success("CRM settings updated");
    } catch (err) {
      toast.error("Error updating CRM settings");
    }
  };

  const testCrmWebhook = async () => {
    setTestingCrm(true);
    try {
      const res = await axios.post(`${API}/admin/crm/test`, null, { headers: getAuthHeaders() });
      if (res.data.status === "success") {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Webhook test failed");
    } finally {
      setTestingCrm(false);
    }
  };

  return (
    <div data-testid="admin-settings">
      <h1 className="font-heading text-2xl sm:text-3xl font-light text-white mb-6 sm:mb-8">Settings</h1>

      {/* Cloud Storage Section */}
      <div className="glass-card rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="font-heading text-lg sm:text-xl font-medium text-white">Cloud Media Storage (R2/S3)</h2>
          {storageConfig?.storage?.enabled && storageConfig?.storage?.configured ? (
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-green-500/20 text-green-400">Ready</span>
          ) : storageConfig?.storage?.enabled ? (
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-yellow-500/20 text-yellow-400">Partially Configured</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-gray-500/20 text-gray-400">Disabled</span>
          )}
        </div>

        {storageConfig && (
          <>
            {/* Status Grid */}
            <div className="bg-white/5 rounded-lg p-3 sm:p-4 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-white/40">Enabled</p>
                  <p className={storageConfig.storage?.enabled ? "text-green-400" : "text-gray-400"}>
                    {storageConfig.storage?.enabled ? "✓ Yes" : "✗ No"}
                  </p>
                </div>
                <div>
                  <p className="text-white/40">Provider</p>
                  <p className="text-white uppercase">{storageConfig.storage?.provider || "—"}</p>
                </div>
                <div>
                  <p className="text-white/40">Bucket</p>
                  <p className={storageConfig.storage?.bucket_present ? "text-green-400" : "text-yellow-400"}>
                    {storageConfig.storage?.bucket_present ? "✓ Set" : "⚠ Default"}
                  </p>
                </div>
                <div>
                  <p className="text-white/40">Credentials</p>
                  <p className={storageConfig.storage?.credentials_present ? "text-green-400" : "text-yellow-400"}>
                    {storageConfig.storage?.credentials_present ? "✓ Set" : "⚠ Missing"}
                  </p>
                </div>
                <div>
                  <p className="text-white/40">CDN URL</p>
                  <p className={storageConfig.storage?.cdn_base_present ? "text-green-400" : "text-yellow-400"}>
                    {storageConfig.storage?.cdn_base_present ? "✓ Set" : "⚠ Default"}
                  </p>
                </div>
              </div>
            </div>

            {/* Test Button */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Button
                onClick={testStorage}
                disabled={testingStorage || !storageConfig.storage?.enabled}
                className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] text-sm"
              >
                {testingStorage ? <Loader2 className="animate-spin mr-2" size={16} /> : <HardDrive className="mr-2" size={16} />}
                Test Storage Connection
              </Button>
              <span className="text-white/40 text-xs">Uploads a test file and verifies connection</span>
            </div>

            {!storageConfig.storage?.enabled && (
              <div className="mt-4 p-3 sm:p-4 bg-[#1A202C]/50 border border-white/[0.06] rounded-lg">
                <p className="text-white/60 text-xs sm:text-sm font-medium mb-2">To enable cloud storage, add to backend .env:</p>
                <code className="block p-2 bg-black/30 rounded text-[10px] sm:text-xs text-white/80 font-mono overflow-x-auto">
                  STORAGE_ENABLED=true<br/>
                  STORAGE_PROVIDER=r2<br/>
                  S3_ENDPOINT=https://&lt;account_id&gt;.r2.cloudflarestorage.com<br/>
                  S3_BUCKET=your-bucket<br/>
                  S3_ACCESS_KEY_ID=your_key<br/>
                  S3_SECRET_ACCESS_KEY=your_secret<br/>
                  PUBLIC_CDN_BASE_URL=https://your-cdn.example.com
                </code>
              </div>
            )}
          </>
        )}
      </div>

      {/* Email Settings Section */}
      <div className="glass-card rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-heading text-xl font-medium text-white">Email Notifications (Resend)</h2>
          {emailSettings?.resend_configured ? (
            <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">Configured</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-400">Not Configured</span>
          )}
        </div>

        {emailSettings && (
          <>
            {/* Status Info */}
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-white/40">API Key</p>
                  <p className={emailSettings.resend_configured ? "text-green-400" : "text-yellow-400"}>
                    {emailSettings.resend_configured ? "✓ Set" : "⚠ Missing"}
                  </p>
                </div>
                <div>
                  <p className="text-white/40">From Address</p>
                  <p className="text-white truncate">{emailSettings.resend_from || "Not set"}</p>
                </div>
                <div>
                  <p className="text-white/40">Test Mode</p>
                  <p className={emailSettings.test_mode ? "text-yellow-400" : "text-white"}>
                    {emailSettings.test_mode ? "Active" : "Production"}
                  </p>
                </div>
                <div>
                  <p className="text-white/40">Status</p>
                  <p className={emailSettings.enabled ? "text-green-400" : "text-red-400"}>
                    {emailSettings.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-4">
              <div>
                <p className="text-white font-medium">Enable Email Notifications</p>
                <p className="text-white/40 text-sm">Master toggle for all email notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={emailSettings.enabled} onChange={e => updateEmailSettings("enabled", e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#F3A15A] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Email Type Toggles */}
            <div className="space-y-2 mb-4">
              {[
                { key: "booking_confirmation_enabled", label: "Booking Confirmation", desc: "Sent to guest after payment" },
                { key: "new_booking_alert_enabled", label: "New Booking Alert", desc: "Sent to admin/ops team" },
                { key: "coordinator_assigned_enabled", label: "Coordinator Assigned", desc: "Sent to guest when coordinator assigned" },
                { key: "lead_alert_enabled", label: "New Lead Alert", desc: "Sent to admin when lead submitted" },
                { key: "service_alert_enabled", label: "Service Request Alert", desc: "Sent to admin for service requests" }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-white text-sm">{item.label}</p>
                    <p className="text-white/40 text-xs">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={emailSettings[item.key]} onChange={e => updateEmailSettings(item.key, e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#F3A15A] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              ))}
            </div>

            {/* Test Email */}
            <div className="flex gap-2">
              <Input 
                placeholder="Test email address" 
                value={testEmail} 
                onChange={e => setTestEmail(e.target.value)} 
                className="bg-white/[0.04] border-white/[0.08] text-white flex-1" 
              />
              <Button 
                onClick={sendTestEmail} 
                disabled={sendingTest || !emailSettings.resend_configured}
                className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A]"
              >
                {sendingTest ? <Loader2 className="animate-spin" size={18} /> : "Send Test"}
              </Button>
            </div>

            {!emailSettings.resend_configured && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm font-medium mb-2">Configuration Required</p>
                <p className="text-white/60 text-sm">To enable emails, add your Resend API key to the backend .env file:</p>
                <code className="block mt-2 p-2 bg-black/30 rounded text-xs text-white/80 font-mono">
                  RESEND_API_KEY=re_your_key_here<br/>
                  RESEND_ENABLED=true
                </code>
              </div>
            )}
          </>
        )}
      </div>

      {/* CRM Webhook Section */}
      <div className="glass-card rounded-xl p-4 sm:p-6 mb-6" data-testid="crm-webhook-settings">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="font-heading text-lg sm:text-xl font-medium text-white">CRM Webhook</h2>
          {crmSettings?.enabled ? (
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-green-500/20 text-green-400">Active</span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm bg-gray-500/20 text-gray-400">Disabled</span>
          )}
        </div>
        
        {crmSettings && (
          <>
            <p className="text-white/40 text-sm mb-4">Automatically send new lead data to your CRM or external system via webhook.</p>
            
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg mb-4">
              <div>
                <p className="text-white font-medium text-sm">Enable CRM Webhook</p>
                <p className="text-white/40 text-xs">POST lead data to your webhook URL on new submissions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={crmSettings.enabled || false} onChange={e => updateCrmSettings("enabled", e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#F3A15A] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            {/* Webhook URL */}
            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">Webhook URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://your-crm.com/api/webhook"
                  value={crmSettings.webhook_url || ""}
                  onChange={e => setCrmSettings(s => ({ ...s, webhook_url: e.target.value }))}
                  onBlur={() => updateCrmSettings("webhook_url", crmSettings.webhook_url)}
                  className="bg-white/[0.04] border-white/[0.08] text-white flex-1"
                  data-testid="crm-webhook-url"
                />
                <Button
                  onClick={testCrmWebhook}
                  disabled={testingCrm || !crmSettings.webhook_url}
                  className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] text-sm"
                  data-testid="crm-test-btn"
                >
                  {testingCrm ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} className="mr-1.5" /> Test</>}
                </Button>
              </div>
            </div>

            {/* Last Test Status */}
            {crmSettings.last_test && (
              <div className="p-3 bg-white/5 rounded-lg mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className={crmSettings.last_test_status === "success" ? "text-green-400" : "text-red-400"}>
                    {crmSettings.last_test_status === "success" ? "Last test: Success" : "Last test: Failed"}
                  </span>
                  <span className="text-white/30 text-xs">{new Date(crmSettings.last_test).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Payload Info */}
            <div className="p-3 bg-white/5 rounded-lg text-xs">
              <p className="text-white/40 mb-1">Webhook payload format:</p>
              <code className="text-white/60 font-mono">{"{ event: 'new_lead', source: 'fairy_star_crm', data: { name, email, phone, lead_type, ... } }"}</code>
            </div>
          </>
        )}
      </div>

      {/* Users Section */}
      <div className="glass-card rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="font-heading text-lg sm:text-xl font-medium text-white">Team Members</h2>
          <Button className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] text-sm" onClick={() => setShowUserForm(true)}>
            <Plus className="mr-2" size={16} /> Add User
          </Button>
        </div>

        {showUserForm && (
          <div className="bg-white/5 rounded-lg p-3 sm:p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input placeholder="Name" value={newUser.name} onChange={e => setNewUser(u => ({...u, name: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
              <Input placeholder="Email" value={newUser.email} onChange={e => setNewUser(u => ({...u, email: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
              <Input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser(u => ({...u, password: e.target.value}))} className="bg-white/[0.04] border-white/[0.08] text-white text-sm" />
              <Select value={newUser.role} onValueChange={v => setNewUser(u => ({...u, role: v}))}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-dropdown">
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                  <SelectItem value="operations" className="text-white">Operations</SelectItem>
                  <SelectItem value="coordinator" className="text-white">Coordinator</SelectItem>
                  <SelectItem value="finance" className="text-white">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={createUser} className="bg-[#F3A15A] text-[#1A202C] hover:bg-[#E8935A] text-sm">Create</Button>
              <Button variant="ghost" onClick={() => setShowUserForm(false)} className="text-white/60 text-sm">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg">
              <div className="min-w-0">
                <p className="text-white font-medium text-sm truncate">{user.name}</p>
                <p className="text-white/40 text-xs truncate">{user.email}</p>
              </div>
              <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs capitalize shrink-0 ${
                user.role === "admin" ? "bg-red-500/20 text-red-400" :
                user.role === "operations" ? "bg-blue-500/20 text-blue-400" :
                user.role === "coordinator" ? "bg-green-500/20 text-green-400" :
                "bg-teal-500/20 text-teal-400"
              }`}>
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <h2 className="font-heading text-lg sm:text-xl font-medium text-white mb-4">Audit Log</h2>
        <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
          {auditLogs.map(log => (
            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg text-xs sm:text-sm gap-1">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="text-white font-medium truncate max-w-[120px] sm:max-w-none">{log.user_email}</span>
                <span className="text-white/40 hidden sm:inline">·</span>
                <span className={`${
                  log.action === "create" ? "text-green-400" :
                  log.action === "update" ? "text-yellow-400" :
                  "text-red-400"
                }`}>{log.action}</span>
                <span className="text-white/40 hidden sm:inline">·</span>
                <span className="text-white/60">{log.entity_type}</span>
              </div>
              <span className="text-white/30 text-[10px] sm:text-xs shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
