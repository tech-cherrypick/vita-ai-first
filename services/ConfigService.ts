interface AppConfig {
    skipRazorpayVerification: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
    skipRazorpayVerification: false
};

class ConfigService {
    private config: AppConfig = DEFAULT_CONFIG;
    private loaded = false;

    async fetch(): Promise<AppConfig> {
        if (this.loaded) return this.config;

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        try {
            const response = await fetch(`${API_BASE_URL}/api/config`);
            if (response.ok) {
                this.config = await response.json();
            }
        } catch (err) {
            console.error('Failed to fetch app config:', err);
        }

        this.loaded = true;
        return this.config;
    }

    get(): AppConfig {
        return this.config;
    }
}

export const configService = new ConfigService();

