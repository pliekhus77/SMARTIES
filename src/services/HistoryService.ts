/**
 * History Service for Scan Result Storage
 * Implements Requirements 6.1, 6.2, 6.3 from SMARTIES API integration specification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/core';
import { AllergenAnalysisResult } from './AllergenService';

export interface ScanHistoryEntry {
  id: string;
  product: Product;
  analysis: AllergenAnalysisResult;
  timestamp: Date;
  userId?: string;
}

export class HistoryService {
  private readonly HISTORY_KEY = 'smarties_scan_history';
  private readonly MAX_ENTRIES = 1000;

  /**
   * Save scan result to history
   */
  async saveScanResult(product: Product, analysis: AllergenAnalysisResult, userId?: string): Promise<string> {
    try {
      const entry: ScanHistoryEntry = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        product,
        analysis,
        timestamp: new Date(),
        userId
      };

      const history = await this.getHistory();
      history.unshift(entry); // Add to beginning

      // Limit history size
      if (history.length > this.MAX_ENTRIES) {
        history.splice(this.MAX_ENTRIES);
      }

      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
      return entry.id;
    } catch (error) {
      console.error('Failed to save scan result:', error);
      throw error;
    }
  }

  /**
   * Get scan history
   */
  async getHistory(limit?: number): Promise<ScanHistoryEntry[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.HISTORY_KEY);
      if (!historyData) return [];

      const history: ScanHistoryEntry[] = JSON.parse(historyData);
      
      // Convert timestamp strings back to Date objects
      const processedHistory = history.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));

      return limit ? processedHistory.slice(0, limit) : processedHistory;
    } catch (error) {
      console.error('Failed to retrieve history:', error);
      return [];
    }
  }

  /**
   * Get history entry by ID
   */
  async getHistoryEntry(id: string): Promise<ScanHistoryEntry | null> {
    try {
      const history = await this.getHistory();
      return history.find(entry => entry.id === id) || null;
    } catch (error) {
      console.error('Failed to retrieve history entry:', error);
      return null;
    }
  }

  /**
   * Delete history entry
   */
  async deleteHistoryEntry(id: string): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(entry => entry.id !== id);
      
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(filteredHistory));
      return true;
    } catch (error) {
      console.error('Failed to delete history entry:', error);
      return false;
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.HISTORY_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  /**
   * Get history statistics
   */
  async getHistoryStats(): Promise<{
    totalScans: number;
    safeProducts: number;
    warningProducts: number;
    dangerousProducts: number;
    recentScans: number;
  }> {
    try {
      const history = await this.getHistory();
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      return {
        totalScans: history.length,
        safeProducts: history.filter(h => h.analysis.severity === 'safe').length,
        warningProducts: history.filter(h => h.analysis.severity === 'mild').length,
        dangerousProducts: history.filter(h => h.analysis.severity === 'severe').length,
        recentScans: history.filter(h => h.timestamp.getTime() > oneDayAgo).length
      };
    } catch (error) {
      console.error('Failed to get history stats:', error);
      return {
        totalScans: 0,
        safeProducts: 0,
        warningProducts: 0,
        dangerousProducts: 0,
        recentScans: 0
      };
    }
  }
}
