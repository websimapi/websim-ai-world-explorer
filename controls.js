import * as THREE from 'three';
import nipplejs from 'nipplejs';

let camera;
let domElement;
let controls = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
};
let euler = new THREE.Euler(0, 0, 0, 'YXZ');
const PI_2 = Math.PI / 2;
const moveSpeed = 5.0;
const lookSpeed = 2.0;

let lookDelta = { x: 0, y: 0 };
let moveDelta = { x: 0, y: 0 };

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function setupControls(cameraInstance, domElementInstance) {
    camera = cameraInstance;
    domElement = domElementInstance;

    if (isMobile()) {
        setupMobileControls();
    } else {
        setupDesktopControls();
    }
}

function setupDesktopControls() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    domElement.addEventListener('click', () => {
        domElement.requestPointerLock();
    });
}

function setupMobileControls() {
    const joystickContainer = document.getElementById('joystick-container');
    const joystick = nipplejs.create({
        zone: joystickContainer,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 120
    });

    joystick.on('move', (evt, data) => {
        const angle = data.angle.radian;
        moveDelta.x = Math.cos(angle) * data.force;
        moveDelta.y = Math.sin(angle) * data.force;
    });

    joystick.on('end', () => {
        moveDelta.x = 0;
        moveDelta.y = 0;
    });

    let touchStartX = 0;
    let touchStartY = 0;

    domElement.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && e.target === domElement) {
            touchStartX = e.touches[0].pageX;
            touchStartY = e.touches[0].pageY;
        }
    });

    domElement.addEventListener('touchmove', (e) => {
         if (e.touches.length === 1 && e.target === domElement) {
            const touchX = e.touches[0].pageX;
            const touchY = e.touches[0].pageY;
            
            lookDelta.x = (touchX - touchStartX) * 0.005;
            lookDelta.y = (touchY - touchStartY) * 0.005;

            touchStartX = touchX;
            touchStartY = touchY;
        }
    });

    domElement.addEventListener('touchend', () => {
        lookDelta.x = 0;
        lookDelta.y = 0;
    });
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': controls.moveForward = true; break;
        case 'ArrowLeft': case 'KeyA': controls.moveLeft = true; break;
        case 'ArrowDown': case 'KeyS': controls.moveBackward = true; break;
        case 'ArrowRight': case 'KeyD': controls.moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': controls.moveForward = false; break;
        case 'ArrowLeft': case 'KeyA': controls.moveLeft = false; break;
        case 'ArrowDown': case 'KeyS': controls.moveBackward = false; break;
        case 'ArrowRight': case 'KeyD': controls.moveRight = false; break;
    }
}

function onMouseMove(event) {
    if (document.pointerLockElement !== domElement) return;
    lookDelta.x = event.movementX || 0;
    lookDelta.y = event.movementY || 0;
}

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function update(delta) {
    // Look
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= (lookDelta.x * lookSpeed * delta);
    euler.x -= (lookDelta.y * lookSpeed * delta);
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
    
    // Reset look delta after applying it, especially for mouse which is not event-based like touch
    if (!isMobile()) {
        lookDelta = { x: 0, y: 0 };
    }

    // Movement
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(controls.moveForward) - Number(controls.moveBackward);
    direction.x = Number(controls.moveRight) - Number(controls.moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (isMobile()) {
        if (Math.abs(moveDelta.x) > 0.1 || Math.abs(moveDelta.y) > 0.1) {
            // NippleJS y is inverted relative to typical forward vector
            direction.z = -moveDelta.y; 
            direction.x = moveDelta.x;
            direction.normalize();
        }
    }

    if (controls.moveForward || controls.moveBackward) velocity.z -= direction.z * moveSpeed * delta;
    if (controls.moveLeft || controls.moveRight) velocity.x -= direction.x * moveSpeed * delta;
    
    // Mobile movement
    if (isMobile() && (Math.abs(moveDelta.x) > 0.1 || Math.abs(moveDelta.y) > 0.1)) {
        velocity.z -= direction.z * moveSpeed * delta;
        velocity.x -= direction.x * moveSpeed * delta;
    }


    camera.translateX(-velocity.x * 10.0);
    camera.translateZ(velocity.z * 10.0);
}


export function getControls() {
    return { update };
}

