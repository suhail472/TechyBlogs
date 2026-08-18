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
    if (options.contentType) queryParams.append('contentType', options.contentType);

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

  getRevisions: async (id) => {
    return apiCall(`/posts/${id}/revisions`, { method: 'GET' });
  },

  restoreRevision: async (id, version) => {
    return apiCall(`/posts/${id}/revisions`, {
      method: 'POST',
      body: JSON.stringify({ version }),
    });
  },

  bulkAction: async (action, postIds, data = {}) => {
    return apiCall('/admin/posts/bulk', {
      method: 'POST',
      body: JSON.stringify({ action, postIds, data }),
    });
  },
};

// Admin Newsroom Command Center API
export const adminAPI = {
  getCommandCenterData: async () => {
    return apiCall('/admin/command-center', { method: 'GET' });
  },
};

// Taxonomy API
export const taxonomyAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/taxonomy${query ? '?' + query : ''}`;
    return apiCall(endpoint, { method: 'GET' });
  },
  getOverview: async () => {
    return apiCall('/taxonomy/overview', { method: 'GET' });
  },
  getHierarchy: async (kind = 'topic') => {
    return apiCall(`/taxonomy/hierarchy?kind=${encodeURIComponent(kind)}`, { method: 'GET' });
  },
  create: async (data) => {
    return apiCall('/taxonomy', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiCall(`/taxonomy/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiCall(`/taxonomy/${id}`, {
      method: 'DELETE',
    });
  },
  mergeTags: async (sourceTag, targetTag) => {
    return apiCall('/taxonomy/merge-tags', {
      method: 'POST',
      body: JSON.stringify({ sourceTag, targetTag }),
    });
  },
  reassignArticles: async (sourceId, targetId) => {
    return apiCall('/taxonomy/reassign', {
      method: 'POST',
      body: JSON.stringify({ sourceId, targetId }),
    });
  },
};

// Author API
export const authorAPI = {
  getRosterOverview: async () => {
    return apiCall('/authors/roster-overview', { method: 'GET' });
  },
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/authors${query ? '?' + query : ''}`;
    return apiCall(endpoint, { method: 'GET' });
  },
  create: async (data) => {
    return apiCall('/authors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiCall(`/authors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiCall(`/authors/${id}`, {
      method: 'DELETE',
    });
  },
  transferArticles: async (sourceAuthorId, targetAuthorId) => {
    return apiCall('/authors/transfer', {
      method: 'POST',
      body: JSON.stringify({ sourceAuthorId, targetAuthorId }),
    });
  },
};

// Editorial Workflow API
export const workflowAPI = {
  transition: async (postId, nextStatus, note = '', scheduledAt = null) => {
    return apiCall(`/posts/${postId}/workflow`, {
      method: 'POST',
      body: JSON.stringify({ nextStatus, note, scheduledAt }),
    });
  },
};

// Search & Discovery API
export const searchAPI = {
  search: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/search${query ? '?' + query : ''}`, { method: 'GET' });
  },
};

// Editorial Calendar API
export const calendarAPI = {
  getMetrics: async () => {
    return apiCall('/admin/calendar/metrics', { method: 'GET' });
  },
  getEvents: async (params = {}, year) => {
    if (typeof params === 'number') {
      const month = params;
      return apiCall(`/admin/calendar-events?month=${month}&year=${year}`, { method: 'GET' });
    }
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/calendar-events${query ? '?' + query : ''}`, { method: 'GET' });
  },
  schedule: async (postId, data) => {
    return apiCall('/admin/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ action: 'schedule', postId, data }),
    });
  },
  reschedule: async (postId, scheduledAt) => {
    return apiCall('/admin/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ action: 'reschedule', postId, data: { scheduledAt } }),
    });
  },
  updatePlanning: async (postId, data) => {
    return apiCall('/admin/calendar-events', {
      method: 'POST',
      body: JSON.stringify({ action: 'update_planning', postId, data }),
    });
  },
};

// Community Comments Moderation API
export const commentAPI = {
  getMetrics: async () => {
    return apiCall('/admin/comments/metrics', { method: 'GET' });
  },
  getQueue: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/comments${query ? '?' + query : ''}`, { method: 'GET' });
  },
  getThread: async (id) => {
    return apiCall(`/comments/${id}/thread`, { method: 'GET' });
  },
  moderate: async (id, action, note = '') => {
    return apiCall(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, note }),
    });
  },
  report: async (id, reason) => {
    return apiCall(`/comments/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  bulkModerate: async (commentIds, action) => {
    return apiCall('/comments/bulk', {
      method: 'POST',
      body: JSON.stringify({ commentIds, action }),
    });
  },
};

// Audience & Subscriber API
export const subscriberAPI = {
  getMetrics: async () => {
    return apiCall('/admin/subscribers/metrics', { method: 'GET' });
  },
  getGrowth: async (range = '30d') => {
    return apiCall(`/admin/subscribers/growth?range=${range}`, { method: 'GET' });
  },
  getConversions: async () => {
    return apiCall('/admin/subscribers/conversions', { method: 'GET' });
  },
  getList: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/newsletter/subscribers${query ? '?' + query : ''}`, { method: 'GET' });
  },
  suppress: async (id, reason) => {
    return apiCall('/newsletter/subscribers', {
      method: 'PATCH',
      body: JSON.stringify({ id, action: 'suppress', reason }),
    });
  },
  restore: async (id) => {
    return apiCall('/newsletter/subscribers', {
      method: 'PATCH',
      body: JSON.stringify({ id, action: 'restore' }),
    });
  },
  deleteSubscriber: async (id) => {
    return apiCall(`/newsletter/subscribers?id=${id}`, { method: 'DELETE' });
  },
};

// Newsletter Campaign API
export const campaignAPI = {
  getAll: async (status = 'all') => {
    return apiCall(`/admin/newsletter/campaigns?status=${status}`, { method: 'GET' });
  },
  getById: async (id) => {
    return apiCall(`/admin/newsletter/campaigns/${id}`, { method: 'GET' });
  },
  create: async (data) => {
    return apiCall('/admin/newsletter/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiCall(`/admin/newsletter/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  test: async (id, testEmail) => {
    return apiCall(`/admin/newsletter/campaigns/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'test', testEmail }),
    });
  },
  send: async (id) => {
    return apiCall(`/admin/newsletter/campaigns/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'send' }),
    });
  },
  previewSegment: async (targetAudience) => {
    return apiCall('/admin/newsletter/segment-preview', {
      method: 'POST',
      body: JSON.stringify(targetAudience),
    });
  },
};

// Newsroom Intelligence & Analytics API
export const analyticsAPI = {
  getOverview: async (range = '30d') => {
    return apiCall(`/admin/analytics?range=${range}`, { method: 'GET' });
  },
  getContent: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/analytics/content${query ? '?' + query : ''}`, { method: 'GET' });
  },
  getDesks: async (range = '30d') => {
    return apiCall(`/admin/analytics/desks?range=${range}`, { method: 'GET' });
  },
  getAuthors: async (range = '30d') => {
    return apiCall(`/admin/analytics/authors?range=${range}`, { method: 'GET' });
  },
  getTiming: async () => {
    return apiCall('/admin/analytics/timing', { method: 'GET' });
  },
  getArticleDetail: async (id) => {
    return apiCall(`/admin/analytics/article/${id}`, { method: 'GET' });
  },
  recordEvent: async (eventData) => {
    return apiCall('/analytics/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },
};

export default {
  authAPI,
  postAPI,
  taxonomyAPI,
  authorAPI,
  workflowAPI,
  searchAPI,
  calendarAPI,
  commentAPI,
  subscriberAPI,
  campaignAPI,
  analyticsAPI,
};
