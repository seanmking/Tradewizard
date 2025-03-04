import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip, 
  FormControlLabel, 
  Grid, 
  Paper, 
  Radio, 
  RadioGroup, 
  Step, 
  StepLabel, 
  Stepper, 
  TextField, 
  Typography 
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Anchor as ShippingIcon,
  LocalShipping as LogisticsIcon,
  Gavel as RegulatoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

interface TimelineOption {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  milestones: {
    label: string;
    duration: string;
  }[];
  image?: string;
}

interface ExportTimelineProps {
  onContinue: () => void;
}

const ExportTimeline: React.FC<ExportTimelineProps> = ({ onContinue }) => {
  const [selectedOption, setSelectedOption] = useState<string>('standard');
  const [activeStep, setActiveStep] = useState(0);
  const [customDate, setCustomDate] = useState<moment.Moment | null>(moment().add(6, 'months'));
  
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };
  
  const handleCustomDateChange = (date: moment.Moment | null) => {
    setCustomDate(date);
  };
  
  const handleContinue = () => {
    onContinue();
  };
  
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const timelineOptions: TimelineOption[] = [
    {
      id: 'standard',
      title: 'Standard Timeline',
      description: 'A balanced approach suitable for most exporters. Takes approximately 6 months to first shipment.',
      timeframe: '6 months',
      milestones: [
        { label: 'Market Research & Validation', duration: '4-6 weeks' },
        { label: 'Regulatory Compliance', duration: '8-10 weeks' },
        { label: 'Logistics & Distribution Setup', duration: '4-6 weeks' },
        { label: 'First Shipment', duration: '2 weeks' }
      ],
      image: '/images/timeline-standard.jpg'
    },
    {
      id: 'accelerated',
      title: 'Accelerated Timeline',
      description: 'Fast-track approach for experienced exporters or urgent market entry. First shipment in 3-4 months.',
      timeframe: '3-4 months',
      milestones: [
        { label: 'Expedited Market Validation', duration: '2-3 weeks' },
        { label: 'Fast-track Compliance', duration: '4-6 weeks' },
        { label: 'Rapid Logistics Setup', duration: '2-3 weeks' },
        { label: 'First Shipment', duration: '1-2 weeks' }
      ],
      image: '/images/timeline-accelerated.jpg'
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Timeline',
      description: 'Thorough approach for complex markets or sensitive products. Takes 8-12 months but reduces risks.',
      timeframe: '8-12 months',
      milestones: [
        { label: 'Extensive Market Research', duration: '8-12 weeks' },
        { label: 'Complete Regulatory Compliance', duration: '12-16 weeks' },
        { label: 'Strategic Partnership Development', duration: '6-8 weeks' },
        { label: 'Distribution Network Setup', duration: '4-6 weeks' },
        { label: 'First Shipment', duration: '2-3 weeks' }
      ],
      image: '/images/timeline-comprehensive.jpg'
    }
  ];
  
  const selectedTimelineOption = timelineOptions.find(option => option.id === selectedOption) || timelineOptions[0];
  
  const renderTimeline = () => {
    return (
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={-1} orientation="vertical">
          {selectedTimelineOption.milestones.map((milestone, index) => (
            <Step key={index} completed={false}>
              <StepLabel>
                <Typography variant="subtitle1">{milestone.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {milestone.duration}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  };
  
  const renderTimelineSelector = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Select Export Timeline
        </Typography>
        
        <RadioGroup value={selectedOption} onChange={handleOptionChange}>
          <Grid container spacing={3}>
            {timelineOptions.map((option) => (
              <Grid item xs={12} md={4} key={option.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    borderColor: selectedOption === option.id ? 'primary.main' : 'divider',
                    borderWidth: selectedOption === option.id ? 2 : 1
                  }}
                >
                  <CardMedia
                    sx={{ height: 140 }}
                    image={option.image || '/images/timeline-default.jpg'}
                    title={option.title}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FormControlLabel
                        value={option.id}
                        control={<Radio />}
                        label={<Typography variant="subtitle1">{option.title}</Typography>}
                        sx={{ mr: 0 }}
                      />
                      <Chip 
                        label={option.timeframe} 
                        size="small" 
                        color={
                          option.id === 'accelerated' ? 'warning' : 
                          option.id === 'comprehensive' ? 'info' : 
                          'success'
                        }
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </RadioGroup>
        
        <Box sx={{ mt: 4 }}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Set Custom Target Date (Optional)
            </Typography>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                label="Custom Target Date"
                value={customDate}
                onChange={handleCustomDateChange}
                minDate={moment().add(1, 'month')}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Paper>
        </Box>
      </Box>
    );
  };
  
  const renderTimelineDetails = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Timeline Milestones
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            {renderTimeline()}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Timeline Summary
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarIcon color="primary" sx={{ mr: 1 }} />
                <Typography>
                  Target completion: {customDate ? customDate.format('MMMM D, YYYY') : 'Not set'}
                </Typography>
              </Box>
              
              <Typography variant="body2" paragraph>
                This {selectedTimelineOption.title.toLowerCase()} is designed to help you enter your target markets with {selectedTimelineOption.id === 'accelerated' ? 'speed' : selectedTimelineOption.id === 'comprehensive' ? 'thorough preparation' : 'balanced approach'}.
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Key Benefits
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                {selectedTimelineOption.id === 'standard' && (
                  <>
                    <Typography component="li" variant="body2">Balanced approach between speed and thoroughness</Typography>
                    <Typography component="li" variant="body2">Suitable for most products and markets</Typography>
                    <Typography component="li" variant="body2">Reasonable resource allocation</Typography>
                  </>
                )}
                
                {selectedTimelineOption.id === 'accelerated' && (
                  <>
                    <Typography component="li" variant="body2">Rapid market entry</Typography>
                    <Typography component="li" variant="body2">Resource-efficient approach</Typography>
                    <Typography component="li" variant="body2">Competitive advantage through speed</Typography>
                  </>
                )}
                
                {selectedTimelineOption.id === 'comprehensive' && (
                  <>
                    <Typography component="li" variant="body2">Thorough risk mitigation</Typography>
                    <Typography component="li" variant="body2">Detailed market understanding</Typography>
                    <Typography component="li" variant="body2">Strong foundation for long-term success</Typography>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  const steps = [
    {
      label: 'Select Timeline',
      content: renderTimelineSelector()
    },
    {
      label: 'Review Timeline',
      content: renderTimelineDetails()
    }
  ];
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Export Timeline
      </Typography>
      
      <Typography variant="body1" paragraph>
        Selecting the right timeline for your export journey is crucial. 
        Each option balances speed, thoroughness, and resource allocation differently.
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      <Box sx={{ mt: 4, mb: 4 }}>
        {steps[activeStep].content}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined"
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ minWidth: '80px' }}
        >
          Back
        </Button>
        
        <Box>
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleContinue}
            >
              Continue
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ExportTimeline; 