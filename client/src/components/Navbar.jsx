import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import SecurityIcon from '../assets/secure.png';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between bg-gray-900 px-4 py-3">
     <div className="flex items-center gap-4">
       <Link to="/dashboard" className="text-lg font-semibold text-white">
        SurveyApp
      </Link>
     <Link to="/security" className="flex items-center" aria-label="Security">
  <img src={SecurityIcon} alt="Security" className="h-5 w-5 bg-white" />
</Link>
     </div>
      {user && (
        <div className="flex items-center gap-3">
            {user.role === 'admin' && (
  <Link to="/admin" className="text-sm text-gray-300 hover:text-white">
    Admin
  </Link>
  
)}
<Link to="/profile" className="text-sm text-gray-300 hover:text-white">
  {user.name} Profile
</Link>

          <span className="text-sm text-gray-300">{user.name} </span>
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