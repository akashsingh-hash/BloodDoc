import axios from 'axios';
import { Hospital, BloodInventory, BedInfo, StaffMember, SOSRequest, BloodRequest } from '../types';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('blooddoc_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const hospitalService = {
  async getHospitalData(userId: string): Promise<Hospital> {
    console.log(`hospitalService: Fetching hospital data for userId: ${userId}`);
    const response = await axios.get(`${API_URL}/hospitals/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async updateBloodInventory(hospitalId: string, bloodData: Partial<BloodInventory>): Promise<BloodInventory> {
    const response = await axios.put(`${API_URL}/hospitals/${hospitalId}/blood`, bloodData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async addOrUpdateBloodInventory(hospitalId: string, bloodData: { bloodType: string; units: number; expiryDate?: string }): Promise<BloodInventory[]> {
    console.log(`hospitalService: Adding/updating blood inventory for hospitalId: ${hospitalId}`);
    const response = await axios.post(`${API_URL}/hospitals/${hospitalId}/blood-inventory`, bloodData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async updateSpecificBloodInventory(hospitalId: string, bloodInventoryId: string, bloodData: { units?: number; expiryDate?: string }): Promise<BloodInventory[]> {
    console.log(`hospitalService: Updating specific blood inventory for hospitalId: ${hospitalId}, bloodInventoryId: ${bloodInventoryId}`);
    const response = await axios.put(`${API_URL}/hospitals/${hospitalId}/blood-inventory/${bloodInventoryId}`, bloodData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async deleteBloodInventory(hospitalId: string, bloodInventoryId: string): Promise<void> {
    console.log(`hospitalService: Deleting blood inventory for hospitalId: ${hospitalId}, bloodInventoryId: ${bloodInventoryId}`);
    await axios.delete(`${API_URL}/hospitals/${hospitalId}/blood-inventory/${bloodInventoryId}`, {
      headers: getAuthHeaders()
    });
  },

  async getAllHospitals(): Promise<Hospital[]> {
    const response = await axios.get(`${API_URL}/hospitals`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async createBloodRequest(targetHospitalId: string, bloodType: string, unitsRequested: number): Promise<BloodRequest> {
    const response = await axios.post(`${API_URL}/blood-requests/create`, {
      targetHospitalId,
      bloodType,
      unitsRequested
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getOutgoingBloodRequests(hospitalId: string): Promise<BloodRequest[]> {
    console.log(`hospitalService: Fetching outgoing blood requests for hospitalId: ${hospitalId}`);
    const response = await axios.get(`${API_URL}/blood-requests/outgoing/${hospitalId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getIncomingBloodRequests(hospitalId: string): Promise<BloodRequest[]> {
    console.log(`hospitalService: Fetching incoming blood requests for hospitalId: ${hospitalId}`);
    const response = await axios.get(`${API_URL}/blood-requests/incoming/${hospitalId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async respondToBloodRequest(requestId: string, status: 'approved' | 'denied', message?: string): Promise<BloodRequest> {
    console.log(`hospitalService: Responding to blood request ID: ${requestId} with status: ${status}`);
    const response = await axios.put(`${API_URL}/blood-requests/${requestId}/respond`, {
      status,
      responseMessage: message
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async updateBedInfo(hospitalId: string, bedData: Partial<BedInfo>): Promise<BedInfo> {
    const response = await axios.put(`${API_URL}/hospitals/${hospitalId}/beds`, bedData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async addStaffMember(hospitalId: string, staffData: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    const response = await axios.post(`${API_URL}/hospitals/${hospitalId}/staff`, staffData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async createSOSRequest(bloodType: string, urgency: string, message: string, lat: number, lng: number): Promise<SOSRequest> {
    console.log(`hospitalService: Creating SOS request: bloodType=${bloodType}, urgency=${urgency}, lat=${lat}, lng=${lng}`);
    const response = await axios.post(`${API_URL}/sos/create`, {
      bloodType,
      urgency,
      message,
      lat,
      lng
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async getSOSRequests(hospitalId: string): Promise<SOSRequest[]> {
    console.log(`hospitalService: Fetching SOS requests for hospitalId: ${hospitalId}`);
    const response = await axios.get(`${API_URL}/sos/hospital/${hospitalId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async respondToSOS(sosId: string, status: 'accepted' | 'denied', message?: string): Promise<SOSRequest> {
    console.log(`hospitalService: Responding to SOS request ID: ${sosId} with status: ${status}`);
    const response = await axios.put(`${API_URL}/sos/${sosId}/respond`, {
      status,
      responseMessage: message
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};