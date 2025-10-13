/**
 * Connection Status Service
 * Task 7.2: Implement error handling and offline mode UI
 * 
 * Handles:
 * - Database connection status tracking
 * - Offline mode detection and notifications
 * 
 * Requirements: 5.3, 5.4
 */

import { AppInitializationService } from './AppInitializationService';

export interface ConnectionStatus {
  isOnline: boolean;
  isDatabaseConnected: boolean;
  isOfflineMode: boolean;
  lastChecked: Date;
}

type ConnectionListener = (status: ConnectionStatus) => void;

export class ConnectionStatusService {
  private static instance: ConnectionStatusService;
  private listeners: ConnectionListener[] = [];
  private currentStatus: ConnectionStatus = {
    isOnline: true,
    isDatabaseConnected: false,
    isOfflineMode: false,
    lastChecked: new Date(),
  };
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicCheck();
  }

  public static getInstance(): ConnectionStatusService {
    if (!ConnectionStatusService.instance) {
      ConnectionStatusService.instance = new ConnectionStatusService();
    }
    return ConnectionStatusService.instance;
  }

  private startPeriodicCheck() {
    // DISABLED: Network checks causing app crash
    console.log('Connection status checks disabled');
    
    /*
    // Check connection status every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkDatabaseConnection();
    }, 30000);

    // Initial check
    this.checkDatabaseConnection();
    */
  }

  private async checkDatabaseConnection() {
    try {
      const appInitService = AppInitializationService.getInstance();
      if (appInitService.getInitializationStatus()) {
        const dbService = appInitService.getDatabaseService();
        const isConnected = await dbService.testConnection();
        this.updateConnectionStatus({ 
          isDatabaseConnected: isConnected,
          isOnline: isConnected // Assume online if DB is connected
        });
      }
    } catch (error) {
      this.updateConnectionStatus({ 
        isDatabaseConnected: false,
        isOnline: false
      });
    }
  }

  private updateConnectionStatus(updates: Partial<ConnectionStatus>) {
    const newStatus = {
      ...this.currentStatus,
      ...updates,
      lastChecked: new Date(),
    };

    // Determine offline mode
    newStatus.isOfflineMode = !newStatus.isOnline || !newStatus.isDatabaseConnected;

    this.currentStatus = newStatus;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error notifying connection status listener:', error);
      }
    });
  }

  public addListener(listener: ConnectionListener): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    listener(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getCurrentStatus(): ConnectionStatus {
    return { ...this.currentStatus };
  }

  public async forceCheck(): Promise<ConnectionStatus> {
    await this.checkDatabaseConnection();
    return this.getCurrentStatus();
  }

  public cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
