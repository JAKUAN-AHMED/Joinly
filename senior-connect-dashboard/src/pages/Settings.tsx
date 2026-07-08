import Card from '../components/Card';
import PageHeader from '../components/PageHeader';

/**
 * Figma "App Preferences" screen:
 * Configure your workspace and regional display settings. |
 * Language — English (United States) | Date Format — MM/DD/YYYY |
 * Notification Sounds — Audible alerts for dispatch
 */
export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" showBell />
      <Card className="max-w-2xl p-6">
        <h2 className="font-heading text-base font-bold text-ink">App Preferences</h2>
        <p className="mt-1 text-sm text-label">Configure your workspace and regional display settings.</p>

        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <p className="text-sm font-semibold text-ink">Language</p>
              <p className="text-xs text-muted">Display language for the admin panel</p>
            </div>
            <select className="rounded-lg border border-line bg-page px-3 py-2 text-sm text-body outline-none focus:border-primary">
              <option>English (United States)</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <p className="text-sm font-semibold text-ink">Date Format</p>
              <p className="text-xs text-muted">How dates are displayed across the dashboard</p>
            </div>
            <select className="rounded-lg border border-line bg-page px-3 py-2 text-sm text-body outline-none focus:border-primary">
              <option>MM/DD/YYYY</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">Notification Sounds</p>
              <p className="text-xs text-muted">Audible alerts for dispatch</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" defaultChecked className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-line peer-checked:bg-primary" />
              <div className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>
      </Card>
    </div>
  );
}
