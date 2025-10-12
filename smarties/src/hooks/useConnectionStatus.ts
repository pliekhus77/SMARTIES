import { useState, useEffect } from 'react';
import { ConnectionStatusService, ConnectionStatus } from '../services/ConnectionStatusService';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: true,
    isDatabaseConnected: false,
    isOfflineMode: false,
    lastChecked: new Date(),
  });

  useEffect(() => {
    const connectionService = ConnectionStatusService.getInstance();
    const unsubscribe = connectionService.addListener(setStatus);
    
    return unsubscribe;
  }, []);

  const forceCheck = async () => {
    const connectionService = ConnectionStatusService.getInstance();
    return await connectionService.forceCheck();
  };

  return {
    ...status,
    forceCheck,
  };
};
