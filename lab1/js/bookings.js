document.addEventListener("DOMContentLoaded", () => {
    const eventGrid = document.querySelector('.event-grid');

    // Отримуємо бронювання з localStorage
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];

    if (bookings.length === 0) {
        eventGrid.innerHTML = "<p>Немає заброньованих подій.</p>";
    } else {
        bookings.forEach((booking, index) => {
            const eventCard = document.createElement('article');
            eventCard.classList.add('event-card');
            eventCard.setAttribute('data-id', index);

            // Додаємо відображення кількості квитків та загальної суми
            eventCard.innerHTML = `
                    <img src=${booking.image} alt="${booking.title}">
                    <h2>${booking.title}</h2>
                    <p>${booking.date}</p>
                    <p>${booking.place}</p>
                    <label for="ticket-quantity-${index}">Кількість квитків:</label>
                    <p id="ticket-quantity-${index}">Кількість: ${booking.tickets}</p>
                    <p>Сума: <span id="total-price-${index}">${booking.tickets * 350} грн</span></p> <!-- Вартість квитків -->
                    <button class="update-quantity-btn">Оновити кількість</button>
                    <button class="cancel-btn">Скасувати бронювання</button>
                    <button class="add-favorite-btn">Додати в улюблене</button>
                `;

            eventGrid.appendChild(eventCard);

            // Додаємо обробник для кнопки оновлення кількості квитків
            eventCard.querySelector('.update-quantity-btn').addEventListener('click', () => updateTickets(index));

            // Додаємо обробник для скасування бронювання
            eventCard.querySelector('.cancel-btn').addEventListener('click', () => cancelBooking(index, eventCard));
        });
    }
});

// Функція для оновлення кількості квитків
function updateTickets(index) {
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const newTicketQuantity = prompt("Введіть нову кількість квитків:", bookings[index].tickets);

    if (newTicketQuantity > 0) {
        bookings[index].tickets = parseInt(newTicketQuantity, 10);  // Оновлюємо кількість квитків
        localStorage.setItem('bookings', JSON.stringify(bookings));  // Зберігаємо нові дані в localStorage

        // Оновлюємо відображення на картці
        document.querySelector(`#ticket-quantity-${index}`).textContent = `Кількість: ${newTicketQuantity}`;
        document.querySelector(`#total-price-${index}`).textContent = `${newTicketQuantity * 350} грн`;  // Оновлюємо суму

        alert('Кількість квитків оновлено.');
    } else {
        alert('Кількість квитків має бути більше 0.');
    }
}

// Функція для скасування бронювання
function cancelBooking(index, eventCard) {
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    bookings.splice(index, 1);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    eventCard.remove();

    if (bookings.length === 0) {
        document.querySelector('.event-grid').innerHTML = "<p>Немає заброньованих подій.</p>";
    }

    alert('Бронювання скасовано.');
}