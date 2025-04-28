import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <header>
            <nav className="navbar">
                <input type="checkbox" id="menu-toggle" />
                <label htmlFor="menu-toggle" className="menu-icon">&#9776;</label>

                <ul className="nav-links">
                    <li><Link to="/">Майбутні події</Link></li>
                    <li><Link to="/past-events">Минулі події</Link></li>
                    <li><Link to="/bookings">Мої бронювання</Link></li>
                    <li><Link to="/favorites">Улюблені</Link></li>
                    <li><Link to="/about">Про нас</Link></li>
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;
