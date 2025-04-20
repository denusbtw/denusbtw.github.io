document.addEventListener("DOMContentLoaded", () => {
    const eventGrid = document.querySelector('.event-grid');
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];

    if (bookings.length === 0) {
        eventGrid.innerHTML = "<p>Немає заброньованих подій.</p>";
    } else {
        bookings.forEach((booking, index) => {
            const eventCard = document.createElement('article');
            eventCard.classList.add('event-card');
            eventCard.setAttribute('data-id', index);

            eventCard.innerHTML = `
                <img src="${booking.image}" alt="${booking.title}">
                <h2>${booking.title}</h2>
                <p>${booking.date}</p>
                <p>${booking.place}</p>
                <label for="ticket-quantity-${index}">Кількість квитків:</label>
                <p id="ticket-quantity-${index}">Кількість: ${booking.tickets}</p>
                <p>Сума: <span id="total-price-${index}">${booking.totalAmount} грн</span></p>
                <button class="update-quantity-btn">Оновити кількість</button>
                <button class="cancel-btn">Скасувати бронювання</button>
                <button class="add-favorite-btn">Додати в улюблене</button>
            `;

            eventGrid.appendChild(eventCard);

            eventCard.querySelector('.update-quantity-btn').addEventListener('click', () => updateTickets(index));
            eventCard.querySelector('.cancel-btn').addEventListener('click', () => cancelBooking(index, eventCard));
        });
    }
});

function updateTickets(index) {
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    let allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];

    const currentBooking = bookings[index];
    const newTicketQuantity = parseInt(prompt("Введіть нову кількість квитків:", currentBooking.tickets), 10);

    if (isNaN(newTicketQuantity) || newTicketQuantity <= 0) {
        alert("Кількість квитків має бути більше 0.");
        return;
    }

    const diff = newTicketQuantity - currentBooking.tickets;
    const eventIndex = allEvents.findIndex(ev => ev.title === currentBooking.title && ev.date === currentBooking.date);

    if (eventIndex !== -1) {
        const event = allEvents[eventIndex];

        if (diff > 0 && event.availableTickets < diff) {
            alert(`Недостатньо квитків. Доступно: ${event.availableTickets}`);
            return;
        }

        event.availableTickets -= diff; // зменшуємо/збільшуємо
        localStorage.setItem('allEvents', JSON.stringify(allEvents));
    }

    currentBooking.tickets = newTicketQuantity;
    currentBooking.totalAmount = newTicketQuantity * currentBooking.pricePerTicket;
    localStorage.setItem('bookings', JSON.stringify(bookings));

    document.querySelector(`#ticket-quantity-${index}`).textContent = `Кількість: ${newTicketQuantity}`;
    document.querySelector(`#total-price-${index}`).textContent = `${currentBooking.totalAmount} грн`;

    alert('Кількість квитків оновлено.');
}

function cancelBooking(index, eventCard) {
    let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    let allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];

    const canceled = bookings[index];
    const eventIndex = allEvents.findIndex(ev => ev.title === canceled.title && ev.date === canceled.date);

    if (eventIndex !== -1) {
        allEvents[eventIndex].availableTickets += canceled.tickets;
        localStorage.setItem('allEvents', JSON.stringify(allEvents));
    }

    bookings.splice(index, 1);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    eventCard.remove();

    if (bookings.length === 0) {
        document.querySelector('.event-grid').innerHTML = "<p>Немає заброньованих подій.</p>";
    }

    alert('Бронювання скасовано.');
}
