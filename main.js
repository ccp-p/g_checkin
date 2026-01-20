import { getDaysDiff, getNextEndDate } from './utils.js'

const isTest = false; // 设置为 true 开启测试模式

// 解决 Node.js 低版本缺少 fetch 的问题
if (typeof fetch === 'undefined') {
  try {
    const nodeFetch = (await import('node-fetch')).default;
    globalThis.fetch = nodeFetch;
  } catch (e) {
    if (isTest) console.warn('警告: 当前环境缺少 fetch，建议升级 Node.js 至 v18+ 或安装 node-fetch 包');
  }
}

// 重试函数 - 将功能封装到单独的函数中
async function retryOperation(operation, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`尝试 ${attempt}/${maxRetries} 失败: ${error.message}`);
      
      // 最后一次尝试失败不需要等待
      if (attempt < maxRetries) {
        // 指数退避策略：等待时间随着尝试次数增加
        const waitTime = 2000 * Math.pow(2, attempt - 1);
        console.log(`等待 ${waitTime}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  // 所有尝试都失败，抛出最后一个错误
  throw new Error(`操作失败，已重试 ${maxRetries} 次: ${lastError.message}`);
}

// 安全获取嵌套对象属性的辅助函数
function safeGet(obj, path, defaultValue = null) {
  if (!obj) return defaultValue;
  
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result === undefined ? defaultValue : result;
}

const glados = async () => {
  let cookie = process.env.GLADOS
  
  if (!cookie) {
    if (isTest) {
      console.log('测试模式：未检测到 GLADOS 变量，使用测试 Cookie');
      cookie = 'dummy_cookie_for_test';
    } else {
      return ['Missing Cookie', 'Please set GLADOS environment variable'];
    }
  }
  
  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.cloud/console/checkin',
       "origin": "https://glados.cloud",
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
    }
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const randSleepInRange = (min, max) => sleep(Math.random() * (max - min) + min)
    const oneMinute = 30000
    const randSleep = () => randSleepInRange(oneMinute, 5*oneMinute); // 1 to 5 minutes in milliseconds

    if (!isTest) {
      await randSleep()
    } else {
      console.log('测试模式：跳过等待');
    }
    
    // 使用重试机制进行 checkin 请求
    const checkin = await retryOperation(async () => {
      const response = await fetch('https://glados.cloud/api/user/checkin', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: '{"token":"glados.cloud"}',
      });
      
      if (!response.ok) {
        throw new Error(`签到请求失败: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    })

    // 检查签到响应的完整性
    if (!checkin || typeof checkin !== 'object') {
      throw new Error('签到响应格式无效');
    }

    console.log('签到响应:', JSON.stringify(checkin));

       // 使用重试机制进行 status 请求
    const status = await retryOperation(async () => {
      const response = await fetch('https://glados.cloud/api/user/status', {
         method: 'GET',
        headers,
          
      });
      
      if (!response.ok) {
        throw new Error(`状态请求失败: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    });

    // 安全获取点数，避免未定义错误
    const totalPoint = safeGet(checkin, ['list', 0, 'balance'], 0);
    
    // 安全获取流量信息
    const trafficBytes = safeGet(status, ['data', 'traffic'], 0);
    const usedTraffic = `${Number(trafficBytes / 1073741824).toFixed(2)}GB`;
    
    // 安全获取剩余天数
    const leftDays = safeGet(status, ['data', 'leftDays'], 0);

    const nextEndDate = getNextEndDate(1);
    console.log('nextEndDate====', nextEndDate);
    
    let diff = 1; // 默认值
    try {
      diff = getDaysDiff(nextEndDate);
      console.log('diff====', diff);
    } catch (e) {
      console.error('计算天数差异时出错:', e);
    }
    
    const restTraffic = 500 - Number(usedTraffic.replace('GB',''));
    console.log('restTraffic====', restTraffic);

    // 防止除以零
    const restTrafficDays = diff > 0 ? Number(restTraffic / diff).toFixed(2) : '0.00';
    console.log('restTrafficDays====', restTrafficDays);
    
    return [
      `${Number(leftDays)}天  剩${restTrafficDays}Gb/D`,
      `${Number(totalPoint)}point, ${usedTraffic} End ${nextEndDate} `,
    ];
  } catch (error) {
    console.error('处理过程中出错:', error);
    return [
      'Checkin Error',
      `${error}`,
      `<${process.env.GITHUB_SERVER_URL || ''}/${process.env.GITHUB_REPOSITORY || ''}>`,
    ];
  }
};

const notify = async (contents) => {
  console.log('notify start');
  const token = process.env.NOTIFY;
  if (!token || !contents) {
    console.log('缺少通知令牌或内容');
    return;
  }
  
  try {
    // 使用重试机制进行通知请求
    await retryOperation(async () => {
      const response = await fetch(`https://www.pushplus.plus/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          title: contents[0] || 'GLaDOS 通知',
          content: contents[1] || '无内容',
          template: 'markdown',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`通知请求失败: ${response.status} ${response.statusText}`);
      }
      
      return response;
    });
    
    console.log('通知发送成功');
  } catch (error) {
    console.log('通知发送失败:', error);
  }
};

const main = async () => {
  const result = await glados();
  if (isTest) {
    console.log('测试模式结果:', result);
  } else {
    await notify(result);
  }
};

main();
