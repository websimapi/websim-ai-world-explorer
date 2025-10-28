import * as THREE from 'three';
import { setupControls, getControls } from './controls.js';
import { updateWorld } from './world.js';
import { getAIData } from './ai.js';
import { AudioController } from './audio.js';

// DOM Elements
const canvas = document.getElementById('bg');
const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt-input');
const loader = document.getElementById('loader');
const infoBox = document.getElementById('info-box');
const locationTitle = document.getElementById('location-title');
const locationDescription = document.getElementById('location-description');
const introModal = document.getElementById('intro-modal');
const startBtn = document.getElementById('start-btn');

// Basic Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.set(0, 0, 0.1);

let audioController;

function init() {
    setupControls(camera, renderer.domElement);
    animate();

    promptForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = promptInput.value;
        if (!prompt) return;

        loader.classList.add('visible');
        infoBox.classList.remove('visible');

        try {
            const aiData = await getAIData(prompt);
            await updateWorld(scene, aiData.skyboxUrl);
            await audioController.updateAmbience(aiData.sound);
            
            locationTitle.textContent = aiData.title;
            locationDescription.textContent = aiData.description;

        } catch (error) {
            console.error("Failed to generate world:", error);
            locationTitle.textContent = "Generation Error";
            locationDescription.textContent = "Could not create the world. Please try a different prompt.";
        } finally {
            loader.classList.remove('visible');
            infoBox.classList.add('visible');
            promptInput.value = '';
        }
    });

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const controls = getControls();
    if (controls) {
        controls.update(delta);
    }
    renderer.render(scene, camera);
}

startBtn.addEventListener('click', () => {
    introModal.style.display = 'none';
    audioController = new AudioController();
    audioController.playInitialAmbience();
    infoBox.classList.add('visible');
    init();
});

