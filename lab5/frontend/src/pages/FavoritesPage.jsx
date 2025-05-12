import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';

import BookingModal from '../components/BookingModal';
import EventModal from '../components/EventModal';
import EventCard from '../components/EventCard';

function FavoritesPage() {
    const [favorites, setFavorites] = useState([]);
    const [selectedFavorite, setSelectedFavorite] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const token = await user.getIdToken();

                const response = await fetch('/api/favorites', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Не вдалося отримати улюблені події');
                const favoritesData = await response.json();

                const enriched = await Promise.all(favoritesData.map(async favorite => {
                    const res = await fetch(`/api/events/${favorite.eventId}`);
                    if (!res.ok) return null;
                    const event = await res.json();

                    return {
                        id: favorite.id,
                        eventId: event.id,
                        title: event.title,
                        date: event.date,
                        description: event.description,
                        place: event.place,
                        image: event.image,
                        pricePerTicket: event.price,
                    };
                }));

                const filtered = enriched.filter(Boolean);
                setFavorites(enriched);
            } catch (error) {
                console.error('Помилка при завантаженні улюблених подій:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, []);

    const removeFromFavorites = async (eventToRemove) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const token = await user.getIdToken();

            const response = await fetch(`/api/favorites/${eventToRemove.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Не вдалося видалити з улюблених');

            setFavorites(prev => prev.filter(f => f.id !== eventToRemove.id));
            alert(`Подію "${eventToRemove.title}" видалено з улюблених.`);
        } catch (error) {
            console.error('Помилка при видаленні з улюблених:', error);
        }
    };

    const handleBook = (eventToBook) => {
        setSelectedFavorite(eventToBook);
    };

    const confirmBooking = async (tickets) => {
        const user = auth.currentUser;
        if (!user || !selectedFavorite) return;

        try {
            const token = await user.getIdToken();

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: selectedFavorite.id,
                    tickets
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(errorData.message || 'Не вдалося забронювати.');
                return;
            }

            alert(`Ви забронювали ${tickets} квитків на "${selectedFavorite.title}"`);
            setSelectedFavorite(null);
        } catch (error) {
            console.error('Помилка при бронюванні:', error);
            alert('Не вдалося забронювати.');
        }
    };

    const handleCloseBookingModal = () => {
        setSelectedFavorite(null);
    };

    const openEventModal = (event) => {
        setSelectedEvent(event);
    };

    const closeEventModal = () => {
        setSelectedEvent(null);
    };

    return (
        <main>
            <section className="events">
                <h1>Улюблені події</h1>

                {loading ? (
                    <p>Завантаження...</p>
                ) : favorites.length === 0 ? (
                    <p>Немає улюблених подій.</p>
                ) : (
                    <div className="event-grid">
                        {favorites.map((fav) => (
                            <EventCard
                                key={fav.id}
                                event={fav}
                                onBook={handleBook}
                                onToggleFavorite={removeFromFavorites}
                                onOpenModal={openEventModal}
                                isFavoritePage={true}
                                actionLabel="Видалити з улюблених"
                            />
                        ))}
                    </div>
                )}

                {selectedFavorite && (
                    <BookingModal
                        event={selectedFavorite}
                        onClose={handleCloseBookingModal}
                        onConfirm={confirmBooking}
                    />
                )}

                {selectedEvent && (
                    <EventModal
                        event={selectedEvent}
                        onClose={closeEventModal}
                    />
                )}
            </section>
        </main>
    );
}

export default FavoritesPage;
