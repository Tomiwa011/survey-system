import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between bg-gray-900 px-4 py-3">
      <Link to="/dashboard" className="text-lg font-semibold text-white">
        SurveyApp
      </Link>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">{user.name}</span>
          <button
            onClick={logout}
            className="rounded border border-gray-400 px-3 py-1 text-sm text-white hover:bg-gray-700"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}