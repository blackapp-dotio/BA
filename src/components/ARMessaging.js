import React, { useState, useEffect } from 'react';
import './ARPets.css';

const ARPets = ({ projectToOrb }) => {
    const [selectedPet, setSelectedPet] = useState(null);
    const [petName, setPetName] = useState('');

    const petGallery = [
        { id: 'dragon', name: 'Dragon', image: '/images/dragon.png' },
        { id: 'wolf', name: 'Wolf', image: '/images/wolf.png' },
        { id: 'lion', name: 'Lion', image: '/images/lion.png' },
        { id: 'tiger', name: 'Tiger', image: '/images/tiger.png' },
        { id: 'dinosaur', name: 'Dinosaur', image: '/images/dinosaur.png' },
    ];

    useEffect(() => {
        if (selectedPet) {
            // Project the selected pet and name to the orb
            projectToOrb({
                type: 'pet',
                petName: petName || selectedPet.name,
                petImage: selectedPet.image,
            });
        }
    }, [selectedPet, petName]);

    return (
        <div className="ar-pets-container">
            <h3 className="ar-pets-title">Choose Your Pet</h3>
            <div className="pet-gallery">
                {petGallery.map((pet) => (
                    <div
                        key={pet.id}
                        className={`pet-item ${selectedPet?.id === pet.id ? 'active' : ''}`}
                        onClick={() => setSelectedPet(pet)}
                    >
                        <img src={pet.image} alt={pet.name} />
                        <p>{pet.name}</p>
                    </div>
                ))}
            </div>
            {selectedPet && (
                <div className="pet-config">
                    <input
                        type="text"
                        placeholder="Name your pet"
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        className="pet-name-input"
                    />
                    <button
                        onClick={() =>
                            alert(`You chose ${petName || selectedPet.name}!`)
                        }
                        className="choose-pet-button"
                    >
                        Confirm
                    </button>
                </div>
            )}
        </div>
    );
};

export default ARPets;
