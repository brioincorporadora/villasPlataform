import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',  // URL do seu backend Django
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;