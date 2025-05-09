import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    getDoc,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';

import BookingModal from '../components/BookingModal';
import EventModal from '../components/EventModal';
import EventCard from '../components/EventCard';

function FavoritesPage() {
    const [favorites, setFavorites] = useState([]);
    const [selectedFavorite, setSelectedFavorite] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const fetchFavorites = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const q = query(collection(db, 'favorites'), where('user_id', '==', user.uid));
                const favSnap = await getDocs(q);

                const favEvents = await Promise.all(
                    favSnap.docs.map(async (docSnap) => {
                        const favData = docSnap.data();
                        const eventRef = doc(db, 'events', favData.event_id);
                        const eventSnap = await getDoc(eventRef);
                        if (!eventSnap.exists()) return null;

                        return {
                            ...eventSnap.data(),
                            eventId: favData.event_id,
                            favoriteDocId: docSnap.id
                        };
                    })
                );

                setFavorites(favEvents.filter(Boolean));
            } catch (error) {
                console.error('Помилка при завантаженні улюблених подій:', error);
            }
        };

        fetchFavorites();
    }, []);

    const removeFromFavorites = async (eventToRemove) => {
        try {
            await deleteDoc(doc(db, 'favorites', eventToRemove.favoriteDocId));
            setFavorites(favorites.filter(f => f.eventId !== eventToRemove.eventId));
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
            const eventRef = doc(db, 'events', selectedFavorite.eventId);
            const eventSnap = await getDoc(eventRef);
            const eventData = eventSnap.data();

            if (eventData.availableTickets < tickets) {
                alert(`Недостатньо квитків! Доступно лише ${eventData.availableTickets}`);
                return;
            }

            await updateDoc(eventRef, {
                availableTickets: eventData.availableTickets - tickets
            });

            await addDoc(collection(db, 'bookings'), {
                user_id: user.uid,
                event_id: selectedFavorite.eventId,
                tickets: tickets,
                timestamp: new Date()
            });

            alert(`Ви забронювали ${tickets} квитків на "${eventData.title}"`);
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
                <div className="event-grid">
                    {favorites.length === 0 ? (
                        <p>Немає улюблених подій.</p>
                    ) : (
                        favorites.map((fav) => (
                            <EventCard
                                key={fav.eventId}
                                event={fav}
                                onBook={handleBook}
                                onToggleFavorite={removeFromFavorites}
                                onOpenModal={openEventModal}
                                isFavoritePage={true}
                                actionLabel="Видалити з улюблених"
                            />
                        ))
                    )}
                </div>

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
