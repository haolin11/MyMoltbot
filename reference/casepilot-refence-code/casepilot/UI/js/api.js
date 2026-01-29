/**
 * API客户端
 * 统一管理所有API调用
 */

const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  /**
   * 通用请求方法
   */
  async request(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(fullUrl, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '请求失败');
      }
      
      return data;
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  /**
   * GET请求
   */
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { method: 'GET' });
  }

  /**
   * POST请求
   */
  async post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT请求
   */
  async put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE请求
   */
  async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }

  // ========== 案例相关API ==========

  /**
   * 获取案例列表
   */
  async getCases(params = {}) {
    return this.get('/cases', params);
  }

  /**
   * 获取案例详情
   */
  async getCaseById(id) {
    return this.get(`/cases/${id}`);
  }

  /**
   * 搜索案例
   */
  async searchCases(query, topK = 5) {
    return this.get('/cases/search', { q: query, topK });
  }

  // ========== 方案相关API ==========

  /**
   * 生成方案
   */
  async generateSolution(userInput) {
    return this.post('/solutions/generate', userInput);
  }

  /**
   * 获取方案详情
   */
  async getSolutionById(id) {
    return this.get(`/solutions/${id}`);
  }

  /**
   * 获取方案列表
   */
  async getSolutions(params = {}) {
    return this.get('/solutions', params);
  }

  /**
   * 发送对话消息（针对方案进行进一步提问）
   */
  async sendChatMessage(solutionId, message) {
    return this.post(`/solutions/${solutionId}/chat`, { message });
  }
}

// 创建单例
const apiClient = new ApiClient();

// 验证实例方法
if (!apiClient.getCases || typeof apiClient.getCases !== 'function') {
  console.error('ApiClient实例创建失败，getCases方法不存在', {
    apiClient: apiClient,
    getCases: apiClient.getCases,
    methods: Object.getOwnPropertyNames(Object.getPrototypeOf(apiClient))
  });
}

// 导出 - 确保在浏览器环境中全局可用
(function() {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiClient;
  } else {
    // 确保全局可用
    window.ApiClient = apiClient;
    window.apiClient = apiClient;
    // 也设置全局变量（非严格模式）
    if (typeof globalThis !== 'undefined') {
      globalThis.ApiClient = apiClient;
    }
    console.log('ApiClient已初始化并导出到全局作用域', {
      hasGetCases: typeof window.ApiClient.getCases === 'function',
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(window.ApiClient))
    });
  }
})();

