import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.scss';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && <div className='sidebar-overlay' onClick={onClose}></div>}
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className='sidebar-header'>
          <h2>Menu</h2>
          <button onClick={onClose} className='close-btn'>&times;</button>
        </div>
        <ul className='sidebar-menu'>
          <li>
            <Link to="/" onClick={onClose}>Home</Link>
          </li>
          <li>
            <Link to="/my-choices" onClick={onClose}>My Choices</Link>
          </li>
          <li>
            <Link to="/settings" onClick={onClose}>Settings</Link>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Sidebar;
