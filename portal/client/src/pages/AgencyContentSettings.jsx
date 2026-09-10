import { useEffect, useState } from 'react';
import { Surface, Alert } from '@aviaframe/ui';
import { updateMyAgencyContent, uploadAgencyLogo, uploadMyAgencyMedia } from '../lib/supabase';

// Every field here maps 1:1 to a field the backend already serves through
// GET /public/agencies/:subdomain/content and applies at runtime via
// content-hydrate.js (see backend/agency-site-assets/content-hydrate.js).
// That means: saving here takes effect on the agency's live site on the
// next page load, with NO Netlify redeploy and NO money movement.
// Commission/markup and payout bank details are intentionally NOT here —
// those stay in the "Agency settings" commission form above (admin-only).
const ALL_SERVICES = [
  { key: 'flights_domestic', en: 'Domestic flight bookings' },
  { key: 'flights_intl', en: 'International flight bookings' },
  { key: 'hotels', en: 'Hotel reservations worldwide' },
  { key: 'visa', en: 'Visa application support' },
  { key: 'insurance', en: 'Medical travel insurance' },
  { key: 'umrah', en: 'Umrah & Hajj packages' },
  { key: 'tours', en: 'Tour packages & holidays' },
  { key: 'corporate', en: 'Corporate travel management' },
  { key: 'transfers', en: 'Airport transfers' },
  { key: 'car_rental', en: 'Car rental' }
];

const DEFAULT_SERVICES = ['flights_domestic', 'flights_intl', 'hotels', 'visa', 'insurance', 'umrah', 'tours', 'corporate'];

function buildFormFromAgency(agency) {
  const settings = agency?.settings || {};
  const site = settings.site || {};
  return {
    name_ar: site.name_ar || '',
    contact_phone2: site.contact_phone2 || '',
    whatsapp_phone: site.whatsapp_phone || '',
    brand_color: site.brand_color || '#1a3c8e',
    accent_color: site.accent_color || '#2468c4',
    header_bg: site.header_bg || '',
    footer_bg: site.footer_bg || '',
    logo_url: site.logo_url || '',
    hero_tagline: site.hero_tagline || '',
    hero_description: site.hero_description || '',
    hero_image_url: site.hero_image_url || '',
    about_en: site.about_en || '',
    about_ar: site.about_ar || '',
    services: Array.isArray(site.services) && site.services.length > 0 ? site.services : DEFAULT_SERVICES,
    supervisor_name: site.supervisor_name || '',
    supervisor_email: site.supervisor_email || '',
    instagram: site.instagram || '',
    twitter: site.twitter || '',
    snapchat: site.snapchat || '',
    facebook: site.facebook || '',
    working_hours: site.working_hours || '',
    working_hours_ar: site.working_hours_ar || '',
    address: agency?.address || '',
    default_language: settings.language === 'ar' ? 'ar' : 'en',
    default_display_currency: ['SAR', 'USD', 'EUR'].includes(site.default_display_currency) ? site.default_display_currency : 'SAR',
    ga_measurement_id: site.ga_measurement_id || '',
    meta_pixel_id: site.meta_pixel_id || '',
    notification_email: site.notification_email || ''
  };
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full border rounded px-2 py-1.5 text-sm';

// Matches the 5MB / PNG-JPG-WebP-SVG restriction the backend enforces
// server-side (agency.js `upload`/ALLOWED_IMAGE_MIMETYPES) — rejected
// immediately here too so a bad file never leaves the browser.
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Real "pick a file from your computer" upload — most agencies don't have
// their logo/hero photo hosted anywhere with a public URL already. Falls
// back to a manual URL field for the (rarer) case where they do.
function ImageUploadField({ label, hint, value, onChange, uploadFn }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputId = `img-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError('Only PNG, JPG, WebP or SVG images are allowed.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError('Image is too large — max 5MB.');
      return;
    }
    setUploading(true);
    const { url, error } = await uploadFn(file);
    setUploading(false);
    if (error) {
      setUploadError(error.message || 'Upload failed');
      return;
    }
    if (url) onChange(url);
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-12 w-12 rounded object-cover border bg-white" />
        ) : (
          <div className="h-12 w-12 rounded border border-dashed flex items-center justify-center text-[10px] text-gray-400">
            none
          </div>
        )}
        <div className="flex-1">
          <label htmlFor={inputId} className={`inline-block rounded px-3 py-1.5 text-sm font-medium cursor-pointer ${uploading ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {uploading ? 'Uploading...' : value ? 'Replace image' : 'Choose image'}
          </label>
          <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFile} disabled={uploading} />
          {value && (
            <button type="button" onClick={() => onChange('')} className="ml-2 text-xs text-gray-400 hover:text-red-500">
              Remove
            </button>
          )}
          <button type="button" onClick={() => setShowUrlInput((v) => !v)} className="ml-2 text-xs text-blue-500 hover:underline">
            {showUrlInput ? 'Hide URL field' : 'Paste URL instead'}
          </button>
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>
      </div>
      {showUrlInput && (
        <input className={`${inputCls} mt-2`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
      )}
    </Field>
  );
}

export default function AgencyContentSettings({ agency }) {
  const [form, setForm] = useState(() => buildFormFromAgency(agency));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    setForm(buildFormFromAgency(agency));
    const savedAt = agency?.settings?.last_saved_at;
    const savedBy = agency?.settings?.last_saved_by;
    if (savedAt) setLastSaved({ at: savedAt, by: savedBy });
  }, [agency?.id]);

  const set = (key) => (e) => {
    const value = e?.target?.type === 'checkbox' ? e.target.checked : e?.target?.value ?? e;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleService = (key) => {
    setForm((prev) => {
      const has = prev.services.includes(key);
      return { ...prev, services: has ? prev.services.filter((k) => k !== key) : [...prev.services, key] };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload = {
      name_ar: form.name_ar,
      contact_phone2: form.contact_phone2,
      whatsapp_phone: form.whatsapp_phone,
      brand_color: form.brand_color,
      accent_color: form.accent_color,
      header_bg: form.header_bg,
      footer_bg: form.footer_bg,
      logo_url: form.logo_url,
      hero_tagline: form.hero_tagline,
      hero_description: form.hero_description,
      hero_image_url: form.hero_image_url,
      about_en: form.about_en,
      about_ar: form.about_ar,
      services: form.services,
      supervisor_name: form.supervisor_name,
      supervisor_email: form.supervisor_email,
      instagram: form.instagram,
      twitter: form.twitter,
      snapchat: form.snapchat,
      facebook: form.facebook,
      working_hours: form.working_hours,
      working_hours_ar: form.working_hours_ar,
      address: form.address,
      default_language: form.default_language,
      default_display_currency: form.default_display_currency,
      ga_measurement_id: form.ga_measurement_id,
      meta_pixel_id: form.meta_pixel_id,
      notification_email: form.notification_email
    };
    const { data, error: err } = await updateMyAgencyContent(payload);
    setSaving(false);
    if (err) {
      setError(err.message || 'Save failed');
      return;
    }
    if (data) {
      setForm(buildFormFromAgency(data));
      setLastSaved({ at: data.settings?.last_saved_at, by: data.settings?.last_saved_by });
    }
  };

  return (
    <Surface className="p-4 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Site content</h2>
          <p className="text-sm text-gray-600">
            Colors, logo, contacts, text, banner and tracking IDs shown on your public site — changes go
            live on next page load, no waiting, no redeploy cost.
          </p>
        </div>
        {lastSaved?.at && (
          <p className="text-xs text-gray-400 whitespace-nowrap">
            Last saved {new Date(lastSaved.at).toLocaleString()}{lastSaved.by ? ` by ${lastSaved.by}` : ''}
          </p>
        )}
      </div>

      {error && <Alert className="my-3 text-sm">{error}</Alert>}

      <div className="mt-4 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Branding</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <ImageUploadField label="Logo" value={form.logo_url} onChange={(url) => setForm((p) => ({ ...p, logo_url: url }))} uploadFn={uploadAgencyLogo} />
            <Field label="Brand color">
              <div className="flex items-center gap-2">
                <input type="color" className="w-10 h-8 rounded cursor-pointer border" value={form.brand_color} onChange={set('brand_color')} />
                <span className="text-xs text-gray-400">{form.brand_color}</span>
              </div>
            </Field>
            <Field label="Accent color">
              <div className="flex items-center gap-2">
                <input type="color" className="w-10 h-8 rounded cursor-pointer border" value={form.accent_color} onChange={set('accent_color')} />
                <span className="text-xs text-gray-400">{form.accent_color}</span>
              </div>
            </Field>
            <Field label="Agency name (Arabic)"><input className={inputCls} value={form.name_ar} onChange={set('name_ar')} /></Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Contact & hours</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Field label="Second phone"><input className={inputCls} value={form.contact_phone2} onChange={set('contact_phone2')} /></Field>
            <Field label="WhatsApp phone"><input className={inputCls} value={form.whatsapp_phone} onChange={set('whatsapp_phone')} /></Field>
            <Field label="Address"><input className={inputCls} value={form.address} onChange={set('address')} /></Field>
            <Field label="Working hours (EN)"><input className={inputCls} value={form.working_hours} onChange={set('working_hours')} placeholder="Sun-Thu 9am-6pm" /></Field>
            <Field label="Working hours (AR)"><input className={inputCls} value={form.working_hours_ar} onChange={set('working_hours_ar')} /></Field>
            <Field label="Notifications inbox" hint="Where we email you when a new booking comes in.">
              <input className={inputCls} value={form.notification_email} onChange={set('notification_email')} placeholder="bookings@youragency.com" />
            </Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Hero & about</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Hero tagline"><input className={inputCls} value={form.hero_tagline} onChange={set('hero_tagline')} /></Field>
            <ImageUploadField label="Hero background image" value={form.hero_image_url} onChange={(url) => setForm((p) => ({ ...p, hero_image_url: url }))} uploadFn={uploadMyAgencyMedia} />
            <Field label="Hero subtitle" hint="Shown under the tagline.">
              <textarea className={inputCls} rows={2} value={form.hero_description} onChange={set('hero_description')} />
            </Field>
            <div />
            <Field label="About us (EN)"><textarea className={inputCls} rows={3} value={form.about_en} onChange={set('about_en')} /></Field>
            <Field label="About us (AR)"><textarea className={inputCls} rows={3} value={form.about_ar} onChange={set('about_ar')} /></Field>
            <Field label="Supervisor name"><input className={inputCls} value={form.supervisor_name} onChange={set('supervisor_name')} /></Field>
            <Field label="Supervisor email"><input className={inputCls} value={form.supervisor_email} onChange={set('supervisor_email')} /></Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Services shown on site</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ALL_SERVICES.map((s) => (
              <label key={s.key} className="flex items-center gap-2 text-sm text-gray-700 border rounded px-2 py-1.5 cursor-pointer">
                <input type="checkbox" checked={form.services.includes(s.key)} onChange={() => toggleService(s.key)} />
                {s.en}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Social links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Instagram"><input className={inputCls} value={form.instagram} onChange={set('instagram')} /></Field>
            <Field label="Twitter / X"><input className={inputCls} value={form.twitter} onChange={set('twitter')} /></Field>
            <Field label="Snapchat"><input className={inputCls} value={form.snapchat} onChange={set('snapchat')} /></Field>
            <Field label="Facebook"><input className={inputCls} value={form.facebook} onChange={set('facebook')} /></Field>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Language, currency & tracking</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Default language for new visitors">
              <select className={inputCls} value={form.default_language} onChange={set('default_language')}>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>
            </Field>
            <Field label="Default display currency" hint="Display only — does not change how you're actually charged.">
              <select className={inputCls} value={form.default_display_currency} onChange={set('default_display_currency')}>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
            <Field label="Google Analytics ID" hint="e.g. G-XXXXXXXXXX"><input className={inputCls} value={form.ga_measurement_id} onChange={set('ga_measurement_id')} /></Field>
            <Field label="Meta Pixel ID"><input className={inputCls} value={form.meta_pixel_id} onChange={set('meta_pixel_id')} /></Field>
          </div>
        </section>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`rounded px-4 py-2 text-sm font-semibold text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {saving ? 'Saving...' : 'Save site content'}
        </button>
      </div>
    </Surface>
  );
}
