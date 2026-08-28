import React from 'react';
import { Platform } from 'react-native';

export const DesktopHomeWeb: React.FC<any> = (props) => {
  if (Platform.OS !== 'web') {
    return null;
  }
  
  try {
    const { DesktopHomeWeb: WebImpl } = require('./DesktopHomeWebImpl.web');
    return <WebImpl {...props} />;
  } catch (e) {
    console.warn("DesktopHomeWeb load note:", e);
    return null;
  }
};

export default DesktopHomeWeb;
