const AIInsights = () => {
  // Example data
  const insights = [
    { metric: 'Most Engaged Circle', value: 'Friends' },
    { metric: 'Recent Interactions', value: 5 },
    { metric: 'Top Member', value: 'John Doe' },
  ];

  return (
    <div className="ai-insights">
      <h3>AI Insights</h3>
      <ul>
        {insights.map((insight, index) => (
          <li key={index}>
            <strong>{insight.metric}:</strong> {insight.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIInsights;
