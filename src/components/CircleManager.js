import React, { useState, useEffect } from "react";
import {
  ref,
  get,
  child,
  query,
  orderByChild,
  startAt,
  endAt,
  update,
  remove,
} from "firebase/database";
import { database } from "../firebase";

const CircleManager = ({
  circles = [],
  onClose,
  onAddCircle,
  onDeleteCircle,
  onAddMember,
  onRemoveMember,
}) => {
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [circleMembers, setCircleMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleColor, setNewCircleColor] = useState("#FFFFFF");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCircleMembers = async (circleName) => {
    try {
      if (!circleName) throw new Error("Circle name is required.");

      const membersRef = ref(database, `circles/${circleName}/members`);
      const snapshot = await get(membersRef);

      if (snapshot.exists()) {
        const members = await Promise.all(
          Object.keys(snapshot.val()).map(async (uid) => {
            const userRef = child(ref(database, "users"), uid);
            const userSnapshot = await get(userRef);

            return userSnapshot.exists()
              ? { uid, displayName: userSnapshot.val().displayName || "Unknown User" }
              : { uid, displayName: "Unknown User" };
          })
        );
        setCircleMembers(members);
      } else {
        setCircleMembers([]);
      }
    } catch (error) {
      console.error("Error fetching circle members:", error);
      setCircleMembers([]);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const usersRef = ref(database, "users");
      const searchQueryRef = query(
        usersRef,
        orderByChild("displayName"),
        startAt(searchQuery),
        endAt(searchQuery + "\uf8ff")
      );

      const snapshot = await get(searchQueryRef);

      if (snapshot.exists()) {
        const users = Object.entries(snapshot.val()).map(([uid, userData]) => ({
          uid,
          ...userData,
        }));
        setSearchResults(users);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberClick = async (circleName, userId) => {
    try {
      const memberRef = ref(database, `circles/${circleName}/members/${userId}`);
      await update(memberRef, true);
      fetchCircleMembers(circleName);
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleRemoveMemberClick = async (circleName, userId) => {
    try {
      const memberRef = ref(database, `circles/${circleName}/members/${userId}`);
      await remove(memberRef);
      fetchCircleMembers(circleName);
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  const handleAddCircleClick = async () => {
    if (!newCircleName.trim()) {
      alert("Circle name cannot be empty.");
      return;
    }

    try {
      const circleRef = ref(database, `circles/${newCircleName}`);
      await update(circleRef, { color: newCircleColor });
      onAddCircle({ name: newCircleName, color: newCircleColor });
      setNewCircleName("");
      setNewCircleColor("#FFFFFF");
    } catch (error) {
      console.error("Error adding circle:", error);
    }
  };

  useEffect(() => {
    if (selectedCircle) {
      fetchCircleMembers(selectedCircle.name);
    }
  }, [selectedCircle]);

  return (
    <div className="circle-manager">
      <h2>Manage Circles</h2>
      <button className="close-button" onClick={onClose}>
        Close
      </button>

      {!selectedCircle ? (
        <div>
          <div className="add-circle">
            <input
              type="text"
              placeholder="New Circle Name"
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
            />
            <input
              type="color"
              value={newCircleColor}
              onChange={(e) => setNewCircleColor(e.target.value)}
            />
            <button onClick={handleAddCircleClick}>Add Circle</button>
          </div>

          <div className="circle-list">
            {circles.map((circle) => (
              <div key={circle.name} className="circle-entry">
                <span>{circle.name}</span>
                <button onClick={() => setSelectedCircle(circle)}>Manage</button>
                <button onClick={() => onDeleteCircle(circle.name)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h3>Circle: {selectedCircle.name}</h3>
          <button onClick={() => setSelectedCircle(null)}>Back</button>

          <div className="circle-members">
            <h4>Members</h4>
            {circleMembers.length > 0 ? (
              <ul>
                {circleMembers.map((member) => (
                  <li key={member.uid}>
                    {member.displayName}
                    <button
                      onClick={() => handleRemoveMemberClick(selectedCircle.name, member.uid)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No members in this circle</p>
            )}
          </div>

          <div className="add-members">
            <h4>Add Members</h4>
            <input
              type="text"
              placeholder="Search Users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={handleSearchUsers}
            />
            {loading ? (
              <p>Loading users...</p>
            ) : searchResults.length > 0 ? (
              <ul>
                {searchResults.map((user) => (
                  <li key={user.uid}>
                    {user.displayName}
                    <button
                      onClick={() => handleAddMemberClick(selectedCircle.name, user.uid)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No users found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleManager;
