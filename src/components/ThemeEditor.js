// ThemeEditor.js
import React, { useState } from 'react';
import './ThemeEditor.css';

const ThemeEditor = ({ onSave }) => {
    const [theme, setTheme] = useState({
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: '16px',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTheme(prevTheme => ({ ...prevTheme, [name]: value }));
    };

    const handleSave = () => {
        onSave(theme);
    };

    return (
        <div className="theme-editor">
            <h3>Customize Your Profile Theme</h3>
            <label>
                Background Color:
                <input type="color" name="backgroundColor" value={theme.backgroundColor} onChange={handleChange} />
            </label>
            <label>
                Text Color:
                <input type="color" name="textColor" value={theme.textColor} onChange={handleChange} />
            </label>
            <label>
                Font Size:
                <input type="number" name="fontSize" value={theme.fontSize} onChange={handleChange} min="10" max="30" />
            </label>
            <button onClick={handleSave}>Save Theme</button>
        </div>
    );
};

export default ThemeEditor;
