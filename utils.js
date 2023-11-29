export const  getDaysDiff = (nextEndDate) =>{
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
  
  export const  getNextEndDate = (day)=> {
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
  
