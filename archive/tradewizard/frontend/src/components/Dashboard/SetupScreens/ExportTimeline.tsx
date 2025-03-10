import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Stack
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import moment from 'moment';
import { NavigateNext, NavigateBefore, CalendarMonth } from '@mui/icons-material';
import analysisService, { TimelineOption } from '../../../services/analysis-service';

interface ExportTimelineProps {
  onContinue: () => void;
  onBack?: () => void;
  useMockData?: boolean;
}

const ExportTimeline: React.FC<ExportTimelineProps> = ({ onContinue, onBack, useMockData = false }) => {
  const [selectedOption, setSelectedOption] = useState<string>('standard');
  const [customDate, setCustomDate] = useState<moment.Moment | null>(moment().add(2, 'weeks'));
  const [timelineOptions, setTimelineOptions] = useState<TimelineOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load timeline options from the API
  useEffect(() => {
    const fetchTimelineOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get cached markets from localStorage or use defaults
        const savedData = localStorage.getItem('tradewizard_user_data');
        const userData = savedData ? JSON.parse(savedData) : {};
        
        const markets = userData.selectedMarkets || ['United Kingdom'];
        const industry = userData.industry || 'Food Products';
        
        console.log(`Fetching timeline options for markets: ${markets}, industry: ${industry}, useMockData: ${useMockData}`);
        
        if (useMockData) {
          console.log("Using mock timeline data");
          // Use mock data
          const mockOptions: TimelineOption[] = [
            {
              id: 'standard',
              title: 'Standard Timeline',
              description: 'A balanced approach to market entry with moderate resource requirements.',
              timeframe: '6-9 months',
              milestones: [
                { label: 'Market Research & Validation', duration: '4-6 weeks' },
                { label: 'Regulatory Compliance', duration: '8-12 weeks' },
                { label: 'Logistics Setup', duration: '4-6 weeks' },
                { label: 'Marketing & Distribution', duration: '6-8 weeks' },
                { label: 'First Shipment', duration: '2-4 weeks' }
              ]
            },
            {
              id: 'accelerated',
              title: 'Accelerated Timeline',
              description: 'Fast-track your market entry with higher resource intensity.',
              timeframe: '3-5 months',
              milestones: [
                { label: 'Rapid Market Assessment', duration: '2-3 weeks' },
                { label: 'Expedited Compliance', duration: '4-6 weeks' },
                { label: 'Logistics Fast-track', duration: '2-3 weeks' },
                { label: 'Marketing Launch', duration: '3-4 weeks' },
                { label: 'First Shipment', duration: '1-2 weeks' }
              ]
            },
            {
              id: 'conservative',
              title: 'Conservative Timeline',
              description: 'A methodical approach with thorough planning and lower risk.',
              timeframe: '9-12 months',
              milestones: [
                { label: 'Comprehensive Market Analysis', duration: '6-8 weeks' },
                { label: 'Complete Regulatory Compliance', duration: '12-16 weeks' },
                { label: 'Thorough Logistics Planning', duration: '6-8 weeks' },
                { label: 'Strategic Marketing & Distribution', duration: '8-10 weeks' },
                { label: 'Test Shipment', duration: '2-3 weeks' },
                { label: 'Full-scale Launch', duration: '4-6 weeks' }
              ]
            }
          ];
          
          setTimelineOptions(mockOptions);
          setSelectedOption(mockOptions[0].id);
          setLoading(false);
        } else {
          // Fetch timeline options from the API
          const options = await analysisService.getTimelineOptions(industry, markets);
          
          if (options.length > 0) {
            setTimelineOptions(options);
            // Set the first option as selected by default
            setSelectedOption(options[0].id);
          } else {
            throw new Error('No timeline options returned from API');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching timeline options:', error);
        setError('Failed to load timeline options. Please try again.');
        setLoading(false);
      }
    };
    
    fetchTimelineOptions();
  }, [useMockData]);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleCustomDateChange = (date: moment.Moment | null) => {
    setCustomDate(date);
  };

  const handleContinue = () => {
    // Save the selected timeline option to localStorage
    const savedData = localStorage.getItem('tradewizard_user_data');
    const userData = savedData ? JSON.parse(savedData) : {};
    
    userData.selectedTimelineOption = selectedOption;
    userData.projectStartDate = customDate ? customDate.format('YYYY-MM-DD') : null;
    
    localStorage.setItem('tradewizard_user_data', JSON.stringify(userData));
    
    // Continue to the next step
    onContinue();
  };

  const handleNext = () => {
    handleContinue();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const calculateTotalDuration = (option: TimelineOption): string => {
    // Get the timeframe directly from the option
    return option.timeframe;
  };

  const renderTimeline = () => {
    const selectedTimelineOption = timelineOptions.find(option => option.id === selectedOption);
    
    if (!selectedTimelineOption) {
      return (
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" color="error">
            No timeline option selected. Please select a timeline option.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="h6" gutterBottom>
          {selectedTimelineOption.title} Timeline
        </Typography>
        <Typography variant="body2" paragraph>
          Total estimated duration: {calculateTotalDuration(selectedTimelineOption)}
        </Typography>
        
        <Stepper orientation="vertical" sx={{ mt: 2 }}>
          {selectedTimelineOption.milestones.map((milestone, index) => (
            <Step key={index} active={true}>
              <StepLabel>
                <Typography variant="subtitle1">{milestone.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {milestone.duration}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  };

  const renderTimelineSelector = () => {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Choose Your Export Timeline
        </Typography>
        <Typography variant="body2" paragraph>
          Select the timeline that best fits your business needs and resource availability.
        </Typography>
        
        <RadioGroup
          aria-labelledby="timeline-options-label"
          name="timeline-options"
          value={selectedOption}
          onChange={handleOptionChange}
        >
          {timelineOptions.map((option) => (
            <Paper
              key={option.id}
              elevation={2}
              sx={{
                mb: 2,
                p: 2,
                border: option.id === selectedOption ? '2px solid #1976d2' : 'none',
                backgroundColor: option.id === selectedOption ? 'rgba(25, 118, 210, 0.05)' : 'white'
              }}
            >
              <FormControlLabel
                value={option.id}
                control={<Radio />}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="subtitle1">{option.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      Timeline: {option.timeframe}
                    </Typography>
                  </Box>
                }
                sx={{ width: '100%', m: 0, alignItems: 'flex-start' }}
              />
            </Paper>
          ))}
        </RadioGroup>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Schedule Your Start Date
          </Typography>
          <Typography variant="body2" paragraph>
            When do you plan to begin your export project?
          </Typography>
          
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Project Start Date"
              value={customDate}
              onChange={handleCustomDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth />
                      </InputAdornment>
                    )
                  }
                }
              }}
            />
          </LocalizationProvider>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Selecting your start date helps us create a realistic timeline for your export journey.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderTimelineDetails = () => {
    const selectedTimelineOption = timelineOptions.find(option => option.id === selectedOption);
    
    if (!selectedTimelineOption) {
      return null;
    }
    
    // Calculate projected completion date based on timeline and start date
    const getCompletionDate = () => {
      if (!customDate) return 'Unknown';
      
      // Extract the upper bound of the timeframe (e.g., "6-8 months" -> 8)
      const timeframeParts = selectedTimelineOption.timeframe.split('-');
      let months = 6; // Default
      
      if (timeframeParts.length > 1) {
        const upperBound = timeframeParts[1].trim();
        months = parseInt(upperBound.split(' ')[0], 10);
      } else {
        // If no range, just try to parse the number
        const parts = selectedTimelineOption.timeframe.split(' ');
        if (parts.length > 0) {
          const num = parseInt(parts[0], 10);
          if (!isNaN(num)) {
            months = num;
          }
        }
      }
      
      return customDate.clone().add(months, 'months').format('MMMM YYYY');
    };
    
    return (
      <Box sx={{ mt: 4 }}>
        <Divider sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          Timeline Summary
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Selected Approach:
            </Typography>
            <Typography variant="subtitle1">
              {selectedTimelineOption.title}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Project Start:
            </Typography>
            <Typography variant="subtitle1">
              {customDate ? customDate.format('MMMM DD, YYYY') : 'Not set'}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Estimated Duration:
            </Typography>
            <Typography variant="subtitle1">
              {selectedTimelineOption.timeframe}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Projected Completion:
            </Typography>
            <Typography variant="subtitle1">
              {getCompletionDate()}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Next Steps:
            </Typography>
            <Typography variant="subtitle1">
              {selectedTimelineOption.milestones[0].label} ({selectedTimelineOption.milestones[0].duration})
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Export Timeline Planning
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {renderTimelineSelector()}
        {renderTimeline()}
        {renderTimelineDetails()}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        {onBack && (
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={handleBack}
          >
            Back
          </Button>
        )}
        <Button
          variant="contained"
          endIcon={<NavigateNext />}
          onClick={handleNext}
          sx={{ ml: 'auto' }}
        >
          Continue to Regulatory Assessment
        </Button>
      </Box>
    </Box>
  );
};

export default ExportTimeline; 