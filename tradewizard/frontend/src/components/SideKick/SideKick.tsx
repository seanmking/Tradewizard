import React, { useState } from 'react';
import { InitialInputForm } from './InitialInputForm';
import { WhatWeKnowDashboard } from './WhatWeKnowDashboard';
import { VerificationForm } from './VerificationForm';
import { ExportPlan } from './ExportPlan';
import { SimplifiedSideKickService, SimplifiedDashboard, SimplifiedExportPlanType } from '../../services/simplifiedSidekick';
import './SideKick.css';

enum Step {
  INITIAL_INPUT = 'initial_input',
  WHAT_WE_KNOW = 'what_we_know',
  VERIFICATION = 'verification',
  EXPORT_PLAN = 'export_plan'
}

export const SideKick: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.INITIAL_INPUT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dashboard, setDashboard] = useState<SimplifiedDashboard | null>(null);
  const [exportPlan, setExportPlan] = useState<SimplifiedExportPlanType | null>(null);

  const handleInitialSubmit = async (companyName: string, businessType: string) => {
    setIsLoading(true);
    try {
      const result = await SimplifiedSideKickService.processInitialInput(companyName, businessType);
      setDashboard(result);
      setCurrentStep(Step.WHAT_WE_KNOW);
    } catch (error) {
      console.error('Error processing initial input:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToVerification = () => {
    setCurrentStep(Step.VERIFICATION);
  };

  const handleVerificationSubmit = async (verifiedDashboard: SimplifiedDashboard) => {
    setIsLoading(true);
    try {
      const result = await SimplifiedSideKickService.generateExportPlan(verifiedDashboard);
      setExportPlan(result);
      setCurrentStep(Step.EXPORT_PLAN);
    } catch (error) {
      console.error('Error generating export plan:', error);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.INITIAL_INPUT:
        return <InitialInputForm onSubmit={handleInitialSubmit} isLoading={isLoading} />;
      case Step.WHAT_WE_KNOW:
        return dashboard ? (
          <WhatWeKnowDashboard 
            dashboard={dashboard} 
            onProceed={handleProceedToVerification} 
            isLoading={isLoading} 
          />
        ) : null;
      case Step.VERIFICATION:
        return dashboard ? (
          <VerificationForm 
            dashboard={dashboard} 
            onSubmit={handleVerificationSubmit} 
            isLoading={isLoading} 
          />
        ) : null;
      case Step.EXPORT_PLAN:
        return exportPlan ? <ExportPlan plan={exportPlan} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="sidekick-container">
      <div className="sidekick-header">
        <h1>SideKick</h1>
        <p>Your intelligent export planning assistant</p>
      </div>
      
      <div className="sidekick-progress">
        <div className={`progress-step ${currentStep === Step.INITIAL_INPUT ? 'active' : ''} ${currentStep !== Step.INITIAL_INPUT ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Initial Input</div>
        </div>
        <div className={`progress-step ${currentStep === Step.WHAT_WE_KNOW ? 'active' : ''} ${currentStep !== Step.INITIAL_INPUT && currentStep !== Step.WHAT_WE_KNOW ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Review Data</div>
        </div>
        <div className={`progress-step ${currentStep === Step.VERIFICATION ? 'active' : ''} ${currentStep === Step.EXPORT_PLAN ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Verify</div>
        </div>
        <div className={`progress-step ${currentStep === Step.EXPORT_PLAN ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Export Plan</div>
        </div>
      </div>
      
      <div className="sidekick-content">
        {renderStep()}
      </div>
    </div>
  );
}; 