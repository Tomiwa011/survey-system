import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  function closeMenu() {
    setMenuOpen(false);
  }

  function navLink(path, label, className = '') {
    return (
      <Link
        to={path}
        onClick={closeMenu}
        aria-current={pathname === path ? 'page' : undefined}
        className={`site-nav__link ${className}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link to="/" onClick={closeMenu} className="site-brand" aria-label="SurveyApp home">
          <span className="site-brand__mark" aria-hidden="true">S</span>
          <span>Survey<span className="site-brand__accent">App</span></span>
        </Link>

        <button
          type="button"
          className="site-nav__toggle"
          aria-controls="site-nav-links"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          <span>{menuOpen ? 'Close' : 'Menu'}</span>
          <span className={`site-nav__toggle-icon${menuOpen ? ' is-open' : ''}`} aria-hidden="true">
            <i />
            <i />
          </span>
        </button>

        <div
          id="site-nav-links"
          className={`site-nav__links${menuOpen ? ' is-open' : ''}`}
        >
          {navLink('/', 'Home')}
          {!loading && user && navLink('/dashboard', 'Dashboard')}
          {navLink('/security', 'Security')}
          {!loading && !user && (
            <>
              {navLink('/login', 'Login')}
              {navLink('/register', 'Register', 'site-nav__link--cta')}
            </>
          )}
          {!loading && user && (
            <div className="site-nav__account">
              {user.role === 'admin' && navLink('/admin', 'Admin')}
              {navLink('/profile', 'Profile')}
              <span className="site-nav__user">{user.name}</span>
              <button type="button" onClick={logout} className="site-nav__logout">
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
