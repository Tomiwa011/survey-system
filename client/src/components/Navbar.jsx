import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../AuthContext';
import SecurityIcon from '../assets/secure.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-gray-900 px-4 py-3">
      <div className="flex min-w-0 items-center gap-4">
        <Link to="/dashboard" className="text-lg font-semibold text-white">
          SurveyApp
        </Link>
        <Link to="/security" className="flex items-center" aria-label="Security">
          <img src={SecurityIcon} alt="Security" className="h-5 w-5 bg-white" />
        </Link>
      </div>
      {user && (
        <>
          <button
            type="button"
            aria-controls="navbar-account-links"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            className="rounded border border-gray-400 px-3 py-1 text-sm text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
          <div
            id="navbar-account-links"
            className={`flex w-full flex-col items-start gap-3 overflow-hidden transition-[max-height,opacity,visibility] duration-300 ease-in-out md:w-auto md:flex-row md:items-center md:visible md:max-h-none md:opacity-100 md:delay-0 md:transition-none ${
              menuOpen
                ? 'visible max-h-96 opacity-100 delay-0'
                : 'invisible max-h-0 opacity-0 delay-300'
            }`}
          >
            {user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-gray-300 hover:text-white"
              >
                Admin
              </Link>
            )}
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="max-w-full wrap-break-word text-sm text-gray-300 hover:text-white"
            >
              {user.name} Profile
            </Link>
            <span className="max-w-full wrap-break-word text-sm text-gray-300">{user.name}</span>
            <button
              onClick={logout}
              className="rounded border border-gray-400 px-3 py-1 text-sm text-white hover:bg-gray-700"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </nav>
  );
}