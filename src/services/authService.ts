import axios from 'axios';
import { User } from '../types';

const API_URL = 'http://localhost:3001/api';

interface LoginResponse {
  user: User;
  token: string;
}

export const authService = {
  async login(email: string, password: string, role: 'hospital' | 'patient'): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
      role
    });
    return response.data;
  },

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: 'hospital' | 'patient';
    [key: string]: any;
  }): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  }
};