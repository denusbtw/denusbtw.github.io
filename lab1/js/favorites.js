document.addEventListener("DOMContentLoaded", () => {
    const eventGrid = document.querySelector('.event-grid');

    // Отримуємо бронювання з localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (favorites.length === 0) {
        eventGrid.innerHTML = "<p>Немає улюблених подій.</p>";
    } else {
        favorites.forEach((favorite, index) => {
            const eventCard = document.createElement('article');
            eventCard.classList.add('event-card');
            eventCard.setAttribute('data-id', index);

            // Додаємо відображення кількості квитків та загальної суми
            eventCard.innerHTML = `
                    <img src=${favorite.image} alt="${favorite.title}">
                    <h2>${favorite.title}</h2>
                    <p>${favorite.date}</p>
                    <p>${favorite.place}</p>
                    <button class="book-btn">Забронювати</button>
                    <button class="remove-from-favorites-btn">Видалити з улюбленого</button>
                `;

            eventGrid.appendChild(eventCard);

            // Додаємо обробник для скасування бронювання
            eventCard.querySelector('.remove-from-favorites-btn')
                .addEventListener('click', () => removeFromFavorites(index, eventCard));
        });
    }
});


// Функція для скасування бронювання
function removeFromFavorites(index, eventCard) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));

    eventCard.remove();

    if (favorites.length === 0) {
        document.querySelector('.event-grid').innerHTML = "<p>Немає улюблених подій.</p>";
    }

    alert('Подію видалено з улюблених.');
}