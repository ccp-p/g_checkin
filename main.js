import{getDaysDiff,getNextEndDate} from './utils.js'
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

    const restTraffic = 500 - Number(usedTraffic.replace('GB',''))

      console.log('restTraffic====',restTraffic);

    const restTrafficDays = Number(restTraffic / diff).toFixed(2)
    
   console.log('restTrafficDays====',restTrafficDays)
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
