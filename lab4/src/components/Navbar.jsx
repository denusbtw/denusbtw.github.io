import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
    };

    return (
        <header>
            <nav className="navbar">
                <input type="checkbox" id="menu-toggle" />
                <label htmlFor="menu-toggle" className="menu-icon">&#9776;</label>

                <div className="nav-left">
                    <ul className="nav-links">
                        <li><Link to="/">Майбутні події</Link></li>
                        <li><Link to="/past-events">Минулі події</Link></li>
                        <li><Link to="/bookings">Мої бронювання</Link></li>
                        <li><Link to="/favorites">Улюблені</Link></li>
                        <li><Link to="/about">Про нас</Link></li>
                    </ul>
                </div>

                <div className="nav-right">
                    {user ? (
                        <>
                            <button onClick={handleLogout} className="logout-btn">Вийти</button>
                        </>
                    ) : (
                        <Link to="/login" className="login-link">Увійти</Link>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default Navbar;
