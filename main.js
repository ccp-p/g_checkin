const glados = async () => {
  const cookie = process.env.GLADOS
  if (!cookie) return
  try {
    const headers = {
      'cookie': cookie,
      'referer': 'https://glados.rocks/console/checkin',
      'user-agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)',
    }
    const checkin = await fetch('https://glados.rocks/api/user/checkin', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: '{"token":"glados.one"}',
    }).then((r) => r.json())
    const status = await fetch('https://glados.rocks/api/user/status', {
      method: 'GET',
      headers,
    }).then((r) => r.json())

    const totalPoint = checkin.list[0].balance

    // const 252483344713 / 1073741824 ≈ 235.09 GB
    const usedTraffic = `${Number(status.data.traffic / 1073741824).toFixed(2)}GB`

    const nextEndDate = getNextEndDate(11)
    
    const diff = getDaysDiff(nextEndDate)
    // 252483344713
    const restTraffic = 500000000000 - status.data.traffic

    console.log('diff====',diff)
    const restTrafficGB = Number(restTraffic / 1073741824).toFixed(2)
    console.log('restTrafficGB====',restTrafficGB)
    const restTrafficDays = Number(restTrafficGB / diff).toFixed(2)
  console.log('restTrafficDays====',restTrafficDays)
    return [
      `${Number(status.data.leftDays)}  ${restTrafficDays}`,
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

function getNextEndDate(day) {
  // 创建一个表示启始月结日的 Date 对象
  let thisMonthEndDate = new Date();
  thisMonthEndDate.setDate(day);

  // 增加月份
  thisMonthEndDate.setMonth(thisMonthEndDate.getMonth() + 1);

  // 获取新的日期
  let nextMonthEndDate = thisMonthEndDate;

  // 创建一个 Intl.DateTimeFormat 对象，用于将日期转换为上海时区的日期
  let dtf = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai'
  });

  // 将日期转换为上海时区的日期
  let [{ value: mo },,{ value: da },,{ value: ye }] = dtf.formatToParts(nextMonthEndDate);

  // 返回上海时区的日期
  return `${ye}-${mo}-${da}`;
}

function getDaysDiff(nextEndDate) {
  // 创建一个表示当前日期的 Date 对象，并设置时区为上海
  let currentDate = new Date();
  let dtf = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
  let [{ value: mo },,{ value: da },,{ value: ye }] = dtf.formatToParts(currentDate);
  currentDate = new Date(`${ye}-${mo}-${da}`);

  let endDate = new Date(nextEndDate)

  // 计算两个日期之间的差值（以毫秒为单位），然后转换为天数
  let diff = endDate - currentDate;
  let daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return daysDiff;
}





const notify = async (contents) => {
  const token = process.env.NOTIFY
  if (!token || !contents) return
  await fetch(`https://www.pushplus.plus/send`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token,
      title: contents[0],
      content: contents[1],
      template: 'markdown',
    }),
  })
}

const main = async () => {
  await notify(await glados())
}

main()
