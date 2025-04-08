fetch('events.json')
    .then(response => response.json())
    .then(events => {
        const eventGrid = document.querySelector('.event-grid');

        let i = 0;
        while (i < events.length) {
            const event = events[i];
            const eventDate = parseDate(event.date);
            const today = new Date();
            i++;

            if (eventDate <= today) continue;

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

            // Обробка кліку по картці — відкриває модалку (крім кнопок)
            eventCard.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'button') return;
                openModal(event);
            });

            if (event.price > 500) {
                eventCard.style.backgroundColor = '#604b4b';
            }

            eventGrid.appendChild(eventCard);
        }
    })
    .catch(error => console.error('Error loading events:', error));


function openModal(eventData) {
    document.getElementById('modal-image').src = eventData.image;
    document.getElementById('modal-image').alt = eventData.title;
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

window.addEventListener('click', (event) => {
    const modal = document.getElementById('event-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});



document.querySelector('.event-grid').addEventListener("click", function(event) {
    if (event.target && event.target.classList.contains("book-btn")) {
        bookTickets(event.target);
    }
});


function bookTickets(button) {
    const eventCard = button.closest('.event-card');
    const { eventImage, eventTitle, eventDate, eventPlace, eventPrice } = getEventCardInfo(eventCard);

    const tickets = prompt("Введіть кількість квитків:");

    if (tickets && tickets > 0) {
        const totalPrice = eventPrice * tickets;
        alert(`Ви забронювали ${tickets} квитків. Загальна сума: ${totalPrice} грн.`);

        const bookingDetails = {
            image: eventImage,
            title: eventTitle,
            date: eventDate,
            place: eventPlace,
            tickets: tickets,
            totalAmount: totalPrice
        };

        let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
        bookings.push(bookingDetails);
        localStorage.setItem('bookings', JSON.stringify(bookings));

        button.innerText = 'Заброньовано';
        button.disabled = true;
        button.style.backgroundColor = '#999';
        button.style.cursor = 'not-allowed';
    } else {
        alert("Кількість квитків має бути більшою за 0.");
    }
}



document.querySelector('.event-grid').addEventListener("click", function(event) {
    if (event.target && event.target.classList.contains("toggle-favorite-btn")) {
        toggleFavorite(event.target);
    }
});

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
        const favoriteDetails = {
            image: eventImage,
            title: eventTitle,
            date: eventDate,
            place: eventPlace,
            price: eventPrice,
        };

        favorites.push(favoriteDetails);
        button.innerText = 'Видалити з улюбленого';
        alert(`Ви додали подію до улюблених.`);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
}



function getEventCardInfo(eventCard) {
    const eventImage = eventCard.querySelector('img').src;
    const eventTitle = eventCard.querySelector('h2').innerText;
    const eventDate = eventCard.querySelector('p:nth-child(3)').innerText.replace("Дата: ", "");
    const eventPlace = eventCard.querySelector('p:nth-child(4)').innerText.replace("Місце: ", "");
    const eventPrice = parseInt(
        eventCard.querySelector('p:nth-child(5)')
            .innerText.replace('Ціна: ', '')
            .replace(' грн', '')
    );

    return { eventImage, eventTitle, eventDate, eventPlace, eventPrice };
}


function parseDate(dateStr){
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


document.getElementById('booking-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const tickets = parseInt(document.getElementById('ticket-count').value);

    if (!name || !email || tickets <= 0) {
        alert('Будь ласка, заповніть всі поля правильно!');
    }
});