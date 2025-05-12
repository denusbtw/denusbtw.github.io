const express = require('express');
const cors = require('cors');
const { db } = require('./firebaseAdmin');

const authenticate = require('./authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());


function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        console.warn('❗ Невалідна дата:', dateStr);
        return new Date(0); // fallback
    }

    const months = {
        'січня': 0, 'лютого': 1, 'березня': 2,
        'квітня': 3, 'травня': 4, 'червня': 5,
        'липня': 6, 'серпня': 7, 'вересня': 8,
        'жовтня': 9, 'листопада': 10, 'грудня': 11
    };

    const parts = dateStr.split(' ');
    const day = parseInt(parts[0], 10);
    const month = months[parts[1]];
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
}


app.get('/api/events', async (req, res) => {
    try {
        const { past } = req.query;

        const snapshot = await db.collection('events').get();
        const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const now = new Date();

        const parseDate = (dateStr) => {
            if (!dateStr || typeof dateStr !== 'string') return new Date(0); // або throw, або return null
            const months = {
                'січня': 0, 'лютого': 1, 'березня': 2,
                'квітня': 3, 'травня': 4, 'червня': 5,
                'липня': 6, 'серпня': 7, 'вересня': 8,
                'жовтня': 9, 'листопада': 10, 'грудня': 11
            };
            const parts = dateStr.split(' ');
            const day = parseInt(parts[0], 10);
            const month = months[parts[1]];
            const year = parseInt(parts[2], 10);

            if (isNaN(day) || isNaN(month) || isNaN(year)) {
                throw new Error(`Невалідна дата: "${dateStr}"`);
            }

            return new Date(year, month, day);
        };

        let filteredEvents = allEvents;

        if (past === 'true') {
            filteredEvents = allEvents.filter(event => parseDate(event.date) < now);
        } else {
            filteredEvents = allEvents.filter(event => parseDate(event.date) >= now);
        }

        res.json(filteredEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching events' });
    }
});


app.post('/api/events', authenticate, async (req, res) => {
    try {
        const eventData = req.body;
        const docRef = await db.collection('events').add(eventData);
        const newEvent = { id: docRef.id, ...eventData };
        res.status(201).json(newEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Не вдалося створити подію' });
    }
});


app.get('/api/events/:eventId', async (req, res) => {
    const { eventId } = req.params;

    try {
        const docRef = db.collection('events').doc(eventId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ id: docSnap.id, ...docSnap.data() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching event' });
    }
});


app.put('/api/events/:eventId', authenticate, async (req, res) => {
    const eventId = req.params.eventId;
    const data = req.body;

    try {
        const eventRef = db.collection('events').doc(eventId);
        await eventRef.update(data);
        res.json({ message: 'Event updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update event' });
    }
});


app.delete('/api/events/:eventId', authenticate, async (req, res) => {
    const eventId = req.params.eventId;

    try {
        await db.collection('events').doc(eventId).delete();
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete event' });
    }
});


app.get('/api/events/:eventId/ratings', async (req, res) => {
    const eventId = req.params.eventId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    try {
        const snapshot = await db.collection('ratings')
            .where('eventId', '==', eventId)
            .get();

        const allRatings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const total = allRatings.length;
        const totalPages = Math.ceil(total / limit);
        const average = total
            ? allRatings.reduce((sum, r) => sum + r.rating, 0) / total
            : 0;

        const sorted = allRatings.sort(
            (a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0)
        );

        const paginated = sorted.slice(offset, offset + limit);

        res.json({
            ratings: paginated,
            average: parseFloat(average.toFixed(2)),
            total,
            totalPages,
            currentPage: page
        });
    } catch (err) {
        console.error('Error fetching ratings:', err);
        res.status(500).json({ message: 'Failed to fetch ratings' });
    }
});


app.post('/api/events/:eventId/ratings', authenticate, async (req, res) => {
    const eventId = req.params.eventId;
    const { rating } = req.body;
    const userId = req.user.uid;

    if (!eventId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid rating value (1–5)' });
    }

    try {
        const existing = await db.collection('ratings')
            .where('eventId', '==', eventId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(409).json({ message: 'You have already rated this event' });
        }

        const bookingSnap = await db.collection('bookings')
            .where('eventId', '==', eventId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (bookingSnap.empty) {
            return res.status(403).json({ message: 'You must book this event to rate it' });
        }

        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const eventDate = parseDate(eventDoc.data().date);
        if (eventDate > new Date()) {
            return res.status(400).json({ message: 'You can only rate past events' });
        }

        const newRatingRef = await db.collection('ratings').add({
            userId,
            eventId,
            rating,
            timestamp: new Date()
        });

        res.status(201).json({ message: 'Rating successfully added', id: newRatingRef.id });
    } catch (err) {
        console.error('Error adding rating:', err);
        res.status(500).json({ message: 'Failed to add rating' });
    }
});


app.patch('/api/events/:eventId/ratings/:ratingId', authenticate, async (req, res) => {
    const { eventId, ratingId } = req.params;
    const { rating } = req.body;
    const userId = req.user.uid;

    if (!eventId || !ratingId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        const ratingDoc = await db.collection('ratings').doc(ratingId).get();

        if (!ratingDoc.exists) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        const data = ratingDoc.data();

        if (data.userId !== userId || data.eventId !== eventId) {
            return res.status(403).json({ message: 'Access denied to this rating' });
        }

        const eventDoc = await db.collection('events').doc(eventId).get();
        const eventDate = parseDate(eventDoc.data().date);
        if (eventDate > new Date()) {
            return res.status(400).json({ message: 'Cannot rate future events' });
        }

        await db.collection('ratings').doc(ratingId).update({
            rating,
            updatedAt: new Date()
        });

        res.status(200).json({ message: 'Rating updated successfully' });
    } catch (err) {
        console.error('Error updating rating:', err);
        res.status(500).json({ message: 'Failed to update rating' });
    }
});


app.get('/api/bookings', authenticate, async (req, res) => {
    const userId = req.user.uid;

    try {
        const snapshot = await db.collection('bookings')
            .where('userId', '==', userId)
            .get();

        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch bookings' });
    }
});


app.post('/api/bookings', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const { eventId, tickets } = req.body;

    if (!eventId || !tickets || tickets <= 0) {
        return res.status(400).json({ message: 'Invalid eventId or ticket count' });
    }

    const eventRef = db.collection('events').doc(eventId);
    const bookingsRef = db.collection('bookings');

    try {
        await db.runTransaction(async (transaction) => {
            const eventSnap = await transaction.get(eventRef);

            if (!eventSnap.exists) {
                throw new Error('Event not found');
            }

            const eventData = eventSnap.data();
            const available = eventData.availableTickets;

            if (available === undefined) {
                throw new Error('Event does not have availableTickets');
            }

            if (available < tickets) {
                throw new Error('Not enough tickets available');
            }

            transaction.update(eventRef, {
                availableTickets: available - tickets
            });

            const newBookingRef = bookingsRef.doc();
            transaction.set(newBookingRef, {
                userId,
                eventId,
                tickets,
                timestamp: new Date()
            });

            res.status(201).json({ id: newBookingRef.id, userId, eventId, tickets });
        });
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(500).json({ message: error.message || 'Failed to create booking' });
    }
});


app.get('/api/bookings/:bookingId', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const bookingId = req.params.bookingId;

    try {
        const doc = await db.collection('bookings').doc(bookingId).get();

        if (!doc.exists || doc.data().userId !== userId) {
            return res.status(404).json({ message: 'Booking not found or unauthorized' });
        }

        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch booking' });
    }
});


app.patch('/api/bookings/:bookingId', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const bookingId = req.params.bookingId;
    const { tickets } = req.body;

    if (!tickets || tickets <= 0) {
        return res.status(400).json({ message: 'Invalid ticket count' });
    }

    try {
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists || bookingSnap.data().userId !== userId) {
            return res.status(404).json({ message: 'Booking not found or unauthorized' });
        }

        const oldTickets = bookingSnap.data().tickets;
        const eventId = bookingSnap.data().eventId;
        const delta = tickets - oldTickets;

        const eventRef = db.collection('events').doc(eventId);
        const eventSnap = await eventRef.get();

        if (!eventSnap.exists) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const availableTickets = eventSnap.data().availableTickets;

        if (availableTickets - delta < 0) {
            return res.status(400).json({ message: 'Not enough available tickets' });
        }

        // Run updates
        await Promise.all([
            bookingRef.update({ tickets }),
            eventRef.update({ availableTickets: availableTickets - delta })
        ]);

        res.json({ message: 'Booking updated' });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Failed to update booking' });
    }
});


app.delete('/api/bookings/:bookingId', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const bookingId = req.params.bookingId;

    try {
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingSnap = await bookingRef.get();

        if (!bookingSnap.exists || bookingSnap.data().userId !== userId) {
            return res.status(404).json({ message: 'Booking not found or unauthorized' });
        }

        await bookingRef.delete();
        res.json({ message: 'Booking deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete booking' });
    }
});


app.get('/api/favorites', authenticate, async (req, res) => {
    try {
        const userId = req.user.uid;

        const snapshot = await db.collection('favorites')
            .where('userId', '==', userId)
            .get();

        const favorites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(favorites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching favorite events' });
    }
});


app.post('/api/favorites', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const { eventId } = req.body;

    if (!eventId) {
        return res.status(400).json({ message: 'Missing eventId' });
    }

    try {
        const existing = await db.collection('favorites')
            .where('userId', '==', userId)
            .where('eventId', '==', eventId)
            .get();

        if (!existing.empty) {
            return res.status(200).json({ message: 'Already in favorites' });
        }

        await db.collection('favorites').add({ userId, eventId });
        res.status(201).json({ message: 'Added to favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add to favorites' });
    }
});


app.delete('/api/favorites/:favoriteId', authenticate, async (req, res) => {
    const userId = req.user.uid;
    const favoriteId = req.params.favoriteId;

    try {
        const doc = await db.collection('favorites').doc(favoriteId).get();

        if (!doc.exists || doc.data().userId !== userId) {
            return res.status(404).json({ message: 'Favorite not found or unauthorized' });
        }

        await db.collection('favorites').doc(favoriteId).delete();
        res.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove from favorites' });
    }
});

const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get('/*splat', (req, res) => {
    if (!req.originalUrl.startsWith("/api")) {
        res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
