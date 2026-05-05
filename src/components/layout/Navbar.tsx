import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="nav" id="navbar">
      <Link to="/" className="nav-logo">
        <div className="nav-mark">GS</div>
        <span className="nav-name">Grid<span>Sense</span> AI</span>
      </Link>
      {token ? (
        <>
          <ul className="nav-links">
            <li><Link to="/dashboard" id="nav-demo">Dashboard</Link></li>
            <li><Link to="/profile" id="nav-profile">Profile</Link></li>
            <li><Link to="/settings" id="nav-settings">Settings</Link></li>
          </ul>
          <div className="nav-end">
            <button
              onClick={handleLogout}
              className="btn btn-green btn-sm"
              id="nav-logout"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <ul className="nav-links">
            <li><Link to="/" id="nav-home">Home</Link></li>
            <li><a href="#features" id="nav-features">Platform</a></li>
            <li><a href="#how" id="nav-how">How It Works</a></li>
            <li><a href="#contact" id="nav-contact">Contact</a></li>
          </ul>
          <div className="nav-end">
            <Link to="/login?mode=login" className="btn btn-outline btn-sm" id="nav-login">
              Login
            </Link>
            <Link to="/login?mode=signup" className="btn btn-green btn-sm" id="nav-signup">
              Sign Up
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}