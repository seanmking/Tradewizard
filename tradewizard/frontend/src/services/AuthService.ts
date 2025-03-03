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
    localStorage.setItem('hasCompletedAssessment', 'true');
    
    return {
      username,
      hasCompletedAssessment: true
    };
  },
  
  // Register a new user
  register: (username: string): User => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', username);
    localStorage.setItem('hasCompletedAssessment', 'true');
    
    return {
      username,
      hasCompletedAssessment: true
    };
  },
  
  // Log out the current user
  logout: (): void => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('hasCompletedAssessment');
  },
  
  // Check if a user is logged in
  isLoggedIn: (): boolean => {
    return localStorage.getItem('isLoggedIn') === 'true';
  },
  
  // Get the current user's information
  getCurrentUser: (): User | null => {
    const username = localStorage.getItem('username');
    const hasCompletedAssessment = localStorage.getItem('hasCompletedAssessment') === 'true';
    
    if (!username) return null;
    
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