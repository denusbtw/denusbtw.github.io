import React from "react";

const RatingStars = ({ currentRating = 0, onRate, disabled = false }) => {
    return (
        <div className="rating-stars" style={{ marginTop: '10px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    onClick={() => !disabled && onRate(star)}
                    style={{
                        cursor: disabled ? 'default' : 'pointer',
                        color: star <= currentRating ? '#ffd700' : '#ccc',
                        fontSize: '22px',
                        marginRight: '5px',
                        transition: 'color 0.2s ease'
                    }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export default RatingStars;
