import React, { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../config';

// Component for displaying the export readiness report
const ExportReadinessReport: React.FC = () => {
  // State for the report data
  const [reportData, setReportData] = useState<any>(null);
  // State for loading status
  const [loading, setLoading] = useState<boolean>(true);
  // State for error message
  const [error, setError] = useState<string | null>(null);
  // State to track if the request has been made
  const [requestMade, setRequestMade] = useState<boolean>(false);

  // Get user data from context or local storage
  // This is a simplified example - in a real app, you'd get this from a context or API
  const getUserData = () => {
    // For now, return mock data
    return {
      businessId: 'test-business-id',
      // Don't hardcode the industry - in a real app this would come from user profile
      // For testing with Browns Foods, we can set it here, but the system should be flexible
      industry: 'Food & Beverage'
    };
  };

  // Function to fetch the report data
  const fetchReportData = useCallback(async () => {
    // Only fetch the report once
    if (requestMade) return;
    
    // Mark that the request has been made
    setRequestMade(true);
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching export readiness report...');
      
      // Get user data
      const userData = getUserData();
      
      // Use the proxy endpoint instead of direct MCP URL
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/api/proxy/mcp/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'generateExportReadinessReport',
          params: {
            businessId: userData.businessId,
            // Only include industry if it's available
            ...(userData.industry && { industry: userData.industry })
          }
        }),
      });
      
      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`Server error. Please try again later.`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Check if the data has the expected structure
      if (!data || !data.exportReadiness) {
        throw new Error('Invalid data structure received from server');
      }
      
      console.log('Report data received:', data);
      
      // Set the report data
      setReportData(data);
    } catch (err) {
      console.error('Error loading report data:', err);
      setError(`Error loading report data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [requestMade]);

  // Fetch the report data when the component mounts
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Render loading state
  if (loading) {
    return <div className="loading">Loading export readiness report...</div>;
  }

  // Render error state
  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => { setRequestMade(false); fetchReportData(); }}>
          Retry
        </button>
      </div>
    );
  }

  // Render the report
  if (!reportData) {
    return <div>No report data available.</div>;
  }

  // Extract data from the report
  const { exportReadiness, nextSteps, strengths, areas_for_improvement, key_trends } = reportData;

  return (
    <div className="export-readiness-report">
      <h1>Export Readiness Report</h1>
      
      {/* Overall Score */}
      <section className="overall-score">
        <h2>Overall Export Readiness</h2>
        <div className="score-display">
          <div className="score-value">{Math.round(exportReadiness.overallScore * 100)}%</div>
          <div className="score-bar">
            <div 
              className="score-fill" 
              style={{ width: `${exportReadiness.overallScore * 100}%` }}
            ></div>
          </div>
        </div>
      </section>
      
      {/* Pillar Scores */}
      <section className="pillar-scores">
        <h2>Readiness by Category</h2>
        <div className="pillars">
          <div className="pillar">
            <h3>Market Intelligence</h3>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${exportReadiness.marketIntelligence * 100}%` }}
              ></div>
            </div>
            <div className="score-value">{Math.round(exportReadiness.marketIntelligence * 100)}%</div>
          </div>
          
          <div className="pillar">
            <h3>Regulatory Compliance</h3>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${exportReadiness.regulatoryCompliance * 100}%` }}
              ></div>
            </div>
            <div className="score-value">{Math.round(exportReadiness.regulatoryCompliance * 100)}%</div>
          </div>
          
          <div className="pillar">
            <h3>Export Operations</h3>
            <div className="score-bar">
              <div 
                className="score-fill" 
                style={{ width: `${exportReadiness.exportOperations * 100}%` }}
              ></div>
            </div>
            <div className="score-value">{Math.round(exportReadiness.exportOperations * 100)}%</div>
          </div>
        </div>
      </section>
      
      {/* Next Steps */}
      <section className="next-steps">
        <h2>Recommended Next Steps</h2>
        <ul className="steps-list">
          {nextSteps.map((step: any) => (
            <li key={step.id} className="step-item">
              <div className="step-header">
                <h3>{step.title}</h3>
                <span className="estimated-time">{step.estimatedTime}</span>
              </div>
              <p>{step.description}</p>
            </li>
          ))}
        </ul>
      </section>
      
      {/* Strengths and Areas for Improvement */}
      <div className="two-column">
        <section className="strengths">
          <h2>Your Strengths</h2>
          <ul>
            {strengths.map((strength: string, index: number) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </section>
        
        <section className="improvements">
          <h2>Areas for Improvement</h2>
          <ul>
            {areas_for_improvement.map((area: string, index: number) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </section>
      </div>
      
      {/* Key Trends */}
      <section className="key-trends">
        <h2>Key Market Trends</h2>
        <ul>
          {key_trends.map((trend: string, index: number) => (
            <li key={index}>{trend}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ExportReadinessReport; 