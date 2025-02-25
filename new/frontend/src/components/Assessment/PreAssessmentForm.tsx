import React, { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  Paper,
} from '@mui/material';

interface Question {
  id: string;
  question: string;
  type: 'select' | 'multiselect';
  options: string[];
}

interface PreAssessmentFormProps {
  onSubmit: (responses: Record<string, any>) => void;
}

export const PreAssessmentForm = ({
  onSubmit
}: PreAssessmentFormProps) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [businessQuestions, setBusinessQuestions] = useState<Question[]>([]);
  const [riskQuestions, setRiskQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Fetch questions from the backend
    const fetchQuestions = async () => {
      try {
        const businessRes = await fetch('/api/assessment/business-questions');
        const riskRes = await fetch('/api/assessment/risk-questions');
        
        const businessData = await businessRes.json();
        const riskData = await riskRes.json();
        
        setBusinessQuestions(businessData);
        setRiskQuestions(riskData);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    fetchQuestions();
  }, []);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleResponse = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(responses);
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'select':
        return (
          <FormControl fullWidth margin="normal" key={question.id}>
            <FormLabel>{question.question}</FormLabel>
            <Select
              value={responses[question.id] || ''}
              onChange={(e: SelectChangeEvent) => handleResponse(question.id, e.target.value)}
            >
              {question.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'multiselect':
        return (
          <FormControl component="fieldset" margin="normal" key={question.id}>
            <FormLabel component="legend">{question.question}</FormLabel>
            <FormGroup>
              {question.options.map((option) => (
                <FormControlLabel
                  key={option}
                  control={
                    <Checkbox
                      checked={responses[question.id]?.includes(option) || false}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const currentValues = responses[question.id] || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option]
                          : currentValues.filter((v: string) => v !== option);
                        handleResponse(question.id, newValues);
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormGroup>
          </FormControl>
        );
      default:
        return null;
    }
  };

  const steps = ['Business Verification', 'Risk Assessment', 'Review'];

  const getCurrentQuestions = () => {
    switch (activeStep) {
      case 0:
        return businessQuestions;
      case 1:
        return riskQuestions;
      default:
        return [];
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, margin: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={3} sx={{ p: 4 }}>
        {activeStep === steps.length - 1 ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Responses
            </Typography>
            {/* Add response review UI here */}
            <Button
              variant="contained"
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Submit Assessment
            </Button>
          </Box>
        ) : (
          <Box>
            {getCurrentQuestions().map((question) => renderQuestion(question))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}; 