import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

function CreateEventModal({ onClose, onCreate }) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [place, setPlace] = useState('');
    const [price, setPrice] = useState('');
    const [tickets, setTickets] = useState('');
    const [image, setImage] = useState(null);
    const [description, setDescription] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !date || !place || !price || !tickets || !image) {
            alert('Будь ласка, заповніть всі обов\'язкові поля.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (event) {
            const newEvent = {
                title,
                date,
                place,
                price: parseInt(price),
                availableTickets: parseInt(tickets),
                image: event.target.result,
                description,
            };

            try {
                const docRef = await addDoc(collection(db, 'events'), newEvent);
                alert('Подію створено!');
                onCreate({ id: docRef.id, ...newEvent });
                onClose();
            } catch (error) {
                console.error('Помилка при створенні події:', error);
                alert('Не вдалося створити подію.');
            }
        };

        reader.readAsDataURL(image);
    };

    return (
        <div className="modal">
            <div className="modal-content">
            <span className="close-create-modal" onClick={onClose}>
                &times;
            </span>
                <h2>Нова подія</h2>
                <form id="create-event-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Назва події"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Дата (наприклад: 25 квітня 2025)"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Місце проведення"
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Ціна (грн)"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files[0])}
                        required
                    />
                    <textarea
                        placeholder="Опис події"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Кількість квитків"
                        value={tickets}
                        onChange={(e) => setTickets(e.target.value)}
                        required
                    />
                    <button type="submit">Створити</button>
                </form>
            </div>
        </div>
    );
}

export default CreateEventModal;