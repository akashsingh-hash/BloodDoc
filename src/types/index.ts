export interface User {
  id: string;
  email: string;
  role: 'hospital' | 'patient';
  name: string;
  token?: string;
}

export interface Hospital {
  _id?: ObjectId; // MongoDB _id
  name: string;
  address: string;
  phone: string;
  email: string;
  location: { // GeoJSON Point structure
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  } | null;
  bloodInventory: BloodInventory[];
  beds: BedInfo[];
  staff: StaffMember[];
  createdAt?: string;
  updatedAt?: string;
  userId: string; // Link to the hospital user's ID
}

export interface BloodInventory {
  id: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  units: number;
  expiryDate: string;
  lastUpdated: string;
}

export interface BedInfo {
  id: string;
  ward: string;
  bedNumber: string;
  occupied: boolean;
  patientId?: string;
  admissionDate?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  shift: 'morning' | 'evening' | 'night';
  available: boolean;
}

export interface SOSRequest {
  _id?: ObjectId; // MongoDB _id
  patientId: string;
  // patientName: string; // Removed, can be looked up via patientId
  bloodType: string;
  urgency: 'critical' | 'urgent' | 'moderate';
  location: { // GeoJSON Point structure
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  message: string;
  status: 'active' | 'resolved'; // Overall SOS status
  createdAt: string;
  updatedAt: string;
  hospitalResponses: HospitalResponse[];
}

export interface HospitalResponse {
  hospitalId: string;
  status: 'pending' | 'accepted' | 'denied';
  responseMessage: string | null;
  respondedAt: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface ReportAnalysis {
  patientName: string;
  summary: string;
  importantTopics: string[];
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  bloodTestResults?: {
    bloodType?: string;
    hemoglobin?: number;
    whiteBloodCells?: number;
    platelets?: number;
  };
}