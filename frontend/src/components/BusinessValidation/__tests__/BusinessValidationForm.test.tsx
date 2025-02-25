import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BusinessValidationForm } from '../BusinessValidationForm';
import { AssessmentProvider } from '../../../contexts/AssessmentContext';
import { assessmentApi } from '../../../services/api';
import { vi } from 'vitest';
import '@testing-library/jest-dom';  // Add Jest DOM matchers

// Mock the API calls
vi.mock('../../../services/api', () => ({
  assessmentApi: {
    validateBusiness: vi.fn()
  }
}));

describe('BusinessValidationForm', () => {
  const mockOnValidationComplete = vi.fn();
  
  const renderForm = () => {
    return render(
      <AssessmentProvider>
        <BusinessValidationForm onValidationComplete={mockOnValidationComplete} />
      </AssessmentProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnValidationComplete.mockClear();
  });

  test('renders all validation fields', () => {
    renderForm();
    
    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Registration Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Tax Number')).toBeInTheDocument();
  });

  test('shows required field indicators', () => {
    renderForm();
    
    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators).toHaveLength(3); // All fields are required
  });

  test('displays help text for each field', () => {
    renderForm();
    
    expect(screen.getByText(/Must match your CIPC registration/i)).toBeInTheDocument();
    expect(screen.getByText(/Format: YYYY\/XXXXXX\/XX/i)).toBeInTheDocument();
    expect(screen.getByText(/10-digit SARS tax reference number/i)).toBeInTheDocument();
  });

  test('validates company name on input', async () => {
    const mockValidation = {
      is_valid: true,
      suggestions: ['Valid company name'],
      confidence: 0.95
    };
    
    vi.mocked(assessmentApi.validateBusiness).mockResolvedValueOnce(mockValidation);
    
    renderForm();
    const input = screen.getByLabelText('Company Name');
    
    await userEvent.type(input, 'Test Corp Ltd');
    
    await waitFor(() => {
      expect(screen.getByText('Valid company name')).toBeInTheDocument();
      expect(screen.getByText('Confidence: 95%')).toBeInTheDocument();
    });
  });

  test('handles validation errors gracefully', async () => {
    const mockError = {
      is_valid: false,
      suggestions: ['Company name too short'],
      confidence: 0.3
    };
    
    vi.mocked(assessmentApi.validateBusiness).mockResolvedValueOnce(mockError);
    
    renderForm();
    const input = screen.getByLabelText('Company Name');
    
    await userEvent.type(input, 'A');
    
    await waitFor(() => {
      expect(screen.getByText('Company name too short')).toBeInTheDocument();
      expect(screen.getByText('Confidence: 30%')).toBeInTheDocument();
    });
  });

  test('shows loading state during validation', async () => {
    vi.mocked(assessmentApi.validateBusiness).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 500))
    );
    
    renderForm();
    const input = screen.getByLabelText('Company Name');
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test Corp' } });
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 300));
    });
    
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner should be visible
    });
  });

  test('handles API errors gracefully', async () => {
    vi.mocked(assessmentApi.validateBusiness).mockRejectedValueOnce(new Error('API Error'));
    
    renderForm();
    const input = screen.getByLabelText('Company Name');
    
    await userEvent.type(input, 'Test Corp');
    
    await waitFor(() => {
      expect(screen.getByText('Validation service error. Please try again.')).toBeInTheDocument();
    });
  });

  test('validates registration number format', async () => {
    const mockValidation = {
      is_valid: true,
      suggestions: ['Valid registration number'],
      confidence: 0.9
    };
    
    vi.mocked(assessmentApi.validateBusiness).mockResolvedValueOnce(mockValidation);
    
    renderForm();
    const input = screen.getByLabelText('Registration Number');
    
    await userEvent.type(input, '2023/123456/07');
    
    await waitFor(() => {
      expect(screen.getByText('Valid registration number')).toBeInTheDocument();
      expect(screen.getByText('Confidence: 90%')).toBeInTheDocument();
    });
  });

  test('validates tax number format', async () => {
    const mockValidation = {
      is_valid: true,
      suggestions: ['Valid tax number'],
      confidence: 0.85
    };
    
    vi.mocked(assessmentApi.validateBusiness).mockResolvedValueOnce(mockValidation);
    
    renderForm();
    const input = screen.getByLabelText('Tax Number');
    
    await userEvent.type(input, '1234567890');
    
    await waitFor(() => {
      expect(screen.getByText('Valid tax number')).toBeInTheDocument();
      expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
    });
  });

  test('displays different confidence level colors', async () => {
    const mockValidations = [
      { is_valid: true, suggestions: ['High confidence'], confidence: 0.9 },
      { is_valid: true, suggestions: ['Medium confidence'], confidence: 0.6 },
      { is_valid: false, suggestions: ['Low confidence'], confidence: 0.3 }
    ];
    
    const validateBusinessMock = vi.mocked(assessmentApi.validateBusiness);
    mockValidations.forEach(validation => {
      validateBusinessMock.mockResolvedValueOnce(validation);
    });
    
    renderForm();
    const inputs = [
      screen.getByLabelText('Company Name'),
      screen.getByLabelText('Registration Number'),
      screen.getByLabelText('Tax Number')
    ];
    
    // Test each confidence level
    for (let i = 0; i < inputs.length; i++) {
      await userEvent.type(inputs[i], 'test');
      await waitFor(() => {
        const confidenceText = screen.getByText(`Confidence: ${mockValidations[i].confidence * 100}%`);
        const expectedClass = mockValidations[i].confidence >= 0.8 
          ? 'text-green-600' 
          : mockValidations[i].confidence >= 0.5 
            ? 'text-yellow-600' 
            : 'text-red-600';
        expect(confidenceText).toHaveClass(expectedClass);
      });
    }
  });

  test('debounces validation calls', async () => {
    renderForm();
    const input = screen.getByLabelText('Company Name');
    
    // Type quickly
    await userEvent.type(input, 'Test Corp Ltd', { delay: 50 });
    
    // Should only call validation once for the final value
    await waitFor(() => {
      expect(assessmentApi.validateBusiness).toHaveBeenCalledTimes(1);
      expect(assessmentApi.validateBusiness).toHaveBeenCalledWith(
        'company_name',
        'Test Corp Ltd'
      );
    });
  });

  test('enables submit button when all fields are valid', async () => {
    const mockValidation = {
      is_valid: true,
      suggestions: ['Valid input'],
      confidence: 0.9
    };
    
    vi.mocked(assessmentApi.validateBusiness).mockResolvedValue(mockValidation);
    
    renderForm();
    const submitButton = screen.getByText('Continue to Assessment');
    expect(submitButton).toBeDisabled();

    // Fill in all required fields
    await userEvent.type(screen.getByLabelText('Company Name'), 'Test Corp');
    await userEvent.type(screen.getByLabelText('Registration Number'), '2023/123456/07');
    await userEvent.type(screen.getByLabelText('Tax Number'), '1234567890');

    // Wait for all validations to complete
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Test form submission
    await userEvent.click(submitButton);
    expect(mockOnValidationComplete).toHaveBeenCalledTimes(1);
  });
}); 