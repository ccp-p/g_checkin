import{getDaysDiff,getNextEndDate} from './utils.js'

   
// const 252483344713 / 1073741824 ≈ 235.09 GB
const usedTraffic = `${Number(266018740890 / 1073741824).toFixed(2)}GB`
console.log('usedTraffic====',usedTraffic);
const nextEndDate = getNextEndDate(1)

const diff = getDaysDiff(nextEndDate)
// 252483344713
const restTraffic = 500 - Number(usedTraffic.replace('GB',''))
    console.log('restTraffic====',restTraffic);
const restTrafficDays = Number(restTraffic / diff).toFixed(2)
console.log('restTrafficDays====',restTrafficDays)
debugger