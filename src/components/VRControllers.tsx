import { useEffect, useRef } from 'react';
import { useXR } from '@react-three/xr';
import { useThree } from '@react-three/fiber';

interface VRControllersProps {
  onJoystickInput: (input: { x: number; y: number }) => void;
  onJump: () => void;
}

export const VRControllers = ({ onJoystickInput, onJump }: VRControllersProps) => {
  const xrState = useXR();
  const { gl } = useThree();
  const joystickInputRef = useRef({ x: 0, y: 0 });
  const jumpCooldownRef = useRef(false);

  // Handle controller input
  useEffect(() => {
    if (!xrState.session) return;

    const interval = setInterval(() => {
      const session = gl.xr.getSession();
      if (!session) return;

      session.inputSources.forEach((inputSource) => {
        const gamepad = inputSource.gamepad;
        if (!gamepad) return;

        // Left controller thumbstick (typically axes 2 and 3)
        // We'll use the left controller for movement
        if (inputSource.handedness === 'left') {
          const x = gamepad.axes[2] || 0;
          const y = gamepad.axes[3] || 0;

          // Apply deadzone
          const deadzone = 0.15;
          const newX = Math.abs(x) > deadzone ? x : 0;
          const newY = Math.abs(y) > deadzone ? y : 0;

          if (newX !== joystickInputRef.current.x || newY !== joystickInputRef.current.y) {
            joystickInputRef.current = { x: newX, y: newY };
            onJoystickInput({ x: newX, y: newY });
          }

          // Trigger button for jump (button 0 is usually the trigger)
          if (gamepad.buttons[0]?.pressed && !jumpCooldownRef.current) {
            jumpCooldownRef.current = true;
            onJump();
            setTimeout(() => {
              jumpCooldownRef.current = false;
            }, 500);
          }
        }
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [xrState.session, gl, onJoystickInput, onJump]);

  return null;
};
