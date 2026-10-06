import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Go to dashboard
      </Link>
    </div>
  );
}