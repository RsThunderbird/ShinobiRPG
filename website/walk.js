/**
 * walk.js - Universal 3D Character Movement & Animation Controller
 * Handles terrain-following, procedural walking, and AI state management.
 */

class UniversalController {
    constructor(model, mixer, getTerrainHeight) {
        this.model = model;
        this.mixer = mixer;
        this.getTerrainHeight = getTerrainHeight;

        this.velocity = new THREE.Vector3();
        this.speed = 2.0;
        this.isWalking = false;

        // Procedural walking variables (if no animations found)
        this.walkCycle = 0;
        this.hasAnimations = mixer && mixer._actions && mixer._actions.length > 0;
    }

    update(delta) {
        if (this.mixer) this.mixer.update(delta);

        if (this.isWalking) {
            // Apply movement
            const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.model.quaternion);
            this.model.position.addScaledVector(direction, this.speed * delta);

            // Terrain Following
            const targetY = this.getTerrainHeight(this.model.position.x, this.model.position.z);
            this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, targetY, 0.1);

            // Procedural "Bobbing" dance if no real animations exist
            if (!this.hasAnimations) {
                this.walkCycle += delta * 10;
                this.model.rotation.z = Math.sin(this.walkCycle) * 0.05; // Gentle sway
                this.model.position.y += Math.abs(Math.sin(this.walkCycle)) * 0.1; // Small hop
            }
        } else {
            // Reset procedural sway when idle
            if (!this.hasAnimations) {
                this.model.rotation.z = THREE.MathUtils.lerp(this.model.rotation.z, 0, 0.1);
            }
        }
    }

    moveTo(targetPos, delta) {
        const dx = targetPos.x - this.model.position.x;
        const dz = targetPos.z - this.model.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.5) {
            this.isWalking = true;
            const targetAngle = Math.atan2(dx, dz);

            // Smooth rotation towards target
            const currentRotation = this.model.rotation.y;
            let diff = targetAngle - currentRotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.model.rotation.y += diff * 0.05;

            this.update(delta);
        } else {
            this.isWalking = false;
            this.update(delta);
            return true; // Reached target
        }
        return false;
    }
}

// AI Brain for the Deer
class DeerAI extends UniversalController {
    constructor(model, mixer, getTerrainHeight, animations = []) {
        super(model, mixer, getTerrainHeight);
        this.target = new THREE.Vector3();
        this.state = 'IDLE'; // IDLE, WANDERING
        this.timer = Math.random() * 5;
        this.speed = 1.5 + Math.random();

        this.animations = animations;
        this.walkAction = null;
        if (mixer && animations.length > 0) {
            const walkClip = animations.find(a => a.name === 'GltfAnimation0') || animations[0];
            this.walkAction = mixer.clipAction(walkClip);
        }
    }

    updateAI(delta) {
        this.timer -= delta;

        if (this.state === 'IDLE') {
            this.isWalking = false;
            if (this.walkAction) this.walkAction.stop();
            if (this.timer <= 0) {
                // Pick random spot within 40 units
                this.target.set(
                    this.model.position.x + (Math.random() - 0.5) * 80,
                    0,
                    this.model.position.z + (Math.random() - 0.5) * 80
                );
                this.state = 'WANDERING';
                this.timer = 10 + Math.random() * 15;
            }
        } else if (this.state === 'WANDERING') {
            this.isWalking = true;
            if (this.walkAction && !this.walkAction.isRunning()) this.walkAction.play();

            const arrived = this.moveTo(this.target, delta);
            if (arrived || this.timer <= 0) {
                this.state = 'IDLE';
                this.timer = 2 + Math.random() * 5;
                if (this.walkAction) this.walkAction.fadeOut(0.5);
            }
        }

        super.update(delta);
    }
}

window.UniversalController = UniversalController;
window.DeerAI = DeerAI;
