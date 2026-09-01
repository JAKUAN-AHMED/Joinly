/**
 * Settings — no Figma frame exists for this screen, so it is built from the
 * system established by the other frames (eyebrow + heading, one card, rows
 * separated by #E4E8E5 rules). Fields follow the Figma naming dictionary:
 * `language`, `dateFormat`, `notificationSounds`.
 */
import { useState } from 'react';
import Card from '../components/Card';
import { useTopbar } from '../layouts/topbar';

const SELECT =
  'h-11 rounded-field border border-line bg-card px-4 text-base text-body outline-none focus:border-brand';

export default function Settings() {
  useTopbar({ title: 'Settings' });

  const [language, setLanguage] = useState('English (United States)');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [notificationSounds, setNotificationSounds] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-[0.08em] text-label uppercase">Preferences</p>
        <h2 className="mt-1 text-[35px] leading-tight font-bold text-ink">App Preferences</h2>
      </div>

      <Card>
        <p className="text-sm text-muted">
          Configure your workspace and regional display settings.
        </p>

        <div className="mt-6 divide-y divide-line">
          <div className="flex items-center justify-between gap-6 pb-5">
            <div>
              <p className="text-base font-medium text-ink-strong">Language</p>
              <p className="mt-0.5 text-sm text-muted">Display language for the admin panel</p>
            </div>
            <select
              aria-label="Language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className={SELECT}
            >
              <option>English (United States)</option>
              <option>English (United Kingdom)</option>
              <option>Italiano</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-6 py-5">
            <div>
              <p className="text-base font-medium text-ink-strong">Date Format</p>
              <p className="mt-0.5 text-sm text-muted">How dates are displayed across the dashboard</p>
            </div>
            <select
              aria-label="Date format"
              value={dateFormat}
              onChange={(event) => setDateFormat(event.target.value)}
              className={SELECT}
            >
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-6 pt-5">
            <div>
              <p className="text-base font-medium text-ink-strong">Notification Sounds</p>
              <p className="mt-0.5 text-sm text-muted">Audible alerts for dispatch</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationSounds}
              aria-label="Notification sounds"
              onClick={() => setNotificationSounds((prev) => !prev)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                notificationSounds ? 'bg-action' : 'bg-field'
              }`}
            >
              <span
                className={`absolute top-1 left-0 size-4 rounded-full bg-white transition-transform ${
                  notificationSounds ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
