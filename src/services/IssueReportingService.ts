/**
 * Issue Reporting Service
 * Implements Requirements 7.1, 7.2, 7.3, 7.4, 7.5 from SMARTIES API integration specification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/core';
import { AllergenAnalysisResult } from './AllergenService';

export interface IssueReport {
  id: string;
  product: Product;
  analysis?: AllergenAnalysisResult;
  issueType: 'incorrect_analysis' | 'missing_allergen' | 'wrong_ingredients' | 'other';
  description: string;
  userEmail?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  submitted: boolean;
}

export class IssueReportingService {
  private readonly REPORTS_KEY = 'smarties_issue_reports';
  private readonly API_ENDPOINT = '/api/reports';

  /**
   * Submit issue report
   */
  async submitReport(reportData: Omit<IssueReport, 'id' | 'timestamp' | 'submitted'>): Promise<string> {
    const report: IssueReport = {
      ...reportData,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      submitted: false
    };

    try {
      // Try to submit immediately
      await this.sendReportToServer(report);
      report.submitted = true;
    } catch (error) {
      console.log('Failed to submit immediately, queuing for later:', error);
      // Queue for offline submission
      await this.queueReport(report);
    }

    return report.id;
  }

  /**
   * Queue report for offline submission
   */
  private async queueReport(report: IssueReport): Promise<void> {
    try {
      const queuedReports = await this.getQueuedReports();
      queuedReports.push(report);
      await AsyncStorage.setItem(this.REPORTS_KEY, JSON.stringify(queuedReports));
    } catch (error) {
      console.error('Failed to queue report:', error);
      throw error;
    }
  }

  /**
   * Get queued reports
   */
  private async getQueuedReports(): Promise<IssueReport[]> {
    try {
      const reportsData = await AsyncStorage.getItem(this.REPORTS_KEY);
      if (!reportsData) return [];

      const reports: IssueReport[] = JSON.parse(reportsData);
      return reports.map(report => ({
        ...report,
        timestamp: new Date(report.timestamp)
      }));
    } catch (error) {
      console.error('Failed to get queued reports:', error);
      return [];
    }
  }

  /**
   * Send report to server
   */
  private async sendReportToServer(report: IssueReport): Promise<void> {
    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportId: report.id,
        productUPC: report.product.upc,
        productName: report.product.name,
        issueType: report.issueType,
        description: report.description,
        severity: report.severity,
        userEmail: report.userEmail,
        timestamp: report.timestamp.toISOString(),
        analysisData: report.analysis
      })
    });

    if (!response.ok) {
      throw new Error(`Report submission failed: ${response.status}`);
    }
  }

  /**
   * Process queued reports when online
   */
  async processQueuedReports(): Promise<{ processed: number; failed: number }> {
    const queuedReports = await this.getQueuedReports();
    const unsubmittedReports = queuedReports.filter(report => !report.submitted);

    let processed = 0;
    let failed = 0;

    for (const report of unsubmittedReports) {
      try {
        await this.sendReportToServer(report);
        report.submitted = true;
        processed++;
      } catch (error) {
        console.error(`Failed to submit report ${report.id}:`, error);
        failed++;
      }
    }

    // Update storage with submission status
    await AsyncStorage.setItem(this.REPORTS_KEY, JSON.stringify(queuedReports));

    return { processed, failed };
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<{
    totalReports: number;
    submittedReports: number;
    pendingReports: number;
    reportsByType: Record<string, number>;
  }> {
    try {
      const reports = await this.getQueuedReports();
      
      const reportsByType = reports.reduce((acc, report) => {
        acc[report.issueType] = (acc[report.issueType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalReports: reports.length,
        submittedReports: reports.filter(r => r.submitted).length,
        pendingReports: reports.filter(r => !r.submitted).length,
        reportsByType
      };
    } catch (error) {
      console.error('Failed to get report stats:', error);
      return {
        totalReports: 0,
        submittedReports: 0,
        pendingReports: 0,
        reportsByType: {}
      };
    }
  }

  /**
   * Validate report data
   */
  validateReport(reportData: Partial<IssueReport>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!reportData.product?.upc) {
      errors.push('Product UPC is required');
    }

    if (!reportData.issueType) {
      errors.push('Issue type is required');
    }

    if (!reportData.description || reportData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters');
    }

    if (reportData.userEmail && !this.isValidEmail(reportData.userEmail)) {
      errors.push('Invalid email format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
