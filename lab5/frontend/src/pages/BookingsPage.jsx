import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import RatingStars from '../components/RatingStars';
import BookingModal from '../components/BookingModal';

function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [ratedEventIds, setRatedEventIds] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingBooking, setEditingBooking] = useState(null);
    const [averageRatings, setAverageRatings] = useState({});


    useEffect(() => {
        const fetchBookings = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const token = await user.getIdToken();
                const uid = user.uid;

                const res = await fetch('/api/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const bookingsData = await res.json();

                const enriched = await Promise.all(bookingsData.map(async booking => {
                    const eventRes = await fetch(`/api/events/${booking.eventId}`);
                    if (!eventRes.ok) return null;
                    const event = await eventRes.json();

                    return {
                        id: booking.id,
                        eventId: event.id,
                        title: event.title,
                        date: event.date,
                        place: event.place,
                        tickets: booking.tickets,
                        image: event.image,
                        pricePerTicket: event.price,
                        totalAmount: booking.tickets * event.price
                    };
                }));

                const valid = enriched.filter(Boolean);
                setBookings(valid);

                const avgMap = {};
                for (const booking of valid) {
                    const r = await fetch(`/api/events/${booking.eventId}/ratings?page=1`);
                    if (r.ok) {
                        const data = await r.json();
                        avgMap[booking.eventId] = data.average || 0;
                    }
                }
                setAverageRatings(avgMap);

                const ratingsMap = {};
                for (const booking of valid) {
                    const r = await fetch(`/api/events/${booking.eventId}/ratings?page=1`);
                    if (r.ok) {
                        const data = await r.json();
                        const userRating = data.ratings.find(r => r.userId === uid);
                        if (userRating) {
                            ratingsMap[booking.eventId] = {
                                value: userRating.rating,
                                id: userRating.id
                            };
                        }
                    }
                }

                setRatedEventIds(ratingsMap);
            } catch (e) {
                console.error('❌ Fetch error:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const isPast = (dateStr) => {
        if (!dateStr) return false;
        const months = {
            'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3,
            'травня': 4, 'червня': 5, 'липня': 6, 'серпня': 7,
            'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11
        };
        try {
            const [day, month, year] = dateStr.split(' ');
            const date = new Date(parseInt(year), months[month], parseInt(day));
            return date < new Date();
        } catch {
            return false;
        }
    };

    const submitRating = async (eventId, rating) => {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        const existing = ratedEventIds[eventId];
        let res;

        try {
            if (existing?.id) {
                res = await fetch(`/api/events/${eventId}/ratings/${existing.id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating })
                });
            } else {
                res = await fetch(`/api/events/${eventId}/ratings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating })
                });
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                alert(data.message || 'Помилка при збереженні оцінки');
                return;
            }

            const updated = await fetch(`/api/events/${eventId}/ratings?page=1`);
            const data = await updated.json();
            const userRating = data.ratings.find(r => r.userId === user.uid);
            if (userRating) {
                setRatedEventIds(prev => ({
                    ...prev,
                    [eventId]: {
                        value: userRating.rating,
                        id: userRating.id
                    }
                }));
            }

            // 🔥 Оновлюємо середню оцінку
            if (typeof data.average === 'number') {
                setAverageRatings(prev => ({
                    ...prev,
                    [eventId]: data.average
                }));
            }

            alert(existing ? 'Оцінку оновлено!' : 'Оцінку додано!');
        } catch (e) {
            console.error('❌ Submit rating failed:', e);
            alert('Помилка при збереженні оцінки');
        }
    };

    const cancelBooking = async (id) => {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const res = await fetch(`/api/bookings/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            setBookings(prev => prev.filter(b => b.id !== id));
        } else {
            alert('Не вдалося скасувати бронювання');
        }
    };

    const handleUpdateTickets = (booking) => {
        setEditingBooking(booking);
    };

    const confirmUpdateTickets = async (quantity) => {
        const user = auth.currentUser;
        if (!user || !editingBooking) return;

        const token = await user.getIdToken();
        const res = await fetch(`/api/bookings/${editingBooking.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tickets: quantity })
        });

        if (res.ok) {
            setBookings(prev =>
                prev.map(b =>
                    b.id === editingBooking.id
                        ? {
                            ...b,
                            tickets: quantity,
                            totalAmount: quantity * b.pricePerTicket
                        }
                        : b
                )
            );
            setEditingBooking(null);
        } else {
            alert('Не вдалося оновити квитки');
        }
    };

    return (
        <main>
            <section className="events">
                <h1>Мої Бронювання</h1>

                {loading ? <p>Завантаження...</p> : bookings.length === 0 ? (
                    <p>Немає заброньованих подій.</p>
                ) : (
                    <div className="event-grid">
                        {bookings.map(b => (
                            <div key={b.id} className="event-card">
                                <img src={b.image} alt={b.title} />
                                <h2>{b.title}</h2>
                                <p>Дата: {b.date}</p>
                                <p>Місце: {b.place}</p>
                                <p>Ціна: {b.pricePerTicket} грн</p>
                                <p>Кількість: {b.tickets}</p>
                                <p>Сума: {b.totalAmount} грн</p>

                                <p>Середня оцінка: {averageRatings[b.eventId]?.toFixed(1) || '—'} / 5</p>

                                {!isPast(b.date) ? (
                                    <>
                                        <button onClick={() => handleUpdateTickets(b)}>
                                            Оновити кількість
                                        </button>
                                        <button className="remove-favorite-btn" onClick={() => cancelBooking(b.id)}>
                                            Скасувати бронювання
                                        </button>
                                    </>
                                ) : (
                                    <RatingStars
                                        currentRating={ratedEventIds[b.eventId]?.value || 0}
                                        onRate={(star) => submitRating(b.eventId, star)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {editingBooking && (
                    <BookingModal
                        event={editingBooking}
                        onClose={() => setEditingBooking(null)}
                        onConfirm={confirmUpdateTickets}
                    />
                )}
            </section>
        </main>
    );
}

export default BookingsPage;
