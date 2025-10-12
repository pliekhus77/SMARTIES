/**
 * User Feedback and Continuous Improvement Service
 * Implements Requirements 8.4, 8.5 from vector search specification
 */

export interface UserFeedback {
  id: string;
  analysisId: string;
  upc: string;
  userId: string;
  feedbackType: 'correction' | 'rating' | 'report_error';
  originalAnalysis: any;
  userCorrection?: UserCorrection;
  rating?: number; // 1-5 scale
  errorReport?: ErrorReport;
  timestamp: Date;
  processed: boolean;
}

export interface UserCorrection {
  correctSafetyLevel: 'safe' | 'caution' | 'danger';
  correctViolations: string[];
  additionalNotes: string;
  confidence: number;
}

export interface ErrorReport {
  errorType: 'false_positive' | 'false_negative' | 'missing_ingredient' | 'wrong_certification';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ImprovementMetrics {
  totalFeedback: number;
  accuracyTrend: number[];
  commonErrors: Map<string, number>;
  userSatisfaction: number;
  modelConfidenceImprovement: number;
}

export class UserFeedbackService {
  private feedback: UserFeedback[] = [];
  private improvementMetrics: ImprovementMetrics = {
    totalFeedback: 0,
    accuracyTrend: [],
    commonErrors: new Map(),
    userSatisfaction: 0,
    modelConfidenceImprovement: 0
  };

  /**
   * Submit user feedback for analysis
   */
  submitFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'processed'>): string {
    const feedbackEntry: UserFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      processed: false
    };

    this.feedback.push(feedbackEntry);
    this.updateMetrics(feedbackEntry);
    
    // Process feedback immediately for high severity errors
    if (feedback.errorReport?.severity === 'high') {
      this.processFeedback(feedbackEntry);
    }

    return feedbackEntry.id;
  }

  /**
   * Process feedback to improve model accuracy
   */
  processFeedback(feedback: UserFeedback): void {
    if (feedback.processed) return;

    switch (feedback.feedbackType) {
      case 'correction':
        this.processCorrection(feedback);
        break;
      case 'rating':
        this.processRating(feedback);
        break;
      case 'report_error':
        this.processErrorReport(feedback);
        break;
    }

    feedback.processed = true;
    this.updateAccuracyTrend();
  }

  /**
   * Process user correction feedback
   */
  private processCorrection(feedback: UserFeedback): void {
    if (!feedback.userCorrection) return;

    const correction = feedback.userCorrection;
    
    // Log correction for model retraining
    console.log(`User correction for UPC ${feedback.upc}:`, {
      original: feedback.originalAnalysis.safetyLevel,
      corrected: correction.correctSafetyLevel,
      violations: correction.correctViolations
    });

    // Update common errors tracking
    const errorKey = `${feedback.originalAnalysis.safetyLevel}_to_${correction.correctSafetyLevel}`;
    const currentCount = this.improvementMetrics.commonErrors.get(errorKey) || 0;
    this.improvementMetrics.commonErrors.set(errorKey, currentCount + 1);

    // Store correction for future model improvements
    this.storeModelImprovement(feedback.upc, correction);
  }

  /**
   * Process user rating feedback
   */
  private processRating(feedback: UserFeedback): void {
    if (feedback.rating === undefined) return;

    // Update user satisfaction metrics
    const allRatings = this.feedback
      .filter(f => f.feedbackType === 'rating' && f.rating !== undefined)
      .map(f => f.rating!);
    
    this.improvementMetrics.userSatisfaction = 
      allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
  }

  /**
   * Process error report feedback
   */
  private processErrorReport(feedback: UserFeedback): void {
    if (!feedback.errorReport) return;

    const error = feedback.errorReport;
    
    // Log error for investigation
    console.error(`User reported error for UPC ${feedback.upc}:`, {
      type: error.errorType,
      severity: error.severity,
      description: error.description
    });

    // Track error patterns
    const errorCount = this.improvementMetrics.commonErrors.get(error.errorType) || 0;
    this.improvementMetrics.commonErrors.set(error.errorType, errorCount + 1);

    // Alert for high severity errors
    if (error.severity === 'high') {
      this.alertHighSeverityError(feedback);
    }
  }

  /**
   * Store model improvement data
   */
  private storeModelImprovement(upc: string, correction: UserCorrection): void {
    // In a real implementation, this would update training data
    const improvement = {
      upc,
      correction,
      timestamp: new Date(),
      confidence: correction.confidence
    };

    // Store for batch model retraining
    console.log('Storing model improvement:', improvement);
  }

  /**
   * Update accuracy trend based on feedback
   */
  private updateAccuracyTrend(): void {
    const recentFeedback = this.feedback
      .filter(f => f.processed && f.feedbackType === 'correction')
      .slice(-100); // Last 100 corrections

    if (recentFeedback.length === 0) return;

    const correctAnalyses = recentFeedback.filter(f => {
      const correction = f.userCorrection;
      return correction && 
        f.originalAnalysis.safetyLevel === correction.correctSafetyLevel;
    }).length;

    const accuracy = correctAnalyses / recentFeedback.length;
    this.improvementMetrics.accuracyTrend.push(accuracy);

    // Keep only last 20 data points
    if (this.improvementMetrics.accuracyTrend.length > 20) {
      this.improvementMetrics.accuracyTrend.shift();
    }
  }

  /**
   * Update overall metrics
   */
  private updateMetrics(feedback: UserFeedback): void {
    this.improvementMetrics.totalFeedback++;
    
    // Calculate confidence improvement
    if (feedback.userCorrection) {
      const originalConfidence = feedback.originalAnalysis.confidence || 0;
      const userConfidence = feedback.userCorrection.confidence;
      const improvement = userConfidence - originalConfidence;
      
      this.improvementMetrics.modelConfidenceImprovement = 
        (this.improvementMetrics.modelConfidenceImprovement + improvement) / 2;
    }
  }

  /**
   * Alert for high severity errors
   */
  private alertHighSeverityError(feedback: UserFeedback): void {
    console.error('HIGH SEVERITY ERROR REPORTED:', {
      upc: feedback.upc,
      userId: feedback.userId,
      error: feedback.errorReport,
      timestamp: feedback.timestamp
    });

    // In production, this would trigger alerts to the development team
  }

  /**
   * Get improvement recommendations
   */
  getImprovementRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze common errors
    const sortedErrors = Array.from(this.improvementMetrics.commonErrors.entries())
      .sort((a, b) => b[1] - a[1]);

    if (sortedErrors.length > 0) {
      const topError = sortedErrors[0];
      recommendations.push(`Address most common error: ${topError[0]} (${topError[1]} occurrences)`);
    }

    // Check accuracy trend
    const trend = this.improvementMetrics.accuracyTrend;
    if (trend.length >= 3) {
      const recent = trend.slice(-3);
      const isDecreasing = recent[0] > recent[1] && recent[1] > recent[2];
      
      if (isDecreasing) {
        recommendations.push('Model accuracy is declining - consider retraining');
      }
    }

    // Check user satisfaction
    if (this.improvementMetrics.userSatisfaction < 3.5) {
      recommendations.push('User satisfaction is low - review analysis quality');
    }

    return recommendations;
  }

  /**
   * Get feedback analytics
   */
  getFeedbackAnalytics(): {
    totalFeedback: number;
    feedbackByType: Record<string, number>;
    averageRating: number;
    topErrors: Array<{ error: string; count: number }>;
    accuracyTrend: number[];
  } {
    const feedbackByType = this.feedback.reduce((acc, f) => {
      acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ratings = this.feedback
      .filter(f => f.rating !== undefined)
      .map(f => f.rating!);
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
      : 0;

    const topErrors = Array.from(this.improvementMetrics.commonErrors.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalFeedback: this.improvementMetrics.totalFeedback,
      feedbackByType,
      averageRating,
      topErrors,
      accuracyTrend: [...this.improvementMetrics.accuracyTrend]
    };
  }
}
