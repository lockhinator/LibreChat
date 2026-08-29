import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Check, X } from 'lucide-react';
import { Button } from '@librechat/client';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks/AuthContext';

type RegistrationUser = {
  id: string;
  name?: string;
  email: string;
  createdAt?: string;
  registrationStatus?: 'active' | 'pending' | 'rejected';
  registrationReviewedAt?: string;
  registrationReviewedBy?: string;
};

export default function UserApprovals() {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<RegistrationUser[]>([]);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const path = tab === 'pending' ? 'pending' : 'registration-history';
      const response = await axios.get(`/api/admin/users/${path}`);
      setUsers(response.data.users ?? []);
    } catch {
      setError('Unable to load registration requests.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => void load(), [load]);

  const update = async (id: string, status: 'active' | 'rejected') => {
    try {
      await axios.patch(`/api/admin/users/${id}/registration-status`, { status });
      await load();
    } catch {
      setError('Unable to update this registration request.');
    }
  };

  if (user?.role !== SystemRoles.ADMIN) {
    return <div className="p-8 text-text-primary">Administrator access is required.</div>;
  }

  return (
    <main className="min-h-screen bg-surface-primary p-6 text-text-primary md:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">User approvals</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Review registration requests before users can access LibreChat.
            </p>
          </div>
          <Link className="text-sm text-blue-500 hover:underline" to="/c/new">
            Back to chat
          </Link>
        </div>
        <div className="mb-6 flex gap-2 border-b border-border-light">
          {(['pending', 'history'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setLoading(true);
                setTab(value);
              }}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === value ? 'border-blue-500 text-text-primary' : 'border-transparent text-text-secondary'}`}
            >
              {value === 'pending' ? 'Pending' : 'History'}
            </button>
          ))}
        </div>
        {loading && <p>Loading requests…</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && users.length === 0 && (
          <div className="rounded-xl border border-border-light p-8 text-center text-text-secondary">
            {tab === 'pending'
              ? 'No registrations are waiting for approval.'
              : 'No registration decisions have been recorded yet.'}
          </div>
        )}
        <div className="space-y-3">
          {users.map((candidate) => (
            <div
              key={candidate.id}
              className="flex items-center justify-between rounded-xl border border-border-light p-4"
            >
              <div>
                <div className="font-medium">{candidate.name || candidate.email}</div>
                <div className="text-sm text-text-secondary">{candidate.email}</div>
                {candidate.createdAt && (
                  <div className="mt-1 text-xs text-text-secondary">
                    Requested {new Date(candidate.createdAt).toLocaleString()}
                  </div>
                )}
                {tab === 'history' && candidate.registrationReviewedAt && (
                  <div className="mt-1 text-xs text-text-secondary">
                    {candidate.registrationStatus === 'active' ? 'Approved' : 'Rejected'}{' '}
                    {new Date(candidate.registrationReviewedAt).toLocaleString()} by{' '}
                    {candidate.registrationReviewedBy || 'administrator'}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {tab === 'pending' && (
                  <Button variant="outline" onClick={() => void update(candidate.id, 'rejected')}>
                    <X className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                )}
                {(tab === 'pending' || candidate.registrationStatus === 'rejected') && (
                  <Button onClick={() => void update(candidate.id, 'active')}>
                    <Check className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
