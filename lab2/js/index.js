function getEventCardInfo(eventCard) {
    const eventImage = eventCard.querySelector('img').src;
    const eventTitle = eventCard.querySelector('h2').innerText;
    const eventDate = eventCard.querySelector('p:nth-child(3)').innerText.replace("Дата: ", "");
    const eventPlace = eventCard.querySelector('p:nth-child(4)').innerText.replace("Місце: ", "");
    const eventPrice = parseInt(eventCard.querySelector('p:nth-child(5)').innerText.replace('Ціна: ', '').replace(' грн', ''));
    return { eventImage, eventTitle, eventDate, eventPlace, eventPrice };
}

// Ініціалізація подій
fetch('events.json')
    .then(res => res.json())
    .then(serverEvents => {
        let allEvents = JSON.parse(localStorage.getItem('allEvents'));

        if (!allEvents) {
            const localEvents = JSON.parse(localStorage.getItem('localEvents')) || [];

            serverEvents = serverEvents.map(ev => ({
                ...ev,
                availableTickets: ev.availableTickets || 200 // за замовчуванням
            }));

            allEvents = [...serverEvents, ...localEvents];
            localStorage.setItem('allEvents', JSON.stringify(allEvents));
        }

        renderEvents(allEvents);
    });

function renderEvents(events) {
    const eventGrid = document.querySelector('.event-grid');
    const today = new Date();

    events.forEach(event => {
        const eventDate = parseDate(event.date);
        if (eventDate <= today) return;

        const eventCard = document.createElement('article');
        eventCard.classList.add('event-card');

        const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        const isBooked = bookings.some(booking => booking.title === event.title && booking.date === event.date);

        eventCard.innerHTML = `
            <img src="${event.image}" alt="${event.title}">
            <h2>${event.title}</h2>
            <p>Дата: ${event.date}</p>
            <p>Місце: ${event.place}</p>
            <p>Ціна: ${event.price} грн</p>
            <p class="available-tickets">Вільно: ${event.availableTickets ?? '—'}</p>
        `;

        const bookButton = document.createElement('button');
        bookButton.classList.add('book-btn');
        bookButton.innerText = isBooked ? 'Заброньовано' : 'Забронювати';
        if (isBooked) {
            bookButton.disabled = true;
            bookButton.style.backgroundColor = '#999';
            bookButton.style.cursor = 'not-allowed';
        }
        eventCard.appendChild(bookButton);

        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorite = favorites.some(fav => fav.title === event.title && fav.date === event.date);

        const toggleFavoriteButton = document.createElement('button');
        toggleFavoriteButton.classList.add('toggle-favorite-btn');
        toggleFavoriteButton.innerText = isFavorite ? 'Видалити з улюбленого' : 'Додати до улюблених';
        eventCard.appendChild(toggleFavoriteButton);

        eventCard.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'button') return;
            openModal(event);
        });

        if (event.price > 500) {
            eventCard.style.backgroundColor = '#604b4b';
        }

        eventGrid.appendChild(eventCard);
    });
}

function openModal(eventData) {
    document.getElementById('modal-image').src = eventData.image;
    document.getElementById('modal-title').innerText = eventData.title;
    document.getElementById('modal-date').innerText = "Дата: " + eventData.date;
    document.getElementById('modal-place').innerText = "Місце: " + eventData.place;
    document.getElementById('modal-price').innerText = "Ціна: " + eventData.price + " грн";
    document.getElementById('modal-description').innerText = eventData.description || "Опис відсутній";
    document.getElementById('event-modal').style.display = 'block';
}

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('event-modal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('event-modal');
    if (e.target === modal) modal.style.display = 'none';
});

document.querySelector('.event-grid').addEventListener("click", (event) => {
    if (event.target.classList.contains("book-btn")) {
        bookTickets(event.target);
    }
    if (event.target.classList.contains("toggle-favorite-btn")) {
        toggleFavorite(event.target);
    }
});

function bookTickets(button) {
    const eventCard = button.closest('.event-card');
    const { eventImage, eventTitle, eventDate, eventPlace, eventPrice } = getEventCardInfo(eventCard);

    const tickets = parseInt(prompt("Введіть кількість квитків:"));
    if (!tickets || tickets <= 0) return alert("Кількість квитків має бути більшою за 0.");

    let allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];
    const eventIndex = allEvents.findIndex(ev => ev.title === eventTitle && ev.date === eventDate);

    if (eventIndex !== -1) {
        const available = allEvents[eventIndex].availableTickets;
        if (available < tickets) {
            alert(`Недостатньо квитків! Залишилось: ${available}`);
            return;
        }

        allEvents[eventIndex].availableTickets -= tickets;
        localStorage.setItem('allEvents', JSON.stringify(allEvents));
    }

    const availableText = eventCard.querySelector('.available-tickets');
    if (availableText) {
        availableText.textContent = `Вільно: ${parseInt(availableText.textContent.replace('Вільно: ', '')) - tickets}`;
    }

    const totalPrice = eventPrice * tickets;
    alert(`Ви забронювали ${tickets} квитків. Загальна сума: ${totalPrice} грн.`);

    const bookingDetails = {
        image: eventImage,
        title: eventTitle,
        date: eventDate,
        place: eventPlace,
        tickets,
        totalAmount: totalPrice,
        pricePerTicket: eventPrice
    };

    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    bookings.push(bookingDetails);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    button.innerText = 'Заброньовано';
    button.disabled = true;
    button.style.backgroundColor = '#999';
    button.style.cursor = 'not-allowed';
}

function toggleFavorite(button) {
    const eventCard = button.closest('.event-card');
    const { eventImage, eventTitle, eventDate, eventPlace, eventPrice } = getEventCardInfo(eventCard);

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const eventIndex = favorites.findIndex(fav => fav.title === eventTitle && fav.date === eventDate);

    if (eventIndex > -1) {
        favorites.splice(eventIndex, 1);
        button.innerText = 'Додати до улюблених';
        alert(`Ви видалили подію з улюбленого.`);
    } else {
        favorites.push({ image: eventImage, title: eventTitle, date: eventDate, place: eventPlace, price: eventPrice });
        button.innerText = 'Видалити з улюбленого';
        alert(`Ви додали подію до улюблених.`);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// MODAL: Створення події
document.getElementById('create-event-btn').addEventListener('click', () => {
    document.getElementById('create-event-modal').style.display = 'block';
});
document.querySelector('.close-create-modal').addEventListener('click', () => {
    document.getElementById('create-event-modal').style.display = 'none';
});
window.addEventListener('click', (e) => {
    const modal = document.getElementById('create-event-modal');
    if (e.target === modal) modal.style.display = 'none';
});

document.getElementById('create-event-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value.trim();
    const place = document.getElementById('event-place').value.trim();
    const price = parseInt(document.getElementById('event-price').value.trim());
    const tickets = parseInt(document.getElementById('event-tickets').value.trim());
    const fileInput = document.getElementById('event-image');
    const description = document.getElementById('event-description').value.trim();

    if (!title || !date || !place || !price || !tickets || fileInput.files.length === 0) {
        alert("Будь ласка, заповніть всі обов'язкові поля.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const imageDataURL = event.target.result;
        const newEvent = {
            title,
            date,
            place,
            price,
            image: imageDataURL,
            description,
            availableTickets: tickets
        };

        let allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];
        allEvents.push(newEvent);
        localStorage.setItem('allEvents', JSON.stringify(allEvents));

        alert("Подію створено!");
        document.getElementById('create-event-modal').style.display = 'none';
        document.getElementById('create-event-form').reset();
        location.reload();
    };

    reader.readAsDataURL(file);
});


function parseDate(dateStr) {
    const months = {
        'січня': 0, 'лютого': 1, 'березня': 2,
        'квітня': 3, 'травня': 4, 'червня': 5,
        'липня': 6, 'серпня': 7, 'вересня': 8,
        'жовтня': 9, 'листопада': 10, 'грудня': 11
    };

    const parts = dateStr.split(' ');
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
}