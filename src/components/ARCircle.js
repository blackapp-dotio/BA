import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { fetchCircles } from "./circleUtils";
import { EffectComposer } from 'postprocessing';
import { RenderPass } from 'postprocessing';
import { BloomEffect } from 'postprocessing';
import { EffectPass } from 'postprocessing';

const ARCircle = ({ circleName }) => {
  const mountRef = useRef();
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (hasRendered) {
      console.warn("ARCircle: Prevented duplicate rendering.");
      return;
    }

    if (!circleName) {
      console.warn("ARCircle: No circle name provided. Displaying fallback orb.");
      createFallbackOrb();
      setHasRendered(true); // Mark as rendered to prevent duplicate processing
      return cleanupARVisualization;
    }

    const fetchAndRender = async () => {
      try {
        console.log(`ARCircle: Fetching data for circle "${circleName}".`);
        const circles = await fetchCircles();
        const circle = circles.find((c) => c.name === circleName);

        if (circle) {
          console.log("ARCircle: Circle found:", circle);
          createARVisualization(circle);
        } else {
          console.warn(
            `ARCircle: No circle found for "${circleName}". Displaying fallback orb.`
          );
          createFallbackOrb();
        }
      } catch (error) {
        console.error("ARCircle: Error fetching circle data:", error);
        createFallbackOrb();
      } finally {
        setHasRendered(true); // Mark as rendered after the visualization logic
      }
    };

    fetchAndRender();

    return cleanupARVisualization;
  }, [circleName, hasRendered]);

  const createFallbackOrb = () => {
    console.log("ARCircle: Creating fallback orb.");
    const mountNode = mountRef.current;
    if (!mountNode) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / 400,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setSize(window.innerWidth, 400);
    mountNode.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0077ff,
      emissive: 0x001f5f,
      emissiveIntensity: 0.5,
    });
    const sphere = new THREE.Mesh(geometry, material);

    scene.add(sphere);
    
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(10, 10, 10);
        scene.add(light);
    

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      sphere.rotation.x += 0.01;
      sphere.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();
  };

    const createARVisualization = (circle) => {
        console.log('ARCircle: Creating AR visualization.');
        const mountNode = mountRef.current;
        if (!mountNode) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 400, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, 400);
        mountNode.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomEffect = new BloomEffect({
            intensity: 1.5,
        });
        const effectPass = new EffectPass(camera, bloomEffect);
        effectPass.renderToScreen = true;
        composer.addPass(effectPass);

        const group = new THREE.Group();
        scene.add(group);

        const radius = 3;
        const members = circle.members || [];

        members.forEach((member, index) => {
            const angle = (index / members.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshPhysicalMaterial({
                color: 0x0077ff,
                emissive: 0x001f5f,
                emissiveIntensity: 0.5,
                clearcoat: 1.0,
                reflectivity: 0.8,
                transparent: true,
                opacity: 0.9,
            });

            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, 0);
            sphere.userData = { member };
            group.add(sphere);
        });

        camera.position.z = 7;

        const animate = () => {
            requestAnimationFrame(animate);
            group.rotation.y += 0.005;
            composer.render();
        };

        animate();
        
        
                const handleClick = (event) => {
            const mouse = new THREE.Vector2(
                (event.clientX / window.innerWidth) * 2 - 1,
                -(event.clientY / 400) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(group.children);

            if (intersects.length > 0) {
                const { member } = intersects[0].object.userData;
                alert(`Clicked on: ${member.displayName}`);
            }
        };

        mountNode.addEventListener('click', handleClick);

        return () => {
            mountNode.removeEventListener('click', handleClick);
        };
    };
        
  const cleanupARVisualization = () => {
    console.log("ARCircle: Cleaning up AR visualization.");
    const mountNode = mountRef.current;
    if (mountNode) {
      while (mountNode.firstChild) {
        mountNode.removeChild(mountNode.firstChild);
      }
    }
  };

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "400px",
        background: "rgba(0,0,0,0.7)",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
      }}
    />
  );
};

export default ARCircle;
