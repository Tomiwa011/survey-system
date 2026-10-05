import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

const input =
  'w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function Profile() {
  const { user, loading: authLoading, setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [detailsMsg, setDetailsMsg] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  async function handleDetails(e) {
    e.preventDefault();
    setDetailsMsg('');
    setDetailsError('');
    setSavingDetails(true);
    try {
      const data = await api('/api/auth/me', { method: 'PATCH', body: { name, email } });
      setUser(data.user);
      setDetailsMsg('Profile updated');
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else setDetailsError(err.message);
    } finally {
      setSavingDetails(false);
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    setPwMsg('');
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwMsg('Password changed');
    } catch (err) {
      if (err.status === 401) navigate('/login');
      else setPwError(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  if (authLoading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-md space-y-8 px-4 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Your profile</h1>

          <Link to="/dashboard" className="text-sm text-blue-700 hover:underline">
          ← Back to dashboard
        </Link>

        <form onSubmit={handleDetails} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          {detailsError && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{detailsError}</p>}
          {detailsMsg && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{detailsMsg}</p>}

          <div>
            <label htmlFor="pname" className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input id="pname" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required className={input} />
          </div>
          <div>
            <label htmlFor="pemail" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input id="pemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required autoComplete="email" className={input} />
          </div>
          <button type="submit" disabled={savingDetails} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {savingDetails ? 'Saving...' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={handlePassword} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
          {pwError && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{pwError}</p>}
          {pwMsg && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{pwMsg}</p>}

          <div>
            <label htmlFor="cpw" className="mb-1 block text-sm font-medium text-gray-700">Current password</label>
            <input id="cpw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" className={input} />
          </div>
          <div>
            <label htmlFor="npw" className="mb-1 block text-sm font-medium text-gray-700">New password</label>
            <input id="npw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} maxLength={72} required autoComplete="new-password" className={input} />
          </div>
          <div>
            <label htmlFor="cnpw" className="mb-1 block text-sm font-medium text-gray-700">Confirm new password</label>
            <input id="cnpw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className={input} />
          </div>
          <button type="submit" disabled={savingPw} className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {savingPw ? 'Changing...' : 'Change password'}
          </button>
        </form>
      </div>
    </>
  );
}