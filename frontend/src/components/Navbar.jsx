import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/vault',   label: 'My Vault',   shortLabel: 'Vault',   icon: '🫙' },
  { to: '/create',  label: 'Create',      shortLabel: 'Create',  icon: '✨' },
  { to: '/shared',  label: 'Shared',      shortLabel: 'Shared',  icon: '💌' },
  { to: '/friends', label: 'Friends',     shortLabel: 'Friends', icon: '🤝' },
  { to: '/ghost',   label: 'Ghost Wall',  shortLabel: 'Ghost',   icon: '👻' },
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
        <span className="navbar-title hide-on-mobile">Memory Capsule</span>
      </NavLink>

      <div className="navbar-nav">
        {NAV_ITEMS.map(({ to, label, shortLabel, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span>{icon}</span>
            {/* Show full label on desktop, short on mobile bottom bar */}
            <span className="hide-on-mobile">{label}</span>
            <span className="show-on-mobile">{shortLabel}</span>
          </NavLink>
        ))}
      </div>

      <div className="navbar-actions" style={{ gap: 'var(--space-2)' }}>
        <NavLink to="/profile" className="nav-link" style={{ padding: 'var(--space-1) var(--space-2)', gap: 'var(--space-2)' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} className="avatar avatar-sm" />
          ) : (
            <div className="avatar avatar-sm avatar-placeholder"
              style={{ background: 'var(--gradient-amber)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, borderRadius: '50%', flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <span className="hide-on-mobile" style={{ whiteSpace: 'nowrap' }}>{user?.username}</span>
        </NavLink>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout" style={{ padding: 'var(--space-2) var(--space-3)', flexShrink: 0 }}>
          <span className="hide-on-mobile">Logout</span>
          <span className="show-on-mobile" style={{ fontSize: '1.1rem', lineHeight: 1 }}>🚪</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
