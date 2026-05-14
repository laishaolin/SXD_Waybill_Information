/**
 * 飞驼 API 服务
 * 文档: https://doc.freightower.com/
 */

import axios from 'axios';

// 飞驼 API 基础URL
// 开发环境使用代理，生产环境使用完整URL
const FT_API_BASE_URL = import.meta.env.DEV
  ? '/freetower-api'
  : 'http://openapi.freightower.com';

// 创建飞驼 API 客户端
const ftClient = axios.create({
  baseURL: FT_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token 缓存
const TOKEN_CACHE_KEY = 'freetower_token';
const TOKEN_EXPIRE_KEY = 'freetower_token_expire';

let cachedToken: string | null = null;
let tokenExpireTime: number = 0;

/**
 * 从本地存储加载Token
 */
function loadTokenFromStorage(): void {
  try {
    const storedToken = localStorage.getItem(TOKEN_CACHE_KEY);
    const storedExpireTime = localStorage.getItem(TOKEN_EXPIRE_KEY);

    if (storedToken && storedExpireTime) {
      const expireTime = parseInt(storedExpireTime, 10);
      // 检查token是否仍然有效
      if (Date.now() < expireTime) {
        cachedToken = storedToken;
        tokenExpireTime = expireTime;
      } else {
        // token已过期，清除本地存储
        clearTokenStorage();
      }
    }
  } catch (error) {
    console.warn('从本地存储加载Token失败:', error);
  }
}

/**
 * 将Token保存到本地存储
 * @param token - Token字符串
 * @param expireTime - 过期时间戳
 */
function saveTokenToStorage(token: string, expireTime: number): void {
  try {
    localStorage.setItem(TOKEN_CACHE_KEY, token);
    localStorage.setItem(TOKEN_EXPIRE_KEY, expireTime.toString());
  } catch (error) {
    console.warn('保存Token到本地存储失败:', error);
  }
}

/**
 * 清除本地存储的Token
 */
function clearTokenStorage(): void {
  try {
    localStorage.removeItem(TOKEN_CACHE_KEY);
    localStorage.removeItem(TOKEN_EXPIRE_KEY);
  } catch (error) {
    console.warn('清除本地存储Token失败:', error);
  }
}

/**
 * 获取飞驼 API Token
 * @param clientId - 客户端ID
 * @param secret - 客户端密钥
 * @returns Token 字符串
 */
export async function getFtToken(
  clientId?: string,
  secret?: string,
): Promise<string> {
  // 首次加载时尝试从本地存储恢复token
  if (!cachedToken) {
    loadTokenFromStorage();
  }

  // 检查缓存的token是否仍然有效
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken;
  }

  // 使用传入的参数或环境变量
  const finalClientId = clientId || import.meta.env.VITE_FT_CLITENT_ID;
  const finalSecret = secret || import.meta.env.VITE_FT_SECRET;
  try {
    const response = await ftClient.post('/auth/api/token', {
      clientId: finalClientId,
      secret: finalSecret,
    });

    const resp = response.data;
    console.log('获取飞驼Token响应:', resp.data, resp.data.access_token);
    if (resp.data && resp.data.access_token) {
      const newToken = resp.data.access_token;
      cachedToken = newToken;
      // 设置token过期时间（提前5分钟刷新）
      const expiresIn = resp.data.expires_in || 7200; // 默认2小时
      tokenExpireTime = Date.now() + (expiresIn - 300) * 1000;

      // 保存到本地存储
      saveTokenToStorage(newToken, tokenExpireTime);

      return newToken;
    }

    throw new Error('获取Token失败: 响应中没有access_token');
  } catch (error) {
    console.error('获取飞驼Token失败:', error);
    throw error;
  }
}

/**
 * 清除缓存的Token
 */
export function clearFtToken(): void {
  cachedToken = null;
  tokenExpireTime = 0;
  // 同时清除本地存储
  clearTokenStorage();
}

/**
 * 集装箱综合跟踪查询参数
 */
export interface ContainerTrackParams {
  /** 提单号 */
  billNo?: string;
  /** 集装箱号 */
  containerNo?: string;
  /** 承运人代码 */
  carrierCode?: string;
  /** 港口代码 */
  portCode?: string;
  /** 是否出口 */
  isExport?: boolean;
  /** 业务编号 */
  businessNo?: string;
  /** 提单类别 */
  billCategory?: string;
  /** 起运港代码 */
  polCode?: string;
  /** 目的港代码 */
  podCode?: string;
  /** 开放ID */
  openId?: string;
}

/**
 * 集装箱综合跟踪查询结果
 */
export interface ContainerTrackResult {
  /** 状态码 */
  statusCode: number;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: {
    /** 查询信息 */
    query?: any;
    /** 跟踪结果 */
    result?: any;
  };
}

/**
 * 集装箱综合跟踪（订阅+查询）
 * @param params - 查询参数
 * @param token - 可选的Token，如果不传则自动获取
 * @returns 跟踪结果
 */
export async function trackContainer(
  params: ContainerTrackParams,
  token?: string,
): Promise<ContainerTrackResult> {
  // 获取Token
  const authToken = token || (await getFtToken());

  try {
    const response = await ftClient.post('/application/v1/query', params, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('集装箱跟踪查询失败:', error);
    throw error;
  }
}

/**
 * 查询集装箱跟踪信息（完整流程：先获取Token再查询）
 * @param containerNo - 集装箱号
 * @param billNo - 可选的提单号
 * @param carrierCode - 可选的承运人代码
 * @returns 跟踪结果
 */
export async function queryContainerTrack(
  containerNo: string,
  billNo?: string,
  carrierCode?: string,
): Promise<ContainerTrackResult> {
  const params: ContainerTrackParams = {
    containerNo,
  };

  if (billNo) {
    params.billNo = billNo;
  }

  if (carrierCode) {
    params.carrierCode = carrierCode;
  }

  return trackContainer(params);
}
