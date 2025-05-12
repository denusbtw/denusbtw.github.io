import React from 'react';

const EventModal = ({ event, onClose }) => {
    return (
        <div className={"modal active"} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close-modal" onClick={onClose}>&times;</span>
                <img id="modal-image" src={event.image} alt={event.title} />
                <h2>{event.title}</h2>
                <p>Дата: {event.date}</p>
                <p>Місце: {event.place}</p>
                <p>Ціна: {event.price} грн</p>
                <p>{event.description || "Опис відсутній"}</p>
            </div>
        </div>
    );
};

export default EventModal;
