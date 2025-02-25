// Web Worker for handling heavy processing tasks
self.onmessage = function(e) {
    const { type, payload } = e.data;
    
    switch (type) {
        case 'PROCESS_HISTORY':
            processHistory(payload);
            break;
        case 'VALIDATE_STATE':
            validateState(payload);
            break;
        default:
            console.warn('Unknown message type:', type);
    }
};

function processHistory(messages) {
    try {
        // Process and analyze message history
        const processedHistory = messages.map(msg => ({
            ...msg,
            processed: true,
            analyzed: analyzeMessage(msg)
        }));
        
        self.postMessage({
            type: 'STATE_UPDATE',
            payload: { processedHistory }
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'Failed to process message history' }
        });
    }
}

function validateState(state) {
    try {
        // Validate state consistency
        const validationResult = {
            isValid: true,
            issues: []
        };
        
        // Check step sequence
        if (state.currentStep) {
            const stepSequence = [
                'STEP_1_INTRODUCTION',
                'STEP_2_WEBSITE',
                'STEP_3_EXPORT_MOTIVATION',
                'STEP_4_BUSINESS_VERIFICATION'
            ];
            
            const currentStepIndex = stepSequence.indexOf(state.currentStep);
            const completedSteps = state.completedSteps || [];
            
            // Verify all previous steps are completed
            for (let i = 0; i < currentStepIndex; i++) {
                if (!completedSteps.includes(stepSequence[i])) {
                    validationResult.isValid = false;
                    validationResult.issues.push(`Step ${stepSequence[i]} not completed`);
                }
            }
        }
        
        // Check extracted information consistency
        if (state.extractedInfo) {
            const requiredFields = {
                'STEP_1_INTRODUCTION': ['first_name', 'role', 'business_name'],
                'STEP_2_WEBSITE': ['website_url'],
                'STEP_3_EXPORT_MOTIVATION': ['export_motivation']
            };
            
            const currentStepFields = requiredFields[state.currentStep] || [];
            for (const field of currentStepFields) {
                if (!state.extractedInfo[field]) {
                    validationResult.isValid = false;
                    validationResult.issues.push(`Missing required field: ${field}`);
                }
            }
        }
        
        self.postMessage({
            type: 'STATE_UPDATE',
            payload: { validation: validationResult }
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: 'State validation failed' }
        });
    }
}

function analyzeMessage(message) {
    // Analyze message content for patterns, keywords, etc.
    const analysis = {
        timestamp: Date.now(),
        hasQuestion: message.content.includes('?'),
        keywords: extractKeywords(message.content),
        sentiment: analyzeSentiment(message.content)
    };
    
    return analysis;
}

function extractKeywords(text) {
    // Simple keyword extraction (can be enhanced with NLP libraries)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return text
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 2 && !commonWords.has(word));
}

function analyzeSentiment(text) {
    // Simple sentiment analysis (can be enhanced with ML models)
    const positiveWords = new Set(['good', 'great', 'excellent', 'amazing', 'wonderful', 'yes', 'sure', 'thanks']);
    const negativeWords = new Set(['bad', 'poor', 'terrible', 'no', 'not', 'never', 'wrong']);
    
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    
    words.forEach(word => {
        if (positiveWords.has(word)) score++;
        if (negativeWords.has(word)) score--;
    });
    
    return {
        score,
        label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    };
} 