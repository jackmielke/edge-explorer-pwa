import { useEffect, useRef } from 'react';
import { useXR } from '@react-three/xr';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VRControllersProps {
  setPlayerPosition: (pos: THREE.Vector3) => void;
  onJump: () => void;
}

export const VRControllers = ({ setPlayerPosition, onJump }: VRControllersProps) => {
  const xrState = useXR();
  const { gl } = useThree();
  const joystickInputRef = useRef({ x: 0, y: 0 });
  const jumpCooldownRef = useRef(false);
  const speedRef = useRef(2.0); // meters per second
  const up = new THREE.Vector3(0, 1, 0);

  // Poll controllers for input to update joystick ref and handle jump
  useEffect(() => {
    if (!xrState.session) return;

    const interval = setInterval(() => {
      const session = gl.xr.getSession();
      if (!session) return;

      session.inputSources.forEach((inputSource) => {
        const gamepad = inputSource.gamepad;
        if (!gamepad) return;

        // Prefer first two axes if available, else fall back to 2/3
        const ax0 = gamepad.axes[0] ?? 0;
        const ax1 = gamepad.axes[1] ?? 0;
        const ax2 = gamepad.axes[2] ?? ax0;
        const ax3 = gamepad.axes[3] ?? ax1;

        if (inputSource.handedness === 'left') {
          const x = (gamepad.axes.length >= 4 ? ax2 : ax0) || 0;
          const y = (gamepad.axes.length >= 4 ? ax3 : ax1) || 0;

          // Apply deadzone
          const deadzone = 0.15;
          const newX = Math.abs(x) > deadzone ? x : 0;
          const newY = Math.abs(y) > deadzone ? y : 0;

          joystickInputRef.current = { x: newX, y: newY };

          // Trigger for jump (button 0 commonly)
          if (gamepad.buttons[0]?.pressed && !jumpCooldownRef.current) {
            jumpCooldownRef.current = true;
            onJump();
            setTimeout(() => {
              jumpCooldownRef.current = false;
            }, 400);
          }
        }
      });
    }, 16);

    return () => clearInterval(interval);
  }, [xrState.session, gl, onJump]);

  // Move the XR origin based on joystick every frame, aligned to head yaw
  useFrame((_, delta) => {
    if (!xrState.session) return;
    const renderer = gl;
    const xrCam = renderer.xr.getCamera();
    const origin = xrState.origin as THREE.Object3D | undefined;
    if (!origin || !xrCam) return;

    // Head forward on XZ plane
    const forward = new THREE.Vector3();
    xrCam.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() === 0) return;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, up).negate();

    const { x, y } = joystickInputRef.current; // x: strafe, y: forward/back
    if (x === 0 && y === 0) return;

    const move = new THREE.Vector3();
    move.addScaledVector(forward, -y); // stick up is -y
    move.addScaledVector(right, x);
    if (move.lengthSq() > 1e-6) move.normalize();

    const distance = speedRef.current * delta;
    origin.position.addScaledVector(move, distance);

    // Constrain to island radius 11
    const r = Math.hypot(origin.position.x, origin.position.z);
    const R = 11;
    if (r > R) {
      const scale = R / r;
      origin.position.set(origin.position.x * scale, origin.position.y, origin.position.z * scale);
    }

    // Sync external player position
    setPlayerPosition(origin.position.clone());
  });

  return null;
};
