import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="app-page not-found-page">
    <div className="app-page__content app-panel not-found-page__content text-center">
      <span className="not-found-page__mark" aria-hidden="true">404</span>
      <p className="app-page__eyebrow">A small detour</p>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link
        to="/dashboard"
        className="app-primary-button mt-6 inline-block rounded px-4 py-2 font-medium text-white"
      >
        Go to dashboard
      </Link>
    </div>
    </main>
  );
}