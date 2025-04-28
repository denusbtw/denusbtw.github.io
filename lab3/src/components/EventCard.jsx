import React from 'react';

function EventCard({ event, onBook, onToggleFavorite, onOpenModal, isFavoritePage = false, actionLabel = "Додати до улюблених" }) {
    const handleCardClick = () => {
        onOpenModal(event);
    };

    const handleBookClick = (e) => {
        e.stopPropagation();
        onBook(event);
    };

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        onToggleFavorite(event);
    };

    // Автоматичний клас для другої кнопки
    const actionButtonClass = actionLabel.includes('Скасувати') || actionLabel.includes('Видалити')
        ? 'remove-favorite-btn'
        : 'toggle-favorite-btn';

    return (
        <article className="event-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <img src={event.image} alt={event.title} />
            <h2>{event.title}</h2>
            <p>Дата: {event.date}</p>
            <p>Місце: {event.place}</p>
            {event.price && <p>Ціна: {event.price} грн</p>}
            {event.tickets && <p>Кількість: {event.tickets}</p>}
            {event.totalAmount && <p>Сума: {event.totalAmount} грн</p>}
            {event.availableTickets !== undefined && (
                <p className="available-tickets">
                    Вільно: {event.availableTickets}
                </p>
            )}

            <button className="book-btn" onClick={handleBookClick}>
                Забронювати
            </button>

            <button
                className={actionButtonClass}
                onClick={handleFavoriteClick}
            >
                {actionLabel}
            </button>
        </article>
    );
}

export default EventCard;
