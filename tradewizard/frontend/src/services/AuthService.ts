// AuthService.ts - Service for handling authentication

// For this POC, we'll use local storage to persist authentication state
// In a production app, this would include JWT token management

export interface User {
  username: string;
  hasCompletedAssessment: boolean;
}

export const AuthService = {
  // Log in a user
  login: (username: string): User => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    
    // Don't automatically set hasCompletedAssessment to true
    // Check if the user has previously completed the assessment
    const assessmentCompleted = localStorage.getItem('hasCompletedAssessment');
    if (assessmentCompleted === null) {
      localStorage.setItem('hasCompletedAssessment', 'false');
    }
    
    const hasCompletedAssessment = localStorage.getItem('hasCompletedAssessment') === 'true';
    
    return {
      username,
      hasCompletedAssessment
    };
  },
  
  // Register a new user
  register: (username: string): User => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    
    // Don't automatically set hasCompletedAssessment to true
    // New users should start with hasCompletedAssessment set to false
    localStorage.setItem('hasCompletedAssessment', 'false');
    
    return {
      username,
      hasCompletedAssessment: false
    };
  },
  
  // Log out the current user
  logout: (): void => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    // Don't clear hasCompletedAssessment on logout
    // This allows users to return to the dashboard upon login
  },
  
  // Check if a user is logged in
  isLoggedIn: (): boolean => {
    return localStorage.getItem('isLoggedIn') === 'true';
  },
  
  // Get the current user's information
  getCurrentUser: (): User | null => {
    const username = localStorage.getItem('username');
    if (!username) return null;
    
    // Get hasCompletedAssessment or default to false
    const hasCompletedAssessment = localStorage.getItem('hasCompletedAssessment') === 'true';
    
    return {
      username,
      hasCompletedAssessment
    };
  },
  
  // Check if the user has completed the assessment
  hasCompletedAssessment: (): boolean => {
    return localStorage.getItem('hasCompletedAssessment') === 'true';
  },
  
  // Mark that the user has completed the assessment
  setCompletedAssessment: (completed: boolean = true): void => {
    localStorage.setItem('hasCompletedAssessment', completed ? 'true' : 'false');
  }
};

export default AuthService; 