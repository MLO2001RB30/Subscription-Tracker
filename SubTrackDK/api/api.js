import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://192.168.0.5:8080"; // Updated port to match backend server

export async function login(email, password) {
  const res = await axios.post(`${API_URL}/api/auth/login`, new URLSearchParams({
    username: email,
    password,
  }).toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const token = res.data.access_token;
  await SecureStore.setItemAsync("token", token);
  return token;
}

export async function signup(email, password) {
  const res = await axios.post(`${API_URL}/api/auth/signup`, {
    email,
    password
  });
  return res.data;
}

export async function createSubscription(subscription) {
  const token = await SecureStore.getItemAsync("token");
  console.log("Sending subscription to API:", subscription);
  console.log("Using token:", token);

  try {
    const res = await axios.post(`${API_URL}/api/subscriptions`, subscription, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error from backend:", err.response?.data || err.message);
    throw err;
  }
}

export async function getSubscriptions() {
  const token = await SecureStore.getItemAsync("token");
  const res = await axios.get(`${API_URL}/api/subscriptions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
} 