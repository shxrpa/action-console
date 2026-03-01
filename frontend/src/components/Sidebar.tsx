import { Link } from 'react-router-dom';

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li>
            <Link to="/" className="nav-link">
              Home
            </Link>
          </li>
          <li>
            <Link to="/collections" className="nav-link">
              Collections
            </Link>
          </li>
          <li>
            <Link to="/variables" className="nav-link">
              Variable Wallet
            </Link>
          </li>
          <li>
            <Link to="/runs" className="nav-link">
              Run History
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
