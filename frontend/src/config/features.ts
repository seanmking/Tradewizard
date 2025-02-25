export interface FeatureFlags {
  useMockValidation: boolean;
  useRealTimeValidation: boolean;
  enableIndustryFilters: boolean;
}

// Helper function to safely read environment variables
const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof window !== 'undefined' && (window as any).__env) {
    return (window as any).__env[key] || defaultValue;
  }
  return defaultValue;
};

const features: FeatureFlags = {
  // Toggle between mock and real validation services
  useMockValidation: getEnvVar('REACT_APP_USE_MOCK_VALIDATION', 'true') === 'true',
  
  // Enable/disable real-time validation as user types
  useRealTimeValidation: true,
  
  // Enable/disable industry filtering functionality
  enableIndustryFilters: getEnvVar('REACT_APP_ENABLE_INDUSTRY_FILTERS', 'false') === 'true'
};

export const getFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  return features[flag];
};

export default features; 