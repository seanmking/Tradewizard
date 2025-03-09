/**
 * Monitoring Utilities
 * 
 * This module provides utilities for monitoring and telemetry
 * to track performance, errors, and usage patterns.
 */

/**
 * Metric types that can be tracked
 */
export enum MetricType {
  RESPONSE_TIME = 'response_time',
  ERROR_RATE = 'error_rate',
  CACHE_HIT_RATE = 'cache_hit_rate',
  LLM_USAGE = 'llm_usage',
  API_CALLS = 'api_calls',
  DATA_QUALITY = 'data_quality'
}

/**
 * Interface for metric data
 */
export interface Metric {
  type: MetricType;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

/**
 * Simple in-memory metrics store
 */
class MetricsStore {
  private metrics: Metric[] = [];
  private readonly MAX_METRICS = 1000;

  /**
   * Add a metric to the store
   */
  addMetric(metric: Metric): void {
    this.metrics.push(metric);
    
    // Trim if we exceed the maximum
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get metrics filtered by type and time range
   */
  getMetrics(
    type?: MetricType,
    startTime?: number,
    endTime?: number
  ): Metric[] {
    return this.metrics.filter(metric => {
      if (type && metric.type !== type) return false;
      if (startTime && metric.timestamp < startTime) return false;
      if (endTime && metric.timestamp > endTime) return false;
      return true;
    });
  }

  /**
   * Calculate average for a metric type in a time range
   */
  getAverage(
    type: MetricType,
    startTime?: number,
    endTime?: number
  ): number | null {
    const metrics = this.getMetrics(type, startTime, endTime);
    
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }
}

// Create a singleton metrics store
const metricsStore = new MetricsStore();

/**
 * Track response time for an operation
 */
export function trackResponseTime(
  operation: string,
  fn: () => Promise<any>,
  labels: Record<string, string> = {}
): Promise<any> {
  const startTime = Date.now();
  
  return fn().then(result => {
    const duration = Date.now() - startTime;
    
    metricsStore.addMetric({
      type: MetricType.RESPONSE_TIME,
      value: duration,
      timestamp: Date.now(),
      labels: { operation, ...labels }
    });
    
    return result;
  }).catch(error => {
    const duration = Date.now() - startTime;
    
    metricsStore.addMetric({
      type: MetricType.RESPONSE_TIME,
      value: duration,
      timestamp: Date.now(),
      labels: { operation, error: 'true', ...labels }
    });
    
    metricsStore.addMetric({
      type: MetricType.ERROR_RATE,
      value: 1,
      timestamp: Date.now(),
      labels: { operation, errorMessage: error.message, ...labels }
    });
    
    throw error;
  });
}

/**
 * Track cache hit/miss
 */
export function trackCacheHit(
  cacheKey: string,
  hit: boolean,
  labels: Record<string, string> = {}
): void {
  metricsStore.addMetric({
    type: MetricType.CACHE_HIT_RATE,
    value: hit ? 1 : 0,
    timestamp: Date.now(),
    labels: { cacheKey, ...labels }
  });
}

/**
 * Track LLM usage
 */
export function trackLLMUsage(
  model: string,
  promptTokens: number,
  completionTokens: number,
  labels: Record<string, string> = {}
): void {
  metricsStore.addMetric({
    type: MetricType.LLM_USAGE,
    value: promptTokens + completionTokens,
    timestamp: Date.now(),
    labels: { model, promptTokens: String(promptTokens), completionTokens: String(completionTokens), ...labels }
  });
}

/**
 * Track API call to external service
 */
export function trackAPICall(
  service: string,
  endpoint: string,
  success: boolean,
  labels: Record<string, string> = {}
): void {
  metricsStore.addMetric({
    type: MetricType.API_CALLS,
    value: success ? 1 : 0,
    timestamp: Date.now(),
    labels: { service, endpoint, success: String(success), ...labels }
  });
}

/**
 * Track data quality
 */
export function trackDataQuality(
  dataType: string,
  completeness: number,
  accuracy?: number,
  labels: Record<string, string> = {}
): void {
  metricsStore.addMetric({
    type: MetricType.DATA_QUALITY,
    value: completeness,
    timestamp: Date.now(),
    labels: { dataType, accuracy: accuracy !== undefined ? String(accuracy) : 'unknown', ...labels }
  });
}

/**
 * Get metrics for a dashboard
 */
export function getDashboardMetrics(
  timeRangeMinutes: number = 60
): Record<string, any> {
  const endTime = Date.now();
  const startTime = endTime - (timeRangeMinutes * 60 * 1000);
  
  return {
    responseTime: {
      average: metricsStore.getAverage(MetricType.RESPONSE_TIME, startTime, endTime) || 0,
      byOperation: groupMetricsByLabel(
        metricsStore.getMetrics(MetricType.RESPONSE_TIME, startTime, endTime),
        'operation'
      )
    },
    errorRate: {
      overall: calculateErrorRate(startTime, endTime),
      byOperation: groupMetricsByLabel(
        metricsStore.getMetrics(MetricType.ERROR_RATE, startTime, endTime),
        'operation'
      )
    },
    cacheHitRate: calculateCacheHitRate(startTime, endTime),
    llmUsage: {
      totalTokens: calculateTotalLLMTokens(startTime, endTime),
      byModel: groupMetricsByLabel(
        metricsStore.getMetrics(MetricType.LLM_USAGE, startTime, endTime),
        'model'
      )
    },
    apiCalls: {
      totalCalls: metricsStore.getMetrics(MetricType.API_CALLS, startTime, endTime).length,
      successRate: calculateAPISuccessRate(startTime, endTime),
      byService: groupMetricsByLabel(
        metricsStore.getMetrics(MetricType.API_CALLS, startTime, endTime),
        'service'
      )
    },
    dataQuality: {
      average: metricsStore.getAverage(MetricType.DATA_QUALITY, startTime, endTime) || 0,
      byDataType: groupMetricsByLabel(
        metricsStore.getMetrics(MetricType.DATA_QUALITY, startTime, endTime),
        'dataType'
      )
    }
  };
}

/**
 * Helper function to calculate error rate
 */
function calculateErrorRate(startTime: number, endTime: number): number {
  const errorMetrics = metricsStore.getMetrics(MetricType.ERROR_RATE, startTime, endTime);
  const responseTimeMetrics = metricsStore.getMetrics(MetricType.RESPONSE_TIME, startTime, endTime);
  
  if (responseTimeMetrics.length === 0) return 0;
  
  return errorMetrics.length / responseTimeMetrics.length;
}

/**
 * Helper function to calculate cache hit rate
 */
function calculateCacheHitRate(startTime: number, endTime: number): number {
  const cacheMetrics = metricsStore.getMetrics(MetricType.CACHE_HIT_RATE, startTime, endTime);
  
  if (cacheMetrics.length === 0) return 0;
  
  const hits = cacheMetrics.filter(metric => metric.value === 1).length;
  return hits / cacheMetrics.length;
}

/**
 * Helper function to calculate total LLM tokens
 */
function calculateTotalLLMTokens(startTime: number, endTime: number): number {
  const llmMetrics = metricsStore.getMetrics(MetricType.LLM_USAGE, startTime, endTime);
  
  return llmMetrics.reduce((acc, metric) => acc + metric.value, 0);
}

/**
 * Helper function to calculate API success rate
 */
function calculateAPISuccessRate(startTime: number, endTime: number): number {
  const apiMetrics = metricsStore.getMetrics(MetricType.API_CALLS, startTime, endTime);
  
  if (apiMetrics.length === 0) return 0;
  
  const successfulCalls = apiMetrics.filter(metric => metric.value === 1).length;
  return successfulCalls / apiMetrics.length;
}

/**
 * Helper function to group metrics by a label
 */
function groupMetricsByLabel(
  metrics: Metric[],
  labelKey: string
): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const metric of metrics) {
    const labelValue = metric.labels[labelKey];
    
    if (!labelValue) continue;
    
    if (!result[labelValue]) {
      result[labelValue] = {
        count: 0,
        sum: 0,
        average: 0
      };
    }
    
    result[labelValue].count++;
    result[labelValue].sum += metric.value;
    result[labelValue].average = result[labelValue].sum / result[labelValue].count;
  }
  
  return result;
} 