// src/api/auth.js
import axios from "axios";

// Replace with your API Gateway Invoke URL
const API_BASE_URL = "https://o8tdae1gpj.execute-api.eu-north-1.amazonaws.com";

// ----------------- SIGNUP -----------------
export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/signup`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Signup failed" };
  }
};

// ----------------- LOGIN -----------------
export const login = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

// ----------------- CONFIRM -----------------
export const confirm = async (email, code) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/confirm`, {
      email,
      code,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Confirmation failed" };
  }
};

// ----------------- RESEND -----------------
export const resend = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/resend`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Resend failed" };
  }
};
