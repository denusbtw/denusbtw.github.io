import React, { useState } from 'react';

function BookingModal({ event, onClose, onConfirm }) {
    const [tickets, setTickets] = useState(1);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (tickets <= 0) {
            alert('Кількість квитків має бути більше 0.');
            return;
        }
        onConfirm(tickets);
    };

    return (
        <div className="modal" style={{ display: 'block' }}>
            <div className="modal-content">
                <span className="close-create-modal" onClick={onClose}>&times;</span>
                <h2>Бронювання: {event.title}</h2>
                <p><strong>Місце:</strong> {event.place}</p>
                <p><strong>Ціна за квиток:</strong> {event.price} грн</p>

                <form onSubmit={handleSubmit} id="create-event-form">
                    <input
                        type="number"
                        min="1"
                        value={tickets}
                        onChange={(e) => setTickets(parseInt(e.target.value) || 1)}
                        placeholder="Кількість квитків"
                        required
                    />
                    <br/><br/>
                    <button type="submit" style={{ marginTop: '10px' }}>Підтвердити бронювання</button>
                </form>
            </div>
        </div>
    );
}

export default BookingModal;
