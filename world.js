import * as THREE from 'three';

let skyboxMesh = null;
const textureLoader = new THREE.TextureLoader();

export async function updateWorld(scene, skyboxUrl) {
    return new Promise((resolve, reject) => {
        textureLoader.load(skyboxUrl, (texture) => {
            if (skyboxMesh) {
                scene.remove(skyboxMesh);
                skyboxMesh.geometry.dispose();
                skyboxMesh.material.map.dispose();
                skyboxMesh.material.dispose();
            }

            // Panoramas are usually mapped to the inside of a sphere.
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            // Invert the geometry on the x-axis so that all of the faces point inward
            geometry.scale(-1, 1, 1);

            const material = new THREE.MeshBasicMaterial({ map: texture });
            skyboxMesh = new THREE.Mesh(geometry, material);
            scene.add(skyboxMesh);
            resolve();
        }, undefined, (error) => {
            console.error('An error happened while loading the texture.', error);
            reject(error);
        });
    });
}

