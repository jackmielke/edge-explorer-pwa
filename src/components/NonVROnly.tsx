import React from 'react';
import { useXR } from '@react-three/xr';

interface NonVROnlyProps {
  children: React.ReactNode;
}

export const NonVROnly: React.FC<NonVROnlyProps> = ({ children }) => {
  const xrState = useXR();
  if (xrState.session) return null;
  return <>{children}</>;
};
