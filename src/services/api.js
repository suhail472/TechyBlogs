import { getCookie, setCookie, eraseCookie } from '@/lib/cookies';

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Helper function for API calls with token
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  let token = null;
  if (typeof window !== 'undefined') {
    token = getCookie('token');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }

  return data;
};

// Auth API calls
export const authAPI = {
  login: async (email, password, token) => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, token }),
    });
    if (response.data?.token && typeof window !== 'undefined') {
      setCookie('token', response.data.token, 7);
    }
    return response.data;
  },

  register: async (name, email, password) => {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return response.data;
  },

  getMe: async () => {
    const response = await apiCall('/auth/me', {
      method: 'GET',
    });
    return response.data;
  },

  logout: async () => {
    await apiCall('/auth/logout', {
      method: 'POST',
    });
    if (typeof window !== 'undefined') {
      eraseCookie('token');
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    const response = await apiCall('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  },

  resetPasswordByInfo: async (name, email, dob, newPassword) => {
    const response = await apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ name, email, dob, newPassword }),
    });
    return response;
  },
};

// Post API calls
export const postAPI = {
  getAllPosts: async (options = {}) => {
    const queryParams = new URLSearchParams();
    if (options.status) queryParams.append('status', options.status);
    if (options.category) queryParams.append('category', options.category);
    if (options.tag) queryParams.append('tag', options.tag);
    if (options.page) queryParams.append('page', options.page);
    if (options.limit) queryParams.append('limit', options.limit);
    if (options.sortBy) queryParams.append('sortBy', options.sortBy);
    if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);

    const endpoint = `/posts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiCall(endpoint, {
      method: 'GET',
    });
    return response;
  },

  getPostBySlug: async (slug) => {
    const response = await apiCall(`/posts/slug/${slug}`, {
      method: 'GET',
    });
    return response.data;
  },

  getPostById: async (id) => {
    const response = await apiCall(`/posts/${id}`, {
      method: 'GET',
    });
    return response.data;
  },

  createPost: async (postData) => {
    const response = await apiCall('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    return response.data;
  },

  updatePost: async (id, postData) => {
    const response = await apiCall(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
    return response.data;
  },

  deletePost: async (id) => {
    const response = await apiCall(`/posts/${id}`, {
      method: 'DELETE',
    });
    return response;
  },

  searchPosts: async (query) => {
    const response = await apiCall(`/posts/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
    return response;
  },

  getPostsByCategory: async (category) => {
    const response = await apiCall(`/posts/category/${category}`, {
      method: 'GET',
    });
    return response;
  },

  getPostsByTag: async (tag) => {
    const response = await apiCall(`/posts/tag/${tag}`, {
      method: 'GET',
    });
    return response;
  },

  incrementViews: async (slug) => {
    const response = await apiCall(`/posts/slug/${slug}/views`, {
      method: 'POST',
    });
    return response;
  },
};

export default { authAPI, postAPI };
