import React, { useEffect, useState } from 'react';
import EventModal from '../components/EventModal';
import { db, auth } from '../firebase';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    query,
    where,
    doc
} from 'firebase/firestore';

function PastEventsPage() {
    const [pastEvents, setPastEvents] = useState([]);
    const [eventType, setEventType] = useState('Всі');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [favoriteEventIds, setFavoriteEventIds] = useState([]);

    useEffect(() => {
        const fetchPastEvents = async () => {
            try {
                const eventSnapshot = await getDocs(collection(db, "events"));
                const allEvents = eventSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const today = new Date();

                const filteredPastEvents = allEvents.filter(ev => {
                    const eventDate = parseDate(ev.date);
                    return eventDate < today;
                });

                setPastEvents(filteredPastEvents);
            } catch (error) {
                console.error("Помилка при завантаженні подій:", error);
            }
        };

        const fetchFavorites = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const favQuery = query(collection(db, 'favorites'), where('user_id', '==', user.uid));
                const favSnapshot = await getDocs(favQuery);
                const favIds = favSnapshot.docs.map(doc => doc.data().event_id);
                setFavoriteEventIds(favIds);
            } catch (error) {
                console.error('Помилка при завантаженні улюблених:', error);
            }
        };

        fetchPastEvents();
        fetchFavorites();
    }, []);

    const handleToggleFavorite = async (event) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Увійдіть, щоб використовувати улюблені');
            return;
        }

        const isFavorite = favoriteEventIds.includes(event.id);

        try {
            if (isFavorite) {
                const favQuery = query(
                    collection(db, 'favorites'),
                    where('user_id', '==', user.uid),
                    where('event_id', '==', event.id)
                );
                const favSnapshot = await getDocs(favQuery);
                favSnapshot.forEach(async (docSnap) => {
                    await deleteDoc(doc(db, 'favorites', docSnap.id));
                });

                setFavoriteEventIds(prev => prev.filter(id => id !== event.id));
                alert(`Видалено з улюблених: ${event.title}`);
            } else {
                await addDoc(collection(db, 'favorites'), {
                    user_id: user.uid,
                    event_id: event.id
                });

                setFavoriteEventIds(prev => [...prev, event.id]);
                alert(`Додано до улюблених: ${event.title}`);
            }
        } catch (error) {
            console.error("Помилка при оновленні улюбленого:", error);
        }
    };

    function parseDate(dateStr) {
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

    const filteredEvents = pastEvents.filter(event => {
        if (eventType === 'Всі') return true;
        return event.type === eventType;
    });

    const handleCardClick = (event) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    return (
        <main>
            <section className="events">
                <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Минулі Події</h1>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
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
                        <option value="Виставка">Виставки</option>
                    </select>
                </div>

                <div className="event-grid">
                    {filteredEvents.length === 0 ? (
                        <p>Немає минулих подій для вибраного типу.</p>
                    ) : (
                        filteredEvents.map((event) => {
                            const isFav = favoriteEventIds.includes(event.id);
                            return (
                                <div
                                    key={event.id}
                                    className="event-card"
                                    onClick={() => handleCardClick(event)}
                                    style={{ cursor: 'pointer', position: 'relative' }}
                                >
                                    <img src={event.image} alt={event.title} />
                                    <h2>{event.title}</h2>
                                    <p>Дата: {event.date}</p>
                                    <p>Місце: {event.place}</p>
                                    <p>Ціна: {event.price} грн</p>

                                    <button
                                        className={isFav ? 'remove-favorite-btn' : 'toggle-favorite-btn'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFavorite(event);
                                        }}
                                    >
                                        {isFav ? 'Видалити з улюблених' : 'Додати до улюблених'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {selectedEvent && (
                    <EventModal
                        event={selectedEvent}
                        onClose={handleCloseModal}
                    />
                )}
            </section>
        </main>
    );
}

export default PastEventsPage;
