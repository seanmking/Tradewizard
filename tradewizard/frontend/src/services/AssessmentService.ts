import { create, StateCreator, StoreApi } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { debounce } from 'lodash';

interface AssessmentState {
    currentStep: string | null;
    extractedInfo: Record<string, any>;
    isLoading: boolean;
    error: string | null;
    pendingMessages: Array<{
        chatId: string;
        message: string;
        timestamp: number;
    }>;
    messageHistory: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: number;
        metadata?: Record<string, any>;
    }>;
}

interface AssessmentStore extends AssessmentState {
    setCurrentStep: (step: string) => void;
    updateExtractedInfo: (info: Record<string, any>) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    addPendingMessage: (chatId: string, message: string) => void;
    removePendingMessage: (timestamp: number) => void;
    addMessageToHistory: (role: 'user' | 'assistant', content: string, metadata?: Record<string, any>) => void;
    clearState: () => void;
}

type StorageState = Pick<AssessmentState, 'extractedInfo' | 'pendingMessages' | 'messageHistory'>;

type AssessmentPersist = (
    config: StateCreator<AssessmentStore>,
    options: PersistOptions<AssessmentStore, StorageState>
) => StateCreator<AssessmentStore>;

// Create persistent store with Zustand
const useAssessmentStore = create<AssessmentStore>()(
    (persist as AssessmentPersist)(
        (set: StoreApi<AssessmentStore>['setState'], get: StoreApi<AssessmentStore>['getState']) => ({
            currentStep: null,
            extractedInfo: {},
            isLoading: false,
            error: null,
            pendingMessages: [],
            messageHistory: [],

            setCurrentStep: (step: string) => set((state) => ({ ...state, currentStep: step })),
            updateExtractedInfo: (info: Record<string, any>) => set((state) => ({
                ...state,
                extractedInfo: { ...state.extractedInfo, ...info }
            })),
            setLoading: (loading: boolean) => set((state) => ({ ...state, isLoading: loading })),
            setError: (error: string | null) => set((state) => ({ ...state, error })),
            addPendingMessage: (chatId: string, message: string) => set((state) => ({
                ...state,
                pendingMessages: [...state.pendingMessages, {
                    chatId,
                    message,
                    timestamp: Date.now()
                }]
            })),
            removePendingMessage: (timestamp: number) => set((state) => ({
                ...state,
                pendingMessages: state.pendingMessages.filter(
                    (msg: { timestamp: number }) => msg.timestamp !== timestamp
                )
            })),
            addMessageToHistory: (role: 'user' | 'assistant', content: string, metadata?: Record<string, any>) => set((state) => ({
                ...state,
                messageHistory: [
                    ...state.messageHistory,
                    { role, content, timestamp: Date.now(), metadata }
                ].slice(-50) // Keep last 50 messages only
            })),
            clearState: () => set((state) => ({
                ...state,
                currentStep: null,
                extractedInfo: {},
                isLoading: false,
                error: null,
                pendingMessages: [],
                messageHistory: []
            }))
        }),
        {
            name: 'assessment-store',
            partialize: (state: AssessmentStore): StorageState => ({
                extractedInfo: state.extractedInfo,
                pendingMessages: state.pendingMessages,
                messageHistory: state.messageHistory
            })
        }
    )
);

interface APIResponse {
    currentStep: string;
    extractedInfo: Record<string, any>;
    response: string;
}

class AssessmentService {
    private static instance: AssessmentService;
    private worker: Worker | null = null;
    private retryTimeouts: { [key: number]: number } = {};
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000;

    private constructor() {
        // Initialize Web Worker for heavy processing
        if (window.Worker) {
            this.worker = new Worker('/assessment-worker.js');
            this.worker.onmessage = this.handleWorkerMessage;
        }

        // Start processing pending messages
        this.processPendingMessages();
    }

    static getInstance(): AssessmentService {
        if (!AssessmentService.instance) {
            AssessmentService.instance = new AssessmentService();
        }
        return AssessmentService.instance;
    }

    private handleWorkerMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        switch (type) {
            case 'STATE_UPDATE':
                this.updateState(payload);
                break;
            case 'ERROR':
                useAssessmentStore.getState().setError(payload.message);
                break;
        }
    };

    private updateState = debounce((newState: Partial<AssessmentState>) => {
        const store = useAssessmentStore.getState();
        if (newState.currentStep) store.setCurrentStep(newState.currentStep);
        if (newState.extractedInfo) store.updateExtractedInfo(newState.extractedInfo);
        if (newState.error !== undefined) store.setError(newState.error);
    }, 100);

    private async processPendingMessages() {
        setInterval(async () => {
            const { pendingMessages } = useAssessmentStore.getState();
            for (const msg of pendingMessages) {
                try {
                    await this.sendMessage(msg.chatId, msg.message);
                    useAssessmentStore.getState().removePendingMessage(msg.timestamp);
                } catch (error) {
                    console.error('Failed to process pending message:', error);
                }
            }
        }, 30000); // Check every 30 seconds
    }

    public async sendMessage(chatId: string, message: string): Promise<void> {
        const store = useAssessmentStore.getState();
        store.setLoading(true);

        try {
            // Add message to history immediately for optimistic UI update
            store.addMessageToHistory('user', message, {
                step: store.currentStep,
                timestamp: Date.now()
            });

            const response = await this.sendMessageWithRetry(chatId, message);
            
            // Update state with backend response
            this.updateState({
                currentStep: response.currentStep,
                extractedInfo: response.extractedInfo
            });

            // Add assistant's response to history
            store.addMessageToHistory('assistant', response.response, {
                step: response.currentStep,
                timestamp: Date.now()
            });

        } catch (error) {
            store.setError('Failed to send message. Will retry automatically.');
            store.addPendingMessage(chatId, message);
        } finally {
            store.setLoading(false);
        }
    }

    private async sendMessageWithRetry(
        chatId: string,
        message: string,
        retryCount = 0
    ): Promise<APIResponse> {
        try {
            const response = await fetch('/api/assessment/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chatId, message })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                // Exponential backoff
                const delay = this.RETRY_DELAY * Math.pow(2, retryCount);
                await new Promise(resolve => {
                    this.retryTimeouts[Date.now()] = window.setTimeout(resolve, delay);
                });
                return this.sendMessageWithRetry(chatId, message, retryCount + 1);
            }
            throw error;
        }
    }

    public cancelRetries() {
        Object.values(this.retryTimeouts).forEach(clearTimeout);
        this.retryTimeouts = {};
    }

    public async syncState(): Promise<void> {
        try {
            const response = await fetch('/api/assessment/state');
            if (!response.ok) throw new Error('Failed to sync state');
            
            const serverState = await response.json();
            this.updateState(serverState);
        } catch (error) {
            console.error('State sync failed:', error);
            // Continue with local state if sync fails
        }
    }

    public cleanup() {
        this.cancelRetries();
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        useAssessmentStore.getState().clearState();
    }
}

export const assessmentService = AssessmentService.getInstance();
export { useAssessmentStore }; 