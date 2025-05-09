import React from 'react';

function EventCard({
                       event,
                       onBook,
                       onToggleFavorite,
                       onOpenModal,
                       isFavorite = false,
                       isFavoritePage = false,
                       actionLabel
                   }) {
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

    // Визначаємо текст кнопки
    const favoriteButtonText =
        actionLabel || (isFavorite ? 'Видалити з улюблених' : 'Додати до улюблених');

    const actionButtonClass = favoriteButtonText.includes('Скасувати') || favoriteButtonText.includes('Видалити')
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
                <p className="available-tickets">Вільно: {event.availableTickets}</p>
            )}

            <button className="book-btn" onClick={handleBookClick}>
                Забронювати
            </button>

            <button className={actionButtonClass} onClick={handleFavoriteClick}>
                {favoriteButtonText}
            </button>
        </article>
    );
}

export default EventCard;
