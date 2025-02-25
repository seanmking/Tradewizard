import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  InputLabel,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';

interface BusinessVerificationFormProps {
  onValidationComplete: (data: any) => void;
  initialData: {
    business_name?: string;
    business_entity_type?: string;
    website_url?: string;
    export_goals?: string;
    website_extract?: {
      year_founded?: string;
      location?: string;
      contact_email?: string;
      contact_phone?: string;
      subsector?: string;
      main_products?: string[];
    };
    llm_extract?: {
      target_markets?: string[];
      enhanced_vision?: string;
    };
  };
}

// Validation patterns
const VALIDATION_PATTERNS = {
  REGISTRATION: /^\d{4}\/\d{6}\/\d{2}$/,
  TAX_NUMBER: /^\d{10}$/
};

export const BusinessVerificationForm: React.FC<BusinessVerificationFormProps> = ({
  onValidationComplete,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    legal_business_name: initialData.business_name || '',
    entity_type: initialData.business_entity_type || '',
    registration_number: '',
    tax_number: '',
    year_established: initialData.website_extract?.year_founded || '',
    physical_address: initialData.website_extract?.location || '',
    business_email: initialData.website_extract?.contact_email || '',
    business_phone: initialData.website_extract?.contact_phone || '',
    industry_subsector: initialData.website_extract?.subsector || '',
    target_markets: initialData.llm_extract?.target_markets || [],
    export_products: initialData.website_extract?.main_products || [],
    export_vision: initialData.llm_extract?.enhanced_vision || ''
  });

  const [validation, setValidation] = useState({
    registration: { isValid: false, message: '' },
    tax: { isValid: false, message: '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate registration number and tax number as they're entered
    if (name === 'registration_number' && VALIDATION_PATTERNS.REGISTRATION.test(value)) {
      // TODO: Implement actual validation API call
      setValidation(prev => ({
        ...prev,
        registration: { isValid: true, message: 'Valid registration number' }
      }));
    }

    if (name === 'tax_number' && VALIDATION_PATTERNS.TAX_NUMBER.test(value)) {
      // TODO: Implement actual validation API call
      setValidation(prev => ({
        ...prev,
        tax: { isValid: true, message: 'Valid tax number' }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement final validation checks
      onValidationComplete(formData);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Business Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Please verify your business details to proceed with the export readiness assessment.
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Business Identity */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Business Identity
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Legal Business Name"
              name="legal_business_name"
              value={formData.legal_business_name}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Business Entity Type</InputLabel>
              <Select
                name="entity_type"
                value={formData.entity_type}
                onChange={handleInputChange as any}
              >
                <MenuItem value="PTY_LTD">Proprietary Limited (Pty Ltd)</MenuItem>
                <MenuItem value="CC">Close Corporation (CC)</MenuItem>
                <MenuItem value="SOLE_PROP">Sole Proprietor</MenuItem>
                <MenuItem value="PARTNERSHIP">Partnership</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Registration Number"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleInputChange}
              required
              helperText={validation.registration.message}
              error={!validation.registration.isValid && formData.registration_number !== ''}
              placeholder="YYYY/XXXXXX/XX"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tax/VAT Number"
              name="tax_number"
              value={formData.tax_number}
              onChange={handleInputChange}
              required
              helperText={validation.tax.message}
              error={!validation.tax.isValid && formData.tax_number !== ''}
              placeholder="10 digit number"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Year Established"
              name="year_established"
              type="number"
              value={formData.year_established}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Physical Address"
              name="physical_address"
              value={formData.physical_address}
              onChange={handleInputChange}
              required
              multiline
              rows={2}
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 2 }}>
              Contact Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Business Email"
              name="business_email"
              type="email"
              value={formData.business_email}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Business Phone"
              name="business_phone"
              value={formData.business_phone}
              onChange={handleInputChange}
              required
            />
          </Grid>

          {/* Export Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 2 }}>
              Export Information
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Export Vision"
              name="export_vision"
              value={formData.export_vision}
              onChange={handleInputChange}
              required
              multiline
              rows={4}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || !validation.registration.isValid || !validation.tax.isValid}
                sx={{ minWidth: 200 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Validate & Continue'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}; 