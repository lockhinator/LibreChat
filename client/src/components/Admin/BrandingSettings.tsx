import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@librechat/client';
import { LocalStorageKeys, SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks/AuthContext';

export default function BrandingSettings() {
  const { user } = useAuthContext();
  const [title, setTitle] = useState('LibreChat');
  const [tagline, setTagline] = useState('');
  const [icon, setIcon] = useState<File>();
  const [favicon, setFavicon] = useState<File>();
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/admin/users/branding').then(({ data }) => {
      setTitle(data.title || 'LibreChat');
      setTagline(data.tagline || '');
    });
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const body = new FormData();
    body.set('title', title);
    body.set('tagline', tagline);
    if (icon) body.set('icon', icon);
    if (favicon) body.set('favicon', favicon);
    const { data } = await axios.put('/api/admin/users/branding', body);
    const savedTitle = data.title || 'LibreChat';
    localStorage.setItem(LocalStorageKeys.APP_TITLE, savedTitle);
    document.title = savedTitle;
    setMessage('Branding saved. The site title is active now; refresh to reload uploaded images.');
  };

  if (user?.role !== SystemRoles.ADMIN)
    return <div className="p-8">Administrator access is required.</div>;
  return (
    <main className="min-h-screen bg-surface-primary p-6 text-text-primary md:p-10">
      <form onSubmit={save} className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Branding</h1>
            <p className="text-sm text-text-secondary">
              Customize the public identity of this LibreChat instance.
            </p>
          </div>
          <Link className="text-sm text-blue-500 hover:underline" to="/c/new">
            Back to chat
          </Link>
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Site title</span>
          <input
            className="w-full rounded-lg border border-border-light bg-surface-primary p-3"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Tagline</span>
          <textarea
            className="w-full rounded-lg border border-border-light bg-surface-primary p-3"
            maxLength={240}
            rows={3}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Site icon</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => setIcon(e.target.files?.[0])}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Favicon</span>
          <input
            type="file"
            accept="image/png,image/x-icon,image/svg+xml"
            onChange={(e) => setFavicon(e.target.files?.[0])}
          />
        </label>
        {message && (
          <p className="rounded-lg border border-green-500 bg-green-500/10 p-3 text-sm">
            {message}
          </p>
        )}
        <Button type="submit">Save branding</Button>
      </form>
    </main>
  );
}
