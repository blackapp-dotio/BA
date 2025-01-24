import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database, auth } from '../firebaseconfig'; // Adjust the path to your config

const AIAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    mostEngaged: null,
    recentlyInteracted: [],
    suggestions: [],
  });
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    // Fetch analytics data from Firebase
    const analyticsRef = ref(database, `users/${userId}/circleAnalytics`);
    const unsubscribe = onValue(analyticsRef, (snapshot) => {
      if (snapshot.exists()) {
        setAnalytics(snapshot.val());
      } else {
        setAnalytics({
          mostEngaged: null,
          recentlyInteracted: [],
          suggestions: [],
        });
      }
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, [userId]);

  return (
    <div className="ai-analytics">
      <h4>AI Insights</h4>
      <p><strong>Most Engaged:</strong> {analytics.mostEngaged || 'No data available'}</p>
      <p>
        <strong>Recently Interacted:</strong>{' '}
        {analytics.recentlyInteracted.length > 0
          ? analytics.recentlyInteracted.join(', ')
          : 'No recent interactions'}
      </p>

      <h5>Suggestions</h5>
      {analytics.suggestions.length > 0 ? (
        <ul>
          {analytics.suggestions.map((suggestion, index) => (
            <li key={index}>
              {suggestion.action} with {suggestion.userId}
              <button onClick={() => alert(`Action taken for ${suggestion.userId}`)}>
                Take Action
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No suggestions available.</p>
      )}
    </div>
  );
};

export default AIAnalytics;
