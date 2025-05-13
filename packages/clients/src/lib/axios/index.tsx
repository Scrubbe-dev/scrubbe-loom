'use client'
import axios, { InternalAxiosRequestConfig } from 'axios';
import { getCookie } from 'cookies-next';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Your API base URL
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});


apiClient.interceptors.request.use((config:  InternalAxiosRequestConfig<any>) => {
  // const token = localStorage.getItem('jwtToken');
  const data = getCookie("user-auth")
  const token = JSON.parse(String(data))?.token

  console.log(token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// apiClient.interceptors.response.use(
//   (response: any) => response,
//   (error: { response: { status: number; }; }) => {
//     if (error.response?.status === 401) {
//       window.location.href = '/auth/login';
//     }
//     return Promise.reject(error);
//   }
// );

export default apiClient;