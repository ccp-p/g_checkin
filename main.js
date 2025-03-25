import { getDaysDiff, getNextEndDate } from './utils.js'

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

const glados = async () => {
  const cookie = process.env.GLADOS
  
  if (!cookie) return
  
  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.rocks/console/checkin',
      'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
    }
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    const randSleepInRange = (min, max) => sleep(Math.random() * (max - min) + min)
    const oneMinute = 30000
    const randSleep = () => randSleepInRange(oneMinute, 5*oneMinute); // 1 to 5 minutes in milliseconds

    await randSleep()
    
    // 使用重试机制进行 checkin 请求
    const checkin = await retryOperation(async () => {
      const response = await fetch('https://glados.rocks/api/user/checkin', {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: '{"token":"glados.one"}',
      });
      
      if (!response.ok) {
        throw new Error(`签到请求失败: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    });

    // 使用重试机制进行 status 请求
    const status = await retryOperation(async () => {
      const response = await fetch('https://glados.rocks/api/user/status', {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`状态请求失败: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    });

    const totalPoint = checkin.list[0].balance

    const usedTraffic = `${Number(status.data.traffic / 1073741824).toFixed(2)}GB`

    const nextEndDate = getNextEndDate(1)

    console.log('nextEndDate====', nextEndDate)
    const diff = getDaysDiff(nextEndDate)
    console.log('diff====', diff)
    const restTraffic = 500 - Number(usedTraffic.replace('GB',''))

    console.log('restTraffic====', restTraffic);

    const restTrafficDays = Number(restTraffic / diff).toFixed(2)
    
    console.log('restTrafficDays====', restTrafficDays)
    return [
      `${Number(status.data.leftDays)}天  剩${restTrafficDays}Gb/D`,
      `${Number(totalPoint)}point, ${usedTraffic} End ${nextEndDate} `,
    ]
  } catch (error) {
    return [
      'Checkin Error',
      `${error}`,
      `<${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}>`,
    ]
  }
}

const notify = async (contents) => {
  console.log('notify start')
  const token = process.env.NOTIFY
  if (!token || !contents) return
  
  try {
    // 使用重试机制进行通知请求
    await retryOperation(async () => {
      const response = await fetch(`https://www.pushplus.plus/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token,
          title: contents[0],
          content: contents[1],
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
    console.log('通知发送失败:', error)
  }
}

const main = async () => {
  await notify(await glados())
}

main()
