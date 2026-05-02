import axios from 'axios'

const API_BASE_URL = 'http://localhost:4000/api/auth'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authService = {
  register: async (username, email, password) => {
    try {
      const response = await axiosInstance.post('/register', {
        username,
        email,
        password,
      })
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'An error occurred' }
    }
  },

  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/login', {
        email,
        password,
      })
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'An error occurred' }
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  getToken: () => {
    return localStorage.getItem('token')
  },
}
