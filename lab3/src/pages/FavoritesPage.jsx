import React, { useEffect, useState } from 'react';
import BookingModal from '../components/BookingModal';
import EventModal from '../components/EventModal';
import EventCard from '../components/EventCard'; // імпортуємо EventCard

function FavoritesPage() {
    const [favorites, setFavorites] = useState([]);
    const [selectedFavorite, setSelectedFavorite] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const storedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorites(storedFavorites);
    }, []);

    const removeFromFavorites = (eventToRemove) => {
        const updatedFavorites = favorites.filter(fav =>
            !(fav.title === eventToRemove.title && fav.date === eventToRemove.date)
        );

        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        alert(`Подію "${eventToRemove.title}" видалено з улюблених.`);
    };

    const handleBook = (eventToBook) => {
        setSelectedFavorite(eventToBook);
    };

    const confirmBooking = (tickets) => {
        if (!tickets || tickets <= 0) {
            alert('Кількість квитків має бути більше 0.');
            return;
        }

        let allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];
        const eventIndex = allEvents.findIndex(ev =>
            ev.title === selectedFavorite.title && ev.date === selectedFavorite.date
        );

        if (eventIndex !== -1) {
            const available = allEvents[eventIndex].availableTickets;
            if (available < tickets) {
                alert(`Недостатньо квитків! Доступно лише ${available}`);
                return;
            }
            allEvents[eventIndex].availableTickets -= tickets;
            localStorage.setItem('allEvents', JSON.stringify(allEvents));
        }

        const bookingDetails = {
            image: selectedFavorite.image,
            title: selectedFavorite.title,
            date: selectedFavorite.date,
            place: selectedFavorite.place,
            tickets,
            pricePerTicket: selectedFavorite.price,
            totalAmount: tickets * selectedFavorite.price
        };

        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        bookings.push(bookingDetails);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        alert(`Ви забронювали ${tickets} квитків на "${selectedFavorite.title}"`);
        setSelectedFavorite(null);
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
                        favorites.map((fav, index) => (
                            <EventCard
                                key={fav.title + fav.date}
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
