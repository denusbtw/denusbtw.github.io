import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import CreateEventModal from '../components/CreateEventModal';
import BookingModal from '../components/BookingModal';


const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortOrder, setSortOrder] = useState('asc'); // asc або desc
    const [eventType, setEventType] = useState('Всі'); // Всі або конкретний тип (Концерт, Театр і т.д.)
    const [bookingEvent, setBookingEvent] = useState(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const response = await fetch('/events.json');
                const serverEvents = await response.json();

                let allEvents = JSON.parse(localStorage.getItem('allEvents'));

                if (!allEvents) {
                    const localEvents = JSON.parse(localStorage.getItem('localEvents')) || [];
                    const initializedEvents = serverEvents.map(ev => ({
                        ...ev,
                        availableTickets: ev.availableTickets ?? 200,
                        type: ev.type ?? "Інше" // якщо немає type — ставимо "Інше"
                    }));

                    allEvents = [...initializedEvents, ...localEvents];
                    localStorage.setItem('allEvents', JSON.stringify(allEvents));
                }

                setEvents(allEvents);
            } catch (error) {
                console.error('Помилка при завантаженні подій:', error);
            }
        }

        fetchEvents();
    }, []);

    const handleOpenModal = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    const handleOpenCreateModal = () => {
        setShowCreateModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
    };

    const handleCreateEvent = (newEvent) => {
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        localStorage.setItem('allEvents', JSON.stringify(updatedEvents));
        setShowCreateModal(false);
    };

    const handleBook = (eventToBook) => {
        setBookingEvent(eventToBook);
    };

    const handleConfirmBooking = (tickets) => {
        if (!bookingEvent) return;

        let updatedEvents = [...events];
        const eventIndex = updatedEvents.findIndex(ev =>
            ev.title === bookingEvent.title && ev.date === bookingEvent.date
        );

        if (eventIndex !== -1) {
            const available = updatedEvents[eventIndex].availableTickets;
            if (available < tickets) {
                alert(`Недостатньо квитків! Доступно лише ${available}`);
                return;
            }

            updatedEvents[eventIndex].availableTickets -= tickets;
            setEvents(updatedEvents);
            localStorage.setItem('allEvents', JSON.stringify(updatedEvents));
        }

        const bookingDetails = {
            image: bookingEvent.image,
            title: bookingEvent.title,
            date: bookingEvent.date,
            place: bookingEvent.place,
            tickets,
            pricePerTicket: bookingEvent.price,
            totalAmount: tickets * bookingEvent.price
        };

        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        bookings.push(bookingDetails);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        alert(`Ви забронювали ${tickets} квитків на "${bookingEvent.title}"`);
        setBookingEvent(null);
    };

    const handleToggleFavorite = (eventToToggle) => {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isAlreadyFavorite = favorites.some(fav => fav.title === eventToToggle.title && fav.date === eventToToggle.date);

        if (isAlreadyFavorite) {
            favorites = favorites.filter(fav => !(fav.title === eventToToggle.title && fav.date === eventToToggle.date));
            alert(`Видалено з улюблених: ${eventToToggle.title}`);
        } else {
            favorites.push(eventToToggle);
            alert(`Додано до улюблених: ${eventToToggle.title}`);
        }

        localStorage.setItem('favorites', JSON.stringify(favorites));
    };

    const filteredEvents = events
        .filter(event => parseDate(event.date) > new Date())
        .filter(event => {
            if (eventType === 'Всі') return true;
            return event.type === eventType;
        })
        .sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

    return (
        <main>
            <section className="events">
                <div className="events-header">
                    <h1>Майбутні Події</h1>
                    <button id={"create-event-btn"} onClick={handleOpenCreateModal}>Створити подію</button>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="filter-select"
                    >
                        <option value="asc">Сортувати: Найближчі події</option>
                        <option value="desc">Сортувати: Найдальші події</option>
                    </select>

                    <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="filter-select"
                    >
                        <option value="Всі">Всі типи</option>
                        <option value="Концерт">Концерти</option>
                        <option value="Театр">Театри</option>
                        <option value="Фестиваль">Фестивалі</option>
                        <option value="Кіно">Кіно</option>
                        <option value="Майстер-клас">Майстер-класи</option>
                        <option value="Конференція">Конференції</option>
                        <option value="Виставка">Виставка</option>
                    </select>
                </div>

                <div className="event-grid">
                    {filteredEvents.map(event => (
                        <EventCard
                            key={event.title + event.date}
                            event={event}
                            onBook={handleBook}
                            onToggleFavorite={handleToggleFavorite}
                            onOpenModal={handleOpenModal}
                        />
                    ))}
                </div>
            </section>

            {bookingEvent && (
                <BookingModal
                    event={bookingEvent}
                    onClose={() => setBookingEvent(null)}
                    onConfirm={handleConfirmBooking}
                />
            )}

            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={handleCloseModal}
                />
            )}

            {showCreateModal && (
                <CreateEventModal
                    onClose={handleCloseCreateModal}
                    onCreate={handleCreateEvent}
                />
            )}
        </main>
    );
};

function parseDate(dateStr) {
    const months = {
        'січня': 0, 'лютого': 1, 'березня': 2,
        'квітня': 3, 'травня': 4, 'червня': 5,
        'липня': 6, 'серпня': 7, 'вересня': 8,
        'жовтня': 9, 'листопада': 10, 'грудня': 11
    };

    const parts = dateStr.split(' ');
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
}

export default EventsPage;
