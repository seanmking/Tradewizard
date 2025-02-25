import React from 'react';
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
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';

interface BusinessVerificationFormProps {
  onValidationComplete: (data: BusinessVerificationData) => void;
  initialData?: InitialFormData;
}

interface InitialFormData {
  business_name?: string;
  business_entity_type?: string;
  role?: string;
  website_url?: string;
  export_motivation?: string;
  website_extract?: {
    year_founded?: string;
    location?: string;
    contact_email?: string;
    contact_phone?: string;
    subsector?: string;
    main_products?: string[];
    registration_number?: string;
    vat_number?: string;
  };
  llm_extract?: {
    target_markets?: string[];
    enhanced_vision?: string;
  };
  first_name?: string;
  last_name?: string;
}

interface BusinessVerificationData {
  legal_business_name: string;
  entity_type: string;
  registration_number: string;
  tax_number: string;
  year_established: string;
  physical_address: string;
  business_email: string;
  business_phone: string;
  industry_subsector: string;
  target_markets: string[];
  export_products: string[];
  export_vision: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  industry_sector: string;
}

// Validation patterns
const VALIDATION_PATTERNS = {
  REGISTRATION: /^\d{4}\/\d{6}\/\d{2}$/,
  TAX_NUMBER: /^\d{10}$/,
  PHONE: /^\+\d{2}\s?\(\d{1,3}\)\s?\d{3}\s?\d{4}$/  // Format: +27 (0)21 555 1234
};

// Add industry sector data structure
const INDUSTRY_SECTORS = {
  FOOD_PRODUCTS: {
    label: 'Food Products',
    subcategories: {
      PROCESSED_FOODS: 'Processed Foods',
      FRESH_PRODUCE: 'Fresh Produce'
    }
  },
  BEVERAGES: {
    label: 'Beverages',
    subcategories: {
      ALCOHOLIC: 'Alcoholic Beverages',
      NON_ALCOHOLIC: 'Non-alcoholic Beverages'
    }
  },
  READY_TO_WEAR: {
    label: 'Ready-to-Wear',
    subcategories: {
      APPAREL: 'Apparel',
      JEWELLERY: 'Jewellery'
    }
  },
  HOME_GOODS: {
    label: 'Home Goods',
    subcategories: {
      LEATHER_GOODS: 'Leather Goods',
      GIFTING: 'Gifting',
      DECOR: 'Decor'
    }
  },
  NON_PRESCRIPTION_HEALTH: {
    label: 'Non-Prescription Health',
    subcategories: {
      BEAUTY: 'Beauty Products',
      OTC_HEALTH: 'Over-the-counter Health',
      WELLNESS: 'Wellness Products',
      VITAMINS: 'Vitamin Products'
    }
  }
};

export const BusinessVerificationForm = ({
  onValidationComplete,
  initialData = {} as InitialFormData
}: BusinessVerificationFormProps) => {
  // Determine initial sector based on subsector if available
  const getInitialSector = () => {
    const subsector = initialData.website_extract?.subsector;
    if (!subsector) return '';
    
    for (const [sector, data] of Object.entries(INDUSTRY_SECTORS)) {
      if (Object.keys(data.subcategories).includes(subsector)) {
        return sector;
      }
    }
    return '';
  };

  const [formData, setFormData] = React.useState({
    legal_business_name: initialData.business_name || '',
    entity_type: initialData.business_entity_type === 'PTY_LTD' ? 'PTY_LTD' : '',
    registration_number: initialData.website_extract?.registration_number || '',
    tax_number: initialData.website_extract?.vat_number || '',
    year_established: initialData.website_extract?.year_founded?.toString() || '',
    physical_address: initialData.website_extract?.location || '',
    business_email: initialData.website_extract?.contact_email || '',
    business_phone: initialData.website_extract?.contact_phone || '',
    industry_subsector: initialData.website_extract?.subsector || '',
    target_markets: initialData.llm_extract?.target_markets || [],
    export_products: initialData.website_extract?.main_products || [],
    export_vision: initialData.llm_extract?.enhanced_vision || initialData.export_motivation || '',
    contact_person_name: initialData.first_name ? `${initialData.first_name} ${initialData.last_name || ''}`.trim() : '',
    contact_person_email: '',
    contact_person_phone: '',
    industry_sector: getInitialSector()
  });

  const [validation, setValidation] = React.useState({
    registration: { isValid: false, message: '' },
    tax: { isValid: false, message: '' },
    contact_email: { isValid: false, message: '' }
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    // Validate initial values
    if (formData.registration_number && VALIDATION_PATTERNS.REGISTRATION.test(formData.registration_number)) {
      setValidation(prev => ({
        ...prev,
        registration: { isValid: true, message: 'Valid registration number' }
      }));
    }
    if (formData.tax_number && VALIDATION_PATTERNS.TAX_NUMBER.test(formData.tax_number)) {
      setValidation(prev => ({
        ...prev,
        tax: { isValid: true, message: 'Valid tax number' }
      }));
    }
  }, []);

  const validateContactEmail = (email: string) => {
    if (!email) return { isValid: false, message: '' };
    
    const businessEmailDomain = formData.business_email.split('@')[1];
    const contactEmailDomain = email.split('@')[1];
    
    return {
      isValid: businessEmailDomain === contactEmailDomain,
      message: businessEmailDomain === contactEmailDomain ? 
        'Email domain matches business domain' : 
        'Email must use your business domain'
    };
  };

  const handleInputChange = (
    e: { target: { name: string; value: string } } | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    
    if (name === 'industry_sector') {
      // Reset subsector when sector changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        industry_subsector: ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Validate registration number and tax number as they're entered
    if (name === 'registration_number') {
      const isValid = VALIDATION_PATTERNS.REGISTRATION.test(value);
      setValidation(prev => ({
        ...prev,
        registration: { 
          isValid,
          message: isValid ? 'Valid registration number' : 'Format: YYYY/XXXXXX/XX'
        }
      }));
    }

    if (name === 'tax_number') {
      const isValid = VALIDATION_PATTERNS.TAX_NUMBER.test(value);
      setValidation(prev => ({
        ...prev,
        tax: { 
          isValid,
          message: isValid ? 'Valid tax number' : 'Must be 10 digits'
        }
      }));
    }

    // New validation for contact email
    if (name === 'contact_person_email') {
      setValidation(prev => ({
        ...prev,
        contact_email: validateContactEmail(value)
      }));
    }
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
              <InputLabel id="entity-type-label">Business Entity Type</InputLabel>
              <Select
                labelId="entity-type-label"
                name="entity_type"
                value={formData.entity_type}
                onChange={handleInputChange}
                label="Business Entity Type"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    }
                  }
                }}
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
              helperText={validation.registration.message || 'Format: YYYY/XXXXXX/XX'}
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
              helperText={validation.tax.message || 'Must be 10 digits'}
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

          {/* Personal Contact Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 2 }}>
              Personal Contact Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide your contact details for verification purposes.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Your Full Name"
              name="contact_person_name"
              value={formData.contact_person_name}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Your Email"
              name="contact_person_email"
              type="email"
              value={formData.contact_person_email}
              onChange={handleInputChange}
              required
              error={!validation.contact_email.isValid && formData.contact_person_email !== ''}
              helperText={validation.contact_email.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Your Mobile Number"
              name="contact_person_phone"
              value={formData.contact_person_phone}
              onChange={handleInputChange}
              required
              placeholder="+27 (0)XX XXX XXXX"
            />
          </Grid>

          {/* Export Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 2 }}>
              Export Information
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Industry Sector</InputLabel>
              <Select
                name="industry_sector"
                value={formData.industry_sector}
                onChange={handleInputChange}
                label="Industry Sector"
              >
                {Object.entries(INDUSTRY_SECTORS).map(([key, data]) => (
                  <MenuItem key={key} value={key}>
                    {data.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required disabled={!formData.industry_sector}>
              <InputLabel>Industry Subsector</InputLabel>
              <Select
                name="industry_subsector"
                value={formData.industry_subsector}
                onChange={handleInputChange}
                label="Industry Subsector"
              >
                {formData.industry_sector && 
                  Object.entries(INDUSTRY_SECTORS[formData.industry_sector as keyof typeof INDUSTRY_SECTORS].subcategories)
                    .map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))
                }
              </Select>
            </FormControl>
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
                disabled={
                  isSubmitting || 
                  (!validation.registration.isValid && formData.registration_number !== '') || 
                  (!validation.tax.isValid && formData.tax_number !== '') ||
                  (!validation.contact_email.isValid && formData.contact_person_email !== '')
                }
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