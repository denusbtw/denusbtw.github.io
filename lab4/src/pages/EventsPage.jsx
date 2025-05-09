import React, { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDocs,
    deleteDoc,
    query,
    where
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import CreateEventModal from '../components/CreateEventModal';
import BookingModal from '../components/BookingModal';

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortOrder, setSortOrder] = useState('asc');
    const [eventType, setEventType] = useState('Всі');
    const [bookingEvent, setBookingEvent] = useState(null);
    const [favoriteEventIds, setFavoriteEventIds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventSnapshot = await getDocs(collection(db, 'events'));
                const fetchedEvents = eventSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEvents(fetchedEvents);

                const user = auth.currentUser;
                if (!user) return;

                const favQuery = query(collection(db, 'favorites'), where('user_id', '==', user.uid));
                const favSnapshot = await getDocs(favQuery);

                const favIds = favSnapshot.docs.map(doc => doc.data().event_id);
                setFavoriteEventIds(favIds);
            } catch (error) {
                console.error('Помилка при завантаженні даних з Firestore:', error);
            }
        };

        fetchData();
    }, []);

    const handleOpenModal = (event) => setSelectedEvent(event);
    const handleCloseModal = () => setSelectedEvent(null);
    const handleOpenCreateModal = () => setShowCreateModal(true);
    const handleCloseCreateModal = () => setShowCreateModal(false);

    const handleCreateEvent = (newEvent) => {
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        setShowCreateModal(false);
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
            const eventRef = doc(db, "events", bookingEvent.id);
            const newAvailable = bookingEvent.availableTickets - tickets;

            if (newAvailable < 0) {
                alert(`Недостатньо квитків. Доступно лише ${bookingEvent.availableTickets}`);
                return;
            }

            await updateDoc(eventRef, { availableTickets: newAvailable });

            await addDoc(collection(db, "bookings"), {
                user_id: user.uid,
                event_id: bookingEvent.id,
                tickets: tickets,
                timestamp: new Date()
            });

            alert(`Заброньовано ${tickets} квитків на "${bookingEvent.title}"`);
            setBookingEvent(null);

            // Оновлюємо локальний список подій
            setEvents(events.map(ev =>
                ev.id === bookingEvent.id
                    ? { ...ev, availableTickets: newAvailable }
                    : ev
            ));
        } catch (error) {
            console.error("Помилка при бронюванні:", error);
            alert("Щось пішло не так при бронюванні.");
        }
    };

    const handleToggleFavorite = async (eventToToggle) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Увійдіть, щоб додати до улюблених');
            return;
        }

        const isFav = favoriteEventIds.includes(eventToToggle.id);

        try {
            if (isFav) {
                const favQuery = query(
                    collection(db, 'favorites'),
                    where('user_id', '==', user.uid),
                    where('event_id', '==', eventToToggle.id)
                );
                const favSnapshot = await getDocs(favQuery);
                favSnapshot.forEach(async (docSnap) => {
                    await deleteDoc(doc(db, 'favorites', docSnap.id));
                });

                setFavoriteEventIds(prev => prev.filter(id => id !== eventToToggle.id));
                alert(`Видалено з улюблених: ${eventToToggle.title}`);
            } else {
                await addDoc(collection(db, 'favorites'), {
                    user_id: user.uid,
                    event_id: eventToToggle.id
                });

                setFavoriteEventIds(prev => [...prev, eventToToggle.id]);
                alert(`Додано до улюблених: ${eventToToggle.title}`);
            }
        } catch (error) {
            console.error('Помилка при оновленні улюбленого:', error);
            alert('Щось пішло не так.');
        }
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
