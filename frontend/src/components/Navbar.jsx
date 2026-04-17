import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/vault',   label: 'My Vault',   icon: '🫙' },
  { to: '/create',  label: 'Create',      icon: '✨' },
  { to: '/shared',  label: 'Shared',      icon: '💌' },
  { to: '/friends', label: 'Friends',     icon: '🤝' },
  { to: '/ghost',   label: 'Ghost Wall',  icon: '👻' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('See you soon 👋');
    navigate('/login');
  };

  const initials = user
    ? (user.displayName || user.username).slice(0, 2).toUpperCase()
    : '?';

  return (
    <nav className="navbar">
      <NavLink to="/vault" className="navbar-brand">
        <div className="navbar-logo">🫙</div>
        <span className="navbar-title">Memory Capsule</span>
      </NavLink>

      <div className="navbar-nav">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <NavLink to="/profile" className="nav-link">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} className="avatar avatar-sm" />
          ) : (
            <div className="avatar avatar-sm avatar-placeholder"
              style={{ background: 'var(--gradient-amber)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, borderRadius: '50%' }}>
              {initials}
            </div>
          )}
          <span>{user?.username}</span>
        </NavLink>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
