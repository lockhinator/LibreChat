import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Check, X } from 'lucide-react';
import { Button } from '@librechat/client';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks/AuthContext';

type PendingUser = {
  id: string;
  name?: string;
  email: string;
  createdAt?: string;
};

export default function UserApprovals() {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const response = await axios.get('/api/admin/users/pending');
      setUsers(response.data.users ?? []);
    } catch {
      setError('Unable to load registration requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const update = async (id: string, status: 'active' | 'rejected') => {
    await axios.patch(`/api/admin/users/${id}/registration-status`, { status });
    setUsers((current) => current.filter((candidate) => candidate.id !== id));
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
              Approve registration requests before users can access LibreChat.
            </p>
          </div>
          <Link className="text-sm text-blue-500 hover:underline" to="/c/new">
            Back to chat
          </Link>
        </div>
        {loading && <p>Loading requests…</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && users.length === 0 && (
          <div className="rounded-xl border border-border-light p-8 text-center text-text-secondary">
            No registrations are waiting for approval.
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
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void update(candidate.id, 'rejected')}>
                  <X className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={() => void update(candidate.id, 'active')}>
                  <Check className="mr-1 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
