import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';

import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import CreateEventModal from '../components/CreateEventModal';
import BookingModal from '../components/BookingModal';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedEventData, setSelectedEventData] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortOrder, setSortOrder] = useState('asc');
    const [eventType, setEventType] = useState('Всі');
    const [bookingEvent, setBookingEvent] = useState(null);
    const [favoriteEventIds, setFavoriteEventIds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventRes = await fetch('/api/events');
                const eventsData = await eventRes.json();
                setEvents(eventsData);

                const user = auth.currentUser;
                if (!user) return;

                const token = await user.getIdToken();
                console.log(token);
                const favRes = await fetch('/api/favorites', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (favRes.ok) {
                    const favEvents = await favRes.json();
                    const favIds = favEvents.map(ev => ev.id);
                    setFavoriteEventIds(favIds);
                }
            } catch (error) {
                console.error('Помилка при завантаженні:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!selectedEventId) return;

            try {
                const res = await fetch(`/api/events/${selectedEventId}`);
                if (!res.ok) throw new Error('Не вдалося завантажити подію');
                const data = await res.json();
                setSelectedEventData(data);
            } catch (error) {
                console.error('Помилка при завантаженні події:', error);
            }
        };

        fetchEvent();
    }, [selectedEventId]);

    const handleOpenModal = (event) => setSelectedEventId(event.id);
    const handleCloseModal = () => {
        setSelectedEventId(null);
        setSelectedEventData(null);
    };

    const handleOpenCreateModal = () => setShowCreateModal(true);
    const handleCloseCreateModal = () => setShowCreateModal(false);

    const handleCreateEvent = async (newEvent) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Увійдіть, щоб створювати події');
            return;
        }

        try {
            const token = await user.getIdToken();

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newEvent)
            });

            if (!res.ok) throw new Error('Не вдалося створити подію');

            const savedEvent = await res.json();
            setEvents(prev => [...prev, savedEvent]);
            setShowCreateModal(false);
        } catch (error) {
            console.error('Помилка при створенні події:', error);
            alert('Створення події не вдалося.');
        }
    };

    const handleBook = (eventToBook) => setBookingEvent(eventToBook);

    const handleConfirmBooking = async (tickets) => {
        if (!bookingEvent) return;

        const user = auth.currentUser;
        if (!user) {
            alert("Увійдіть у систему, щоб бронювати квитки.");
            return;
        }

        try {
            const token = await user.getIdToken();

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: bookingEvent.id,
                    tickets
                })
            });

            if (!res.ok) throw new Error('Не вдалося забронювати');

            alert(`Заброньовано ${tickets} квитків на "${bookingEvent.title}"`);
            setBookingEvent(null);

            setEvents(events.map(ev =>
                ev.id === bookingEvent.id
                    ? { ...ev, availableTickets: ev.availableTickets - tickets }
                    : ev
            ));
        } catch (error) {
            console.error('Помилка при бронюванні:', error);
            alert('Щось пішло не так при бронюванні.');
        }
    };

    const handleToggleFavorite = async (eventToToggle) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Увійдіть, щоб додати до улюблених');
            return;
        }

        const token = await user.getIdToken();
        const isFav = favoriteEventIds.includes(eventToToggle.id);

        try {
            if (isFav) {
                const res = await fetch(`/api/favorites/${eventToToggle.id}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Не вдалося видалити з улюблених');

                setFavoriteEventIds(prev => prev.filter(id => id !== eventToToggle.id));
                alert(`Видалено з улюблених: ${eventToToggle.title}`);
            } else {
                const res = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ eventId: eventToToggle.id })
                });

                if (!res.ok) throw new Error('Не вдалося додати до улюблених');

                setFavoriteEventIds(prev => [...prev, eventToToggle.id]);
                alert(`Додано до улюблених: ${eventToToggle.title}`);
            }
        } catch (error) {
            console.error('Помилка при зміні улюбленого:', error);
            alert('Щось пішло не так.');
        }
    };

    const filteredEvents = events
        .filter(event => parseDate(event.date) > new Date())
        .filter(event => eventType === 'Всі' || event.type === eventType)
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
                    <button id="create-event-btn" onClick={handleOpenCreateModal}>Створити подію</button>
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
                            key={event.id}
                            event={event}
                            onBook={handleBook}
                            onToggleFavorite={handleToggleFavorite}
                            onOpenModal={handleOpenModal}
                            isFavorite={favoriteEventIds.includes(event.id)}
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

            {selectedEventData && (
                <EventModal
                    event={selectedEventData}
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
    if (!dateStr || typeof dateStr !== 'string') {
        console.warn('❗ Невалідна дата:', dateStr);
        return new Date(0);
    }

    const months = {
        'січня': 0, 'лютого': 1, 'березня': 2,
        'квітня': 3, 'травня': 4, 'червня': 5,
        'липня': 6, 'серпня': 7, 'вересня': 8,
        'жовтня': 9, 'листопада': 10, 'грудня': 11
    };

    const parts = dateStr.split(' ');
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}

export default EventsPage;
