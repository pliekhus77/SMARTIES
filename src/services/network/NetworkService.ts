import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export class NetworkService {
  private listeners: Array<(state: NetworkState) => void> = [];
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Get initial state
    const state = await NetInfo.fetch();
    this.updateState(state);

    // Listen for changes
    NetInfo.addEventListener(this.handleStateChange);
  }

  private handleStateChange = (state: any) => {
    this.updateState(state);
  };

  private updateState(netInfoState: any) {
    const newState: NetworkState = {
      isConnected: netInfoState.isConnected ?? false,
      isInternetReachable: netInfoState.isInternetReachable ?? false,
      type: netInfoState.type || 'unknown',
    };

    const hasChanged = 
      newState.isConnected !== this.currentState.isConnected ||
      newState.isInternetReachable !== this.currentState.isInternetReachable;

    this.currentState = newState;

    if (hasChanged) {
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  getState(): NetworkState {
    return { ...this.currentState };
  }

  isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  addListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async checkConnectivity(): Promise<NetworkState> {
    const state = await NetInfo.fetch();
    this.updateState(state);
    return this.getState();
  }
}
