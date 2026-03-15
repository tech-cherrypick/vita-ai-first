import { getSocket } from '../socket';

export interface GeminiProxyConfig {
    model: string;
    config?: any;
    systemInstruction?: any;
}

export interface LiveSessionCallbacks {
    onopen?: () => void;
    onmessage?: (msg: any) => void;
    onclose?: () => void;
    onerror?: (err: any) => void;
}

class LiveSessionProxy {
    private socket = getSocket();
    private callbacks: LiveSessionCallbacks;

    constructor(config: GeminiProxyConfig, callbacks: LiveSessionCallbacks) {
        this.callbacks = callbacks;
        this.setupListeners();
        this.socket.emit('geminiProxy_connect', config);
    }

    private setupListeners() {
        this.socket.on('geminiProxy_open', () => this.callbacks.onopen?.());
        this.socket.on('geminiProxy_message', (msg) => this.callbacks.onmessage?.(msg));
        this.socket.on('geminiProxy_close', () => this.callbacks.onclose?.());
        this.socket.on('geminiProxy_error', (err) => this.callbacks.onerror?.(err));
    }

    private removeListeners() {
        this.socket.off('geminiProxy_open');
        this.socket.off('geminiProxy_message');
        this.socket.off('geminiProxy_close');
        this.socket.off('geminiProxy_error');
    }

    sendRealtimeInput(input: any) {
        this.socket.emit('geminiProxy_input', input);
    }

    sendToolResponse(response: any) {
        this.socket.emit('geminiProxy_toolResponse', response);
    }

    close() {
        this.socket.emit('geminiProxy_end');
        this.removeListeners();
    }
}

class ChatSessionProxy {
    private history: any[] = [];
    private model: string;
    private config: any;

    constructor(model: string, config: any) {
        this.model = model;
        this.config = config;
    }

    async sendMessage(params: { message: any }): Promise<{ text: string; functionCalls?: any[] }> {
        const userContent = typeof params.message === 'string' 
            ? { role: 'user', parts: [{ text: params.message }] }
            : { role: 'user', parts: params.message };

        const payload = {
            model: this.model,
            contents: [...this.history, userContent],
            config: this.config?.generationConfig || this.config?.config || {},
            systemInstruction: this.config?.systemInstruction,
            tools: this.config?.tools
        };

        const response = await GeminiProxyService.generateContent(payload);
        
        // Update history correctly for subsequent calls
        this.history.push(userContent);
        
        // Note: The response from our backend generateContent endpoint currently 
        // returns { text: string }. We might need to update the backend to return functionCalls if needed.
        // For now, let's assume text contains everything or we handle tool calls via the same logic as before.
        
        const aiResponse = { role: 'model', parts: [{ text: response.text }] };
        this.history.push(aiResponse);

        return { 
            text: response.text,
            // Extract function calls if they exist in the response
            // Our current backend controller might need to be updated to expose these
            functionCalls: (response as any).functionCalls 
        };
    }
}

class GeminiProxyService {
    private static API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    static async generateContent(payload: {
        model?: string;
        contents: any[];
        config?: any;
        systemInstruction?: any;
    }): Promise<{ text: string }> {
        const response = await fetch(`${this.API_BASE_URL}/api/gemini/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Gemini Proxy Error');
        }

        return await response.json();
    }

    static connectLive(config: GeminiProxyConfig, callbacks: LiveSessionCallbacks): LiveSessionProxy {
        return new LiveSessionProxy(config, callbacks);
    }

    static createChat(model: string, config: any): ChatSessionProxy {
        return new ChatSessionProxy(model, config);
    }
}

export default GeminiProxyService;
