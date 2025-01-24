import React, { useState } from 'react';
import ARCircle from './ARCircle';

const TestARCircle = () => {
  const [circleData, setCircleData] = useState({
    size: 3,
    members: [
      { id: 'user1', interactions: 20, color: '#FF0000' },
      { id: 'user2', interactions: 10, color: '#00FF00' },
      { id: 'user3', interactions: 5, color: '#0000FF' },
    ],
  });

  const handleUpdateMember = (index, field, value) => {
    const updatedMembers = [...circleData.members];
    updatedMembers[index][field] = value;
    setCircleData({ ...circleData, members: updatedMembers });
  };

  return (
    <div>
      <h2>AR Circle Visualization Testing</h2>

      {/* Render AR Visualization */}
      <div>
        <ARCircle circleData={circleData} />
      </div>

      {/* Update Member Data */}
      <h3>Update Member Data</h3>
      {circleData.members.map((member, index) => (
        <div key={member.id}>
          <input
            type="text"
            value={member.id}
            readOnly
          />
          <input
            type="number"
            value={member.interactions}
            onChange={(e) => handleUpdateMember(index, 'interactions', e.target.value)}
          />
          <input
            type="color"
            value={member.color}
            onChange={(e) => handleUpdateMember(index, 'color', e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};

export default TestARCircle;
