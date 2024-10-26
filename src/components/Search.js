import React, { useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './Search.css';

function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!query.startsWith('@')) {
            setError('Invalid search query. Please use @ to search for users.');
            setResults([]);
            return;
        }

        setError('');
        setLoading(true);
        setResults([]);

        try {
            await searchUsers();
        } catch (err) {
            console.error('Search error:', err);
            setError('An error occurred while searching. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async () => {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);

        if (snapshot.exists()) {
            const usersData = snapshot.val();
            console.log('Fetched users:', usersData); // Log users for debugging

            // Ensure the userId is being passed correctly
            const filteredUsers = Object.entries(usersData).filter(([key, user]) =>
                user?.displayName?.toLowerCase().includes(query.slice(1).toLowerCase())
            ).map(([key, user]) => ({
                displayName: user.displayName,
                profilePicture: user.profilePicture || 'default-profile-pic-url',
                userId: key,  // Ensure userId is key in Firebase (userId might be the key in the database)
            }));

            setResults(filteredUsers);
        } else {
            setResults([]);
        }
    };

    const handleResultClick = (result) => {
        if (result?.userId) {
            console.log('Navigating to profile with userId:', result.userId); // Log userId for debugging
            navigate(`/profile/${result.userId}`); // Navigate to the correct user profile
        } else {
            setError('Unable to navigate to user profile. Missing user ID.');
            console.error('Missing userId for result:', result); // Log error for debugging
        }
    };

    return (
        <div className="search-container">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for @users"
                className="search-input"
            />
            <button onClick={handleSearch} className="search-button">
                Search
            </button>

            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            <div className="search-results">
                {results.length > 0 ? (
                    <ul>
                        {results.map((result, index) => (
                            <li key={index} onClick={() => handleResultClick(result)}>
                                <div className="user-result">
                                    <img src={result.profilePicture} alt="Profile" className="profile-pic" />
                                    <span>{result.displayName}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !loading && query && <p>No results found</p>
                )}
            </div>
        </div>
    );
}

export default Search;
