import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import Navbar from '../components/Navbar';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [surveys, setSurveys] = useState([]);

  const isAdmin = user && user.role === 'admin';

  function handleError(err) {
    if (err.status === 401) navigate('/login');
    else if (err.status === 403) navigate('/dashboard');
    else setError(err.message);
  }

  useEffect(() => {
    if (!isAdmin) return;
    api('/api/admin/stats')
      .then((d) => setStats(d.stats))
      .catch(handleError);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => {
      api(`/api/admin/users?search=${encodeURIComponent(search)}`)
        .then((d) => setUsers(d.users))
        .catch(handleError)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, isAdmin]);
  useEffect(() => {
  if (!isAdmin) return;
  api('/api/admin/surveys')
    .then((d) => setSurveys(d.surveys))
    .catch(handleError);
}, [isAdmin]);
async function closeSurvey(s) {
  if (!window.confirm(`Close "${s.title}"? Nobody will be able to respond to it.`)) return;
  setError('');
  try {
    await api(`/api/admin/surveys/${s.id}/close`, { method: 'POST' });
    setSurveys(surveys.map((x) => (x.id === s.id ? { ...x, status: 'closed' } : x)));
  } catch (err) {
    handleError(err);
  }
}

async function deleteSurvey(s) {
  const warning = `Permanently delete "${s.title}" and its ${s.response_count} responses? This cannot be undone.`;
  if (!window.confirm(warning)) return;
  setError('');
  try {
    await api(`/api/admin/surveys/${s.id}`, { method: 'DELETE' });
    setSurveys(surveys.filter((x) => x.id !== s.id));
    setStats((prev) =>
      prev
        ? { ...prev, surveys: prev.surveys - 1, responses: prev.responses - s.response_count }
        : prev
    );
  } catch (err) {
    handleError(err);
  }
}

  async function toggleActive(u) {
    const action = u.is_active ? 'Deactivate' : 'Reactivate';
    if (!window.confirm(`${action} ${u.email}?`)) return;
    setError('');
    try {
      const data = await api(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: { is_active: !u.is_active },
      });
      setUsers(users.map((x) => (x.id === u.id ? { ...x, is_active: data.user.is_active } : x)));
    } catch (err) {
      handleError(err);
    }
  }

  if (authLoading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Admin</h1>

        {stats && (
          <div className="mb-8 grid grid-cols-3 gap-3">
            {[
              ['Users', stats.users],
              ['Surveys', stats.surveys],
              ['Responses', stats.responses],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-semibold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="mb-3 text-lg font-semibold text-gray-900">Users</h2>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          aria-label="Search users"
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <p role="alert" className="mb-3 rounded bg-red-50 px-3 py-2 text-red-700">
            {error}
          </p>
        )}
        {loading && <p className="text-gray-500">Loading users...</p>}
        {!loading && users.length === 0 && <p className="text-gray-500">No users found.</p>}

        {users.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Surveys</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 break-all">{u.email}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2">{u.survey_count}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.is_active ? 'active' : 'deactivated'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {u.role === 'user' && (
                        <button
                          onClick={() => toggleActive(u)}
                          className="rounded border border-gray-400 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mb-3 mt-10 text-lg font-semibold text-gray-900">All surveys</h2>
{surveys.length === 0 ? (
  <p className="text-gray-500">No surveys yet.</p>
) : (
  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
    <table className="w-full text-left text-sm">
      <thead className="bg-gray-50 text-gray-600">
        <tr>
          <th className="px-3 py-2">Title</th>
          <th className="px-3 py-2">Owner</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Responses</th>
          <th className="px-3 py-2"></th>
        </tr>
      </thead>
      <tbody>
        {surveys.map((s) => (
          <tr key={s.id} className="border-t border-gray-100">
            <td className="px-3 py-2">{s.title}</td>
            <td className="px-3 py-2 break-all">{s.owner_email}</td>
            <td className="px-3 py-2">{s.status}</td>
            <td className="px-3 py-2">{s.response_count}</td>
            <td className="px-3 py-2">
              <div className="flex gap-2">
                {s.status !== 'closed' && (
                  <button
                    onClick={() => closeSurvey(s)}
                    className="rounded border border-gray-400 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={() => deleteSurvey(s)}
                  className="rounded border border-red-600 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
      </div>
    </>
  );
}