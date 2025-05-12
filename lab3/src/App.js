import React from 'react';
import './styles/style.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import EventsPage from './pages/EventsPage';
import BookingsPage from './pages/BookingsPage';
import FavoritesPage from './pages/FavoritesPage';
import PastEventsPage from "./pages/PastEventsPage";
import AboutPage from "./pages/AboutPage";

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<EventsPage />} />
                 <Route path="/past-events" element={<PastEventsPage />} />
                 <Route path="/bookings" element={<BookingsPage />} />
                 <Route path="/favorites" element={<FavoritesPage />} />
                 <Route path="/about" element={<AboutPage />} />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;
