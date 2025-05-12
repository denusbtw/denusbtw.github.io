import React, { useEffect, useState } from 'react';
import EventModal from '../components/EventModal';
import { auth } from '../firebase';
import { getIdToken } from 'firebase/auth';

function PastEventsPage() {
    const [pastEvents, setPastEvents] = useState([]);
    const [eventType, setEventType] = useState('Всі');
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedEventData, setSelectedEventData] = useState(null);
    const [favoriteEventIds, setFavoriteEventIds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventRes = await fetch('/api/events?past=true');
                const pastData = await eventRes.json();
                setPastEvents(pastData);

                const user = auth.currentUser;
                if (!user) return;

                const token = localStorage.getItem('firebaseToken');
                const favRes = await fetch('/api/favorites', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (favRes.ok) {
                    const favEvents = await favRes.json();
                    const favIds = favEvents.map(ev => ev.id);
                    setFavoriteEventIds(favIds);
                }
            } catch (error) {
                console.error("Помилка при завантаженні:", error);
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
                console.error("Помилка при завантаженні події:", error);
            }
        };

        fetchEvent();
    }, [selectedEventId]);

    const handleToggleFavorite = async (event) => {
        const user = auth.currentUser;
        if (!user) {
            alert('Увійдіть, щоб використовувати улюблені');
            return;
        }

        const token = localStorage.getItem('firebaseToken');
        const isFavorite = favoriteEventIds.includes(event.id);

        try {
            if (isFavorite) {
                const res = await fetch(`/api/favorites/${event.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    setFavoriteEventIds(prev => prev.filter(id => id !== event.id));
                    alert(`Видалено з улюблених: ${event.title}`);
                }
            } else {
                const res = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ eventId: event.id })
                });

                if (res.ok) {
                    setFavoriteEventIds(prev => [...prev, event.id]);
                    alert(`Додано до улюблених: ${event.title}`);
                }
            }
        } catch (error) {
            console.error("Помилка при оновленні улюбленого:", error);
        }
    };

    const filteredEvents = pastEvents.filter(event => {
        if (eventType === 'Всі') return true;
        return event.type === eventType;
    });

    const handleCardClick = (event) => setSelectedEventId(event.id);
    const handleCloseModal = () => {
        setSelectedEventId(null);
        setSelectedEventData(null);
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

                {selectedEventData && (
                    <EventModal
                        event={selectedEventData}
                        onClose={handleCloseModal}
                    />
                )}
            </section>
        </main>
    );
}

export default PastEventsPage;
