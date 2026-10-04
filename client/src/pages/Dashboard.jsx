import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import Navbar from "../components/Navbar";
import SurveyCard from "../components/SurveyCard";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    api("/api/surveys")
      .then((data) => setSurveys(data.surveys))
      .catch((err) => {
        if (err.status === 401) navigate("/login");
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);
  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const data = await api("/api/surveys", {
        method: "POST",
        body: { title, description },
      });
      setSurveys([data.survey, ...surveys]);
      setTitle("");
      setDescription("");
    } catch (err) {
      if (err.status === 401) navigate("/login");
      else setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(survey, status) {
    setActionError("");
    try {
      const data = await api(`/api/surveys/${survey.id}`, {
        method: "PATCH",
        body: { status },
      });
      setSurveys(surveys.map((s) => (s.id === survey.id ? data.survey : s)));
    } catch (err) {
      if (err.status === 401) navigate("/login");
      else setActionError(err.message);
    }
  }

  async function handleDelete(survey) {
    if (!window.confirm(`Delete "${survey.title}"? This cannot be undone.`))
      return;
    setActionError("");
    try {
      await api(`/api/surveys/${survey.id}`, { method: "DELETE" });
      setSurveys(surveys.filter((s) => s.id !== survey.id));
    } catch (err) {
      if (err.status === 401) navigate("/login");
      else setActionError(err.message);
    }
  }
  if (authLoading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  const visible = surveys.filter(
    (s) =>
      s.title.toLowerCase().includes(search.trim().toLowerCase()) &&
      (statusFilter === "all" || s.status === statusFilter),
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900">
            Welcome, {user.name}
          </h1>

          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              New survey
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <p
                  role="alert"
                  className="rounded bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {createError}
                </p>
              )}

              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="rounded cursor-pointer bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create survey"}
              </button>
            </form>
          </div>

          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            My surveys
          </h2>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title"
              aria-label="Search surveys"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="rounded border border-gray-300 px-3 py-2 sm:w-40"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          {actionError && (
            <p
              role="alert"
              className="mb-3 rounded bg-red-50 px-3 py-2 text-red-700"
            >
              {actionError}
            </p>
          )}
          {loading && <p className="text-gray-500">Loading surveys...</p>}
          {error && (
            <p
              role="alert"
              className="rounded bg-red-50 px-3 py-2 text-red-700"
            >
              {error}
            </p>
          )}
          {!loading && !error && surveys.length === 0 && (
            <p className="text-gray-500">
              No surveys yet. Create your first one above.
            </p>
          )}

          {surveys.length > 0 && visible.length === 0 && (
            <p className="text-gray-500">No surveys match your search.</p>
          )}

          {visible.map((s) => (
            <SurveyCard
              key={s.id}
              survey={s}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </>
  );
}
