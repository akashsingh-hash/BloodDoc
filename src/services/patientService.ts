
import axios from 'axios';
import { Hospital, SOSRequest, ReportAnalysis } from '../types';

// Your backend (still used for hospitals + SOS requests)
const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('blooddoc_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const patientService = {
  async searchHospitals(bloodType?: string, location?: { lat: number; lng: number }, city?: string): Promise<Hospital[]> {
    try {
      const params = new URLSearchParams();
      if (bloodType) params.append('bloodType', bloodType);
      if (location) {
        params.append('lat', location.lat.toString());
        params.append('lng', location.lng.toString());
      }
      if (city) params.append('city', city); // Add city to params

      const response = await axios.get(`${API_URL}/hospitals/search?${params}`, {
        headers: getAuthHeaders()
      });

      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      throw error;
    }
  },

  async createSOSRequest(
    sosData: Omit<SOSRequest, 'id' | 'createdAt' | 'status' | 'hospitalResponses'>
  ): Promise<SOSRequest> {
    const response = await axios.post(`${API_URL}/sos/create`, sosData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async analyzeReport(reportText: string): Promise<ReportAnalysis> {
    try {
      const response = await axios.post(`${API_URL}/ai/analyze-report`, {
        reportText
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error("Error analyzing report with backend:", error);
      throw error;
    }
  },

  async chatWithBot(message: string): Promise<string> {
    const response = await axios.post(`${API_URL}/ai/chat`, {
      message
    }, {
      headers: getAuthHeaders()
    });
    return response.data.response;
  },

  async sendBloodRequestSMS(targetHospitalPhone: string, patientBloodType: string, patientName: string, message: string): Promise<void> {
    try {
      console.log('patientService: Sending SMS request to backend:', {
        targetHospitalPhone,
        patientBloodType,
        patientName,
        message
      });
      await axios.post(`${API_URL}/sms/send-blood-request`, {
        targetHospitalPhone,
        patientBloodType,
        patientName,
        message
      }, {
        headers: getAuthHeaders()
      });
      console.log('patientService: SMS request successfully sent to backend.');
    } catch (error: any) {
      console.error("Error sending blood request SMS from patientService:", error);
      throw error;
    }
  },

  async getPatientSOSRequests(patientId: string): Promise<SOSRequest[]> {
    const response = await axios.get(`${API_URL}/sos/patient/${patientId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};
