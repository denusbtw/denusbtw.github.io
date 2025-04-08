fetch('events.json')
    .then(response => response.json())
    .then(events => {
        const eventGrid = document.querySelector('.event-grid');

        events.forEach(event => {
            const eventCard = document.createElement('article');
            eventCard.classList.add('event-card');

            eventCard.innerHTML = `
                <img src="${event.image}" alt="${event.title}">
                <h2>${event.title}</h2>
                <p>Дата: ${event.date}</p>
                <p>Місце: ${event.place}</p>
                <p>Ціна: ${event.price} грн</p>
                <button class="book-btn">Забронювати</button>
            `;

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

            eventGrid.appendChild(eventCard);
        });
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


