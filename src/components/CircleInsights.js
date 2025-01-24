import React, { useState, useEffect } from 'react';
import { fetchCircles } from './circleUtils'; // Import circle utilities

const CircleInsights = ({ circleName }) => {
  const [circle, setCircle] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [significantDates, setSignificantDates] = useState([]);

  useEffect(() => {
    const loadCircleData = async () => {
      try {
        const circles = await fetchCircles();
        const selectedCircle = circles.find((c) => c.name === circleName);
        setCircle(selectedCircle);

        if (selectedCircle) {
          // Extract significant dates and upcoming events
          const dates = extractSignificantDates(selectedCircle);
          const events = extractUpcomingEvents(selectedCircle);
          setSignificantDates(dates);
          setUpcomingEvents(events);
        }
      } catch (error) {
        console.error('Error fetching circle data:', error);
      }
    };

    loadCircleData();
  }, [circleName]);

  const extractSignificantDates = (circle) => {
    return circle.members
      .map((member) => ({
        name: member.displayName,
        birthday: member.birthday, // Assuming birthday exists
        anniversary: member.anniversary, // Assuming anniversary exists
      }))
      .filter((date) => date.birthday || date.anniversary);
  };

  const extractUpcomingEvents = (circle) => {
    return circle.events?.filter((event) => {
      const eventDate = new Date(event.date);
      const today = new Date();
      return eventDate >= today && eventDate <= new Date(today.setDate(today.getDate() + 7));
    }) || [];
  };

  if (!circle) {
    return <p>Loading circle insights...</p>;
  }

  return (
    <div className="circle-insights">
      <h2>{circle.name} Insights</h2>
      <h3>Members</h3>
      <div className="carousel">
        {circle.members.map((member) => (
          <div key={member.uid} className="carousel-item">
            <span>{member.displayName}</span>
          </div>
        ))}
      </div>

      <h3>Significant Dates</h3>
      {significantDates.length > 0 ? (
        <ul>
          {significantDates.map((date, index) => (
            <li key={index}>
              {date.name}: 
              {date.birthday && <span> Birthday: {new Date(date.birthday).toLocaleDateString()}</span>}
              {date.anniversary && <span> Anniversary: {new Date(date.anniversary).toLocaleDateString()}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p>No significant dates found.</p>
      )}

      <h3>Upcoming Events</h3>
      {upcomingEvents.length > 0 ? (
        <ul>
          {upcomingEvents.map((event, index) => (
            <li key={index}>
              <strong>{event.title}</strong> on {new Date(event.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No upcoming events for this circle.</p>
      )}
    </div>
  );
};

export default CircleInsights;
