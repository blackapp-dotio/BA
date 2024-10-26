import React, { useEffect } from 'react';

const Timer = ({ timeLimit, onTimeLimitReached }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onTimeLimitReached();
        }, timeLimit);

        return () => clearTimeout(timer);
    }, [timeLimit, onTimeLimitReached]);

    return (
        <div>
            {/* Timer component can display remaining time if needed */}
            {/* <p>Time remaining: {timeLimit / 1000} seconds</p> */}
        </div>
    );
};

export default Timer;
