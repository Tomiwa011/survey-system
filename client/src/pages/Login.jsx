import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:left-6 sm:top-6"
      >
        <span aria-hidden="true">←</span>
        Back to home
      </Link>
      <div className="auth-card flex w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
        <aside className="auth-story hidden w-1/2 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold shadow-inner ring-1 ring-white/20">
                S
              </div>
              <div>
                <p className="auth-story__brand text-xs font-semibold uppercase tracking-[0.22em] line-1 anim-typewriter">
                    SurveyApp
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <h1 className="auth-story__title text-4xl font-bold leading-tight">
                Welcome back to better questions.
              </h1>
              <p className="auth-story__description max-w-sm text-base">
                Pick up where you left off, create a survey, and turn responses into useful insights.
              </p>
            </div>
          </div>

          <div className="auth-story__steps">
            <span>Ask thoughtful questions</span>
            <span>Learn from every answer</span>
          </div>
        </aside>

        <main className="w-full p-6 sm:p-8 lg:w-1/2 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="auth-form__mark mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold lg:mx-0">
                S
              </div>
              <p className="auth-form__eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
                Welcome back
              </p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">Log in</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="auth-input w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="auth-input w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-11 text-slate-900 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="auth-submit w-full rounded-xl px-4 py-3 font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              No account?{" "}
              <Link
                to="/register"
                className="auth-inline-link font-semibold"
              >
                Register
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
