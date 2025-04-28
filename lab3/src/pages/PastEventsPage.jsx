import React, { useEffect, useState } from 'react';
import EventModal from '../components/EventModal'; // імпортуємо готову модалку

function PastEventsPage() {
    const [pastEvents, setPastEvents] = useState([]);
    const [eventType, setEventType] = useState('Всі');
    const [selectedEvent, setSelectedEvent] = useState(null); // для модалки

    useEffect(() => {
        const allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];
        const today = new Date();

        const filteredPastEvents = allEvents.filter(ev => {
            const eventDate = parseDate(ev.date);
            return eventDate < today;
        });

        setPastEvents(filteredPastEvents);
    }, []);

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
                        filteredEvents.map((event, index) => (
                            <div
                                key={index}
                                className="event-card"
                                onClick={() => handleCardClick(event)} // додано клік по картці
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={event.image} alt={event.title} />
                                <h2>{event.title}</h2>
                                <p>Дата: {event.date}</p>
                                <p>Місце: {event.place}</p>
                                <p>Ціна: {event.price} грн</p>
                            </div>
                        ))
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
