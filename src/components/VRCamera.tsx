import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { Vector3 } from 'three';

interface VRCameraProps {
  playerPosition: Vector3;
}

export const VRCamera = ({ playerPosition }: VRCameraProps) => {
  const { camera } = useThree();
  const xrState = useXR();
  const offsetRef = useRef(new Vector3(0, 1.6, 0)); // Eye height offset

  useFrame(() => {
    // Check if in VR session
    if (xrState.session) {
      // In VR mode, position camera at player position + eye height
      camera.position.set(
        playerPosition.x + offsetRef.current.x,
        playerPosition.y + offsetRef.current.y,
        playerPosition.z + offsetRef.current.z
      );
    }
  });

  return null;
};
