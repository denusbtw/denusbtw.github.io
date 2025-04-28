import React, { useEffect, useState } from 'react';
import BookingModal from '../components/BookingModal';
import EventModal from '../components/EventModal';
import EventCard from '../components/EventCard'; // Імпортуємо EventCard

function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingBooking, setEditingBooking] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        const storedBookings = JSON.parse(localStorage.getItem('bookings')) || [];
        setBookings(storedBookings);
    }, []);

    const openUpdateModal = (booking) => {
        const index = bookings.findIndex(b =>
            b.title === booking.title && b.date === booking.date
        );
        setEditingIndex(index);
        setEditingBooking(booking);
    };

    const closeUpdateModal = () => {
        setEditingIndex(null);
        setEditingBooking(null);
    };

    const updateTickets = (newTicketQuantity) => {
        if (editingIndex === null) return;

        const updatedBookings = [...bookings];
        const currentBooking = updatedBookings[editingIndex];

        let allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];
        const eventIndex = allEvents.findIndex(ev => ev.title === currentBooking.title && ev.date === currentBooking.date);

        if (eventIndex !== -1) {
            const event = allEvents[eventIndex];
            const diff = newTicketQuantity - currentBooking.tickets;

            if (diff > 0 && event.availableTickets < diff) {
                alert(`Недостатньо квитків. Доступно: ${event.availableTickets}`);
                return;
            }

            event.availableTickets -= diff;
            localStorage.setItem('allEvents', JSON.stringify(allEvents));
        }

        currentBooking.tickets = newTicketQuantity;
        currentBooking.totalAmount = newTicketQuantity * currentBooking.pricePerTicket;

        setBookings(updatedBookings);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
        alert('Кількість квитків оновлено.');
        closeUpdateModal();
    };

    const cancelBooking = (bookingToCancel) => {
        const updatedBookings = bookings.filter(b =>
            !(b.title === bookingToCancel.title && b.date === bookingToCancel.date)
        );

        let allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];
        const eventIndex = allEvents.findIndex(ev =>
            ev.title === bookingToCancel.title && ev.date === bookingToCancel.date
        );

        if (eventIndex !== -1) {
            allEvents[eventIndex].availableTickets += bookingToCancel.tickets;
            localStorage.setItem('allEvents', JSON.stringify(allEvents));
        }

        setBookings(updatedBookings);
        localStorage.setItem('bookings', JSON.stringify(updatedBookings));
        alert('Бронювання скасовано.');
    };

    const openInfoModal = (booking) => {
        setSelectedBooking(booking);
    };

    const closeInfoModal = () => {
        setSelectedBooking(null);
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
                            <EventCard
                                key={booking.title + booking.date}
                                event={booking}
                                onBook={openUpdateModal}
                                onToggleFavorite={cancelBooking}
                                onOpenModal={openInfoModal}
                                actionLabel="Скасувати бронювання"
                            />
                        ))
                    )}
                </div>
            </section>

            {editingBooking && (
                <BookingModal
                    event={editingBooking}
                    onClose={closeUpdateModal}
                    onConfirm={updateTickets}
                />
            )}

            {selectedBooking && (
                <EventModal
                    event={selectedBooking}
                    onClose={closeInfoModal}
                />
            )}
        </main>
    );
}

export default BookingsPage;
