const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class MessageTrackingService {
  private getAuthToken(): string | null {
    return sessionStorage.getItem('authToken');
  }

  async getUnreadCounts(): Promise<Record<string, number>> {
    const token = this.getAuthToken();
    if (!token) return {};

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return {};
      return await response.json();
    } catch {
      return {};
    }
  }

  async markAsRead(patientId: string): Promise<boolean> {
    const token = this.getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patient_id: patientId })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const messageTrackingService = new MessageTrackingService();

