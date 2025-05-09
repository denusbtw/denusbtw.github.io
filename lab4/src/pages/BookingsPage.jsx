import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    deleteDoc,
    updateDoc,
    addDoc
} from 'firebase/firestore';
import RatingStars from '../components/RatingStars';

function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [ratedEventIds, setRatedEventIds] = useState({});

    useEffect(() => {
        const fetchBookings = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const q = query(collection(db, 'bookings'), where('user_id', '==', user.uid));
                const snapshot = await getDocs(q);

                const data = await Promise.all(
                    snapshot.docs.map(async (bookingDoc) => {
                        const booking = bookingDoc.data();
                        const eventRef = doc(db, 'events', booking.event_id);
                        const eventSnap = await getDoc(eventRef);

                        if (!eventSnap.exists()) return null;

                        const eventData = eventSnap.data();
                        return {
                            bookingId: bookingDoc.id,
                            eventId: booking.event_id,
                            tickets: booking.tickets,
                            pricePerTicket: eventData.price,
                            totalAmount: booking.tickets * eventData.price,
                            ...eventData
                        };
                    })
                );

                setBookings(data.filter(Boolean));
            } catch (error) {
                console.error('Помилка при завантаженні бронювань:', error);
            }
        };

        const fetchRatings = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(collection(db, 'ratings'), where('user_id', '==', user.uid));
            const snapshot = await getDocs(q);
            const rated = {};
            snapshot.docs.forEach(doc => {
                rated[doc.data().event_id] = doc.data().rating;
            });
            setRatedEventIds(rated);
        };

        fetchBookings();
        fetchRatings();
    }, []);

    const isPast = (dateStr) => {
        const months = {
            'січня': 0, 'лютого': 1, 'березня': 2,
            'квітня': 3, 'травня': 4, 'червня': 5,
            'липня': 6, 'серпня': 7, 'вересня': 8,
            'жовтня': 9, 'листопада': 10, 'грудня': 11
        };
        const parts = dateStr.split(' ');
        const date = new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
        return date < new Date();
    };

    const submitRating = async (eventId, rating) => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const existingQuery = query(
                collection(db, 'ratings'),
                where('user_id', '==', user.uid),
                where('event_id', '==', eventId)
            );
            const snapshot = await getDocs(existingQuery);

            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await updateDoc(doc(db, 'ratings', docId), { rating });
            } else {
                await addDoc(collection(db, 'ratings'), {
                    user_id: user.uid,
                    event_id: eventId,
                    rating: rating
                });
            }

            setRatedEventIds(prev => ({ ...prev, [eventId]: rating }));
        } catch (error) {
            console.error('Помилка при збереженні оцінки:', error);
            alert('Не вдалося зберегти оцінку.');
        }
    };

    const cancelBooking = async (bookingToCancel) => {
        const bookingRef = doc(db, 'bookings', bookingToCancel.bookingId);
        const eventRef = doc(db, 'events', bookingToCancel.eventId);

        try {
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
                const currentAvailable = eventSnap.data().availableTickets;
                await updateDoc(eventRef, {
                    availableTickets: currentAvailable + bookingToCancel.tickets
                });
            }

            await deleteDoc(bookingRef);
            setBookings(prev =>
                prev.filter(b => b.bookingId !== bookingToCancel.bookingId)
            );

            alert('Бронювання скасовано.');
        } catch (error) {
            console.error('Помилка при скасуванні бронювання:', error);
            alert('Не вдалося скасувати.');
        }
    };

    return (
        <main>
            <section className="events">
                <h1>Мої Бронювання</h1>
                <div className="event-grid">
                    {bookings.length === 0 ? (
                        <p>Немає заброньованих подій.</p>
                    ) : (
                        bookings.map((booking) => (
                            <div key={booking.bookingId} className="event-card">
                                <img src={booking.image} alt={booking.title} />
                                <h2>{booking.title}</h2>
                                <p>Дата: {booking.date}</p>
                                <p>Місце: {booking.place}</p>
                                <p>Ціна: {booking.pricePerTicket} грн</p>
                                <p>Кількість: {booking.tickets}</p>
                                <p>Сума: {booking.totalAmount} грн</p>

                                {!isPast(booking.date) && (
                                    <button className="remove-favorite-btn" onClick={() => cancelBooking(booking)}>
                                        Скасувати бронювання
                                    </button>
                                )}

                                {isPast(booking.date) && (
                                    <RatingStars
                                        currentRating={ratedEventIds[booking.eventId] || 0}
                                        onRate={(star) => submitRating(booking.eventId, star)}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}

export default BookingsPage;