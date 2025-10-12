import { useState, useEffect } from 'react';
import { AppInitializationService } from '../services/AppInitializationService';
import { DatabaseService, DatabaseResult } from '../services/DatabaseService';

export interface DatabaseHookState {
  isLoading: boolean;
  error: string | null;
  databaseService: DatabaseService | null;
}

export const useDatabase = () => {
  const [state, setState] = useState<DatabaseHookState>({
    isLoading: true,
    error: null,
    databaseService: null,
  });

  useEffect(() => {
    try {
      const appInitService = AppInitializationService.getInstance();
      if (appInitService.getInitializationStatus()) {
        const dbService = appInitService.getDatabaseService();
        setState({
          isLoading: false,
          error: null,
          databaseService: dbService,
        });
      } else {
        setState({
          isLoading: false,
          error: 'Database not initialized',
          databaseService: null,
        });
      }
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Database error',
        databaseService: null,
      });
    }
  }, []);

  const executeOperation = async <T>(
    operation: (db: DatabaseService) => Promise<DatabaseResult<T>>
  ): Promise<DatabaseResult<T>> => {
    if (!state.databaseService) {
      return {
        success: false,
        error: 'Database not available',
      };
    }

    try {
      return await operation(state.databaseService);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
      };
    }
  };

  return {
    ...state,
    executeOperation,
  };
};
