document.addEventListener("DOMContentLoaded", () => {
    const eventGrid = document.querySelector('.event-grid');
    eventGrid.innerHTML = ""; // очищаємо

    const allEvents = JSON.parse(localStorage.getItem('allEvents')) || [];
    const today = new Date();

    const pastEvents = allEvents.filter(ev => {
        const eventDate = parseDate(ev.date);
        return eventDate < today;
    });

    if (pastEvents.length === 0) {
        eventGrid.innerHTML = "<p>Немає минулих подій.</p>";
        return;
    }

    pastEvents.forEach(event => {
        const eventCard = document.createElement('article');
        eventCard.classList.add('event-card');

        eventCard.innerHTML = `
            <img src="${event.image}" alt="${event.title}">
            <h2>${event.title}</h2>
            <p>Дата: ${event.date}</p>
            <p>Місце: ${event.place}</p>
            <p>Ціна: ${event.price} грн</p>
            <p class="event-description">${event.description || 'Опис відсутній'}</p>
        `;

        eventGrid.appendChild(eventCard);
    });
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