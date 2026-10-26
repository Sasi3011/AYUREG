import { useEffect, useState } from "react";
import { Cpu, Save, Shield } from "lucide-react";
import api from "../api/client";
import { Alert, Card, PageHeader, PageLoader, Spinner } from "../components/ui";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then((res) => {
        setSettings(res.settings);
        setSaved(res.settings);
      })
      .catch((err) => setMsg({ type: "error", text: err.message }));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await api.put("/admin/settings", settings);
      setSettings(res.settings);
      setSaved(res.settings);
      setMsg({ type: "success", text: "Settings saved." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return msg ? <div className="page"><Alert type={msg.type}>{msg.text}</Alert></div> : <PageLoader />;

  const set = (k) => (e) => setSettings({ ...settings, [k]: e.target.value });
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  return (
    <form onSubmit={handleSave} className="page max-w-5xl">
      <PageHeader
        title="Platform settings"
        subtitle="Global rules applied across AYUREG."
        actions={
          <button type="submit" disabled={saving || !dirty} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />} Save changes
          </button>
        }
      />

      {msg && <Alert type={msg.type} className="mb-6">{msg.text}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title={
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" /> Security & sign-in
            </span>
          }
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="timeout" className="label">Session timeout (minutes)</label>
              <input id="timeout" type="number" min={5} max={1440} value={settings.session_timeout_minutes} onChange={set("session_timeout_minutes")} className="input" />
            </div>
            <div>
              <label htmlFor="mfa" className="label">Two-step sign in for officers</label>
              <select id="mfa" value={settings.officer_mfa} onChange={set("officer_mfa")} className="input">
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </Card>

        <Card
          title={
            <span className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-secondary-600" /> AI & OCR
            </span>
          }
        >
          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="threshold" className="label mb-0">AI confidence threshold</label>
                <span className="text-sm font-bold text-primary-600">{settings.ai_confidence_threshold}%</span>
              </div>
              <input id="threshold" type="range" min={50} max={99} value={settings.ai_confidence_threshold} onChange={set("ai_confidence_threshold")} className="w-full accent-primary-600" />
              <p className="hint">Documents scoring below this are flagged for closer officer review.</p>
            </div>
            <div>
              <label htmlFor="ocr" className="label">OCR engine</label>
              <select id="ocr" value={settings.ocr_engine} onChange={set("ocr_engine")} className="input">
                <option value="tesseract">Tesseract.js (built-in)</option>
                <option value="cloud">Cloud OCR (requires configuration)</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Alert type="info" className="mt-6">
        Settings are saved to the database and every change is written to the audit log. They are not yet enforced by the session or OCR services.
      </Alert>
    </form>
  );
}
