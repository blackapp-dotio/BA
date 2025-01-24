import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ARorb.css';

const ARorb = () => {
    const mountRef = useRef();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeEffects, setActiveEffects] = useState({
        hud: false,
        time: false,
        stocks: false,
    });

    let camera, renderer, orb, canvasTexture;

    useEffect(() => {
        if (isModalOpen) {
            createAROrb();
        }

        const handleResize = () => {
            const mountNode = mountRef.current;
            if (mountNode && camera && renderer) {
                const width = mountNode.clientWidth;
                const height = mountNode.clientHeight;
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cleanupAROrb();
            window.removeEventListener('resize', handleResize);
        };
    }, [isModalOpen, activeEffects]);

    const createAROrb = () => {
        console.log('Creating AR Orb visuals...');
        const mountNode = mountRef.current;
        if (!mountNode) return;

        // Scene and Camera
        const scene = new THREE.Scene();
        const width = mountNode.clientWidth;
        const height = mountNode.clientHeight;
        camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
        camera.position.set(0, 0, 15);

        // Renderer
        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(width, height);
        mountNode.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Orb Geometry
        const geometry = new THREE.SphereGeometry(5, 64, 64);

        // Dynamic Texture for Projection
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        canvasTexture = new THREE.CanvasTexture(canvas);

        const material = new THREE.MeshPhysicalMaterial({
            map: canvasTexture,
            color: 0x0077ff,
            emissive: 0x001122,
            clearcoat: 1.0,
            roughness: 0.5,
            opacity: 0.8,
            transparent: true,
        });

        orb = new THREE.Mesh(geometry, material);
        scene.add(orb);

        // Draw Initial Projection
        drawProjection(ctx, canvas);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            orb.rotation.y += 0.01; // Smooth rotation
            controls.update();
            renderer.render(scene, camera);
        };

        animate();
        console.log('AR Orb visuals created successfully.');
    };

    const cleanupAROrb = () => {
        console.log('Cleaning up AR Orb visuals...');
        const mountNode = mountRef.current;
        if (mountNode) {
            while (mountNode.firstChild) {
                mountNode.removeChild(mountNode.firstChild);
            }
        }
    };

    const drawProjection = (ctx, canvas) => {
        console.log('Drawing projection...');

        if (!orb) {
            console.error('Orb is not initialized.');
            return;
        }

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // HUD Effect (Top Region)
        if (activeEffects.hud) {
            console.log('Rendering HUD...');
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.font = '20px Arial';
            ctx.fillText('Health: 85%', canvas.width / 4, canvas.height / 6);
            ctx.fillText('Armor: 70%', canvas.width / 4, canvas.height / 6 + 20);
            ctx.fillText('Energy: 60%', canvas.width / 4, canvas.height / 6 + 40);
        }

// Placeholder for Time Effect (Middle Region)
if (activeEffects.time) {
    console.log('Rendering AR Assistant placeholder...');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AR Assistant coming soon...', canvas.width / 2, canvas.height / 2);
}

        // Stocks Effect (Bottom Region)
        if (activeEffects.stocks) {
            console.log('Fetching and rendering stock data...');
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.font = '15px Arial';
            fetchStockData(ctx, canvas);
        }

        canvasTexture.needsUpdate = true;
    };

    const fetchStockData = async (ctx, canvas) => {
        try {
            const symbols = ['AAPL', 'GOOGL', 'AMZN', 'MSFT', 'TSLA'];
            const token = 'ctrhlh9r01qhb16mui40ctrhlh9r01qhb16mui4g';

            const promises = symbols.map((symbol) =>
                fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`).then((res) => res.json())
            );

            const data = await Promise.all(promises);

            // Clear stock section
            ctx.clearRect(0, (2 * canvas.height) / 3, canvas.width, canvas.height / 3);

            // Render stock data
            data.forEach((stock, index) => {
                const { c: current, d: change, dp: changePercent } = stock;
                const symbol = symbols[index];
                ctx.fillText(
                    `${symbol}: $${current.toFixed(2)} (${change.toFixed(2)} | ${changePercent.toFixed(2)}%)`,
                    canvas.width / 4,
                    (2 * canvas.height) / 3 + 20 * (index + 1)
                );
            });

            canvasTexture.needsUpdate = true;
        } catch (error) {
            console.error('Error fetching stock data:', error);
        }
    };

    const toggleEffect = (effectName) => {
        console.log(`Toggling effect: ${effectName}`);
        setActiveEffects((prevEffects) => {
            const updatedEffects = {
                ...prevEffects,
                [effectName]: !prevEffects[effectName],
            };
            if (canvasTexture) {
                const canvas = canvasTexture.image;
                const ctx = canvas.getContext('2d');
                drawProjection(ctx, canvas);
            }
            return updatedEffects;
        });
    };

    const renderFeatureButtons = () => {
        const features = [
            { id: 'hud', label: 'Toggle HUD' },
            { id: 'time', label: 'Toggle Time' },
            { id: 'stocks', label: 'Toggle Stocks' },
        ];

        return (
            <div className="ar-orb-buttons">
                {features.map((feature) => (
                    <div
                        key={feature.id}
                        className="ar-orb-button"
                        onClick={() => toggleEffect(feature.id)}
                    >
                        {feature.label}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <button className="ar-orb-open-button" onClick={() => setIsModalOpen(true)}>
                Open AR Orb
            </button>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <div ref={mountRef} className="threejs-container"></div>
                        {renderFeatureButtons()}
                        <button className="close-button" onClick={() => setIsModalOpen(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ARorb;
