/**
 * API接口文档测试
 * 测试东方财富金融数据API接口
 * 按照功能模块分组：股票、基金、市场数据、搜索查询、工具接口
 */

// 请求配置
const headers = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Referer": "https://fund.eastmoney.com/",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  "Connection": "keep-alive",
};

// 工具函数：发送请求并输出结果
/**
 * 发送API请求并返回测试结果
 * @param {string} url - 请求URL
 * @param {string} description - 接口描述
 * @param {Object} customHeaders - 自定义请求头
 * @returns {Object} 测试结果对象
 */
async function fetchApi(url, description, customHeaders = null) {
  const result = {
    url: url,
    description: description,
    status: 'pending',
    statusCode: null,
    dataType: 'unknown',
    dataLength: 0,
    error: null
  };
  
  console.log(`\n=== ${description} ===`);
  console.log(`请求URL: ${url}`);
  
  try {
    const requestHeaders = customHeaders || headers;
    const response = await fetch(url, { headers: requestHeaders });
    
    result.statusCode = response.status;
    result.status = response.ok ? 'success' : 'failed';
    
    console.log("响应状态:", response.status);
    console.log("响应状态文本:", response.statusText);
    
    const text = await response.text();
    result.dataLength = text.length;
    console.log("响应内容长度:", text.length);

    // 检查是否为JSONP格式（以函数调用开头）
    if (text.startsWith('jQuery') || text.includes('(') && text.includes(')')) {
      result.dataType = 'jsonp';
      // 尝试提取JSON部分
      const match = text.match(/\((.*)\)/);
      if (match) {
        try {
          const jsonStr = match[1];
          const data = JSON.parse(jsonStr);
          console.log("返回数据:", JSON.stringify(data, null, 2));
          return { data, ...result };
        } catch (e) {
          console.log("返回内容是JSONP格式，但解析失败，输出原始文本:", text.substring(0, 500) + "...");
          result.error = 'JSONP parse failed';
          return { data: null, ...result };
        }
      } else {
        console.log("返回内容不是有效的JSON，输出原始文本:", text.substring(0, 500) + "...");
        result.error = 'Invalid JSONP format';
        return { data: null, ...result };
      }
    } else {
      // 尝试解析JSON
      try {
        const data = JSON.parse(text);
        result.dataType = 'json';
        console.log("返回数据:", JSON.stringify(data, null, 2));
        return { data, ...result };
      } catch (jsonError) {
        result.dataType = 'text';
        console.log("返回内容不是有效的JSON，输出原始文本:", text.substring(0, 500) + "...");
        return { data: text, ...result };
      }
    }
  } catch (error) {
    console.error("请求失败:", error.message);
    console.error("错误详细信息:", error);
    result.status = 'failed';
    result.error = error.message;
    return { data: null, ...result };
  }
}

// ==============================================
// 1. 股票相关接口 (Stock APIs)
// ==============================================

/**
 * 股票实时行情接口
 * 测试获取贵州茅台的实时行情数据
 * 使用东方财富新接口：https://push2.eastmoney.com/api/qt/ulist/get
 * 参数说明：
 * - secids: 股票代码（1.600519 表示沪市贵州茅台）
 * - ut: 用户标识参数
 * - fields: 返回字段列表（包含行情基本信息）
 * - pi/pz/po: 分页参数
 * - rt: 时间戳，防止缓存
 */
async function testStockRealTime() {
  // 配置股票行情专用请求头，模拟浏览器请求
  const stockHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Referer": "https://quote.eastmoney.com/",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive"
  };
  
  // 发送请求获取贵州茅台实时行情数据并返回结果
  return await fetchApi(
    `https://push2.eastmoney.com/api/qt/ulist/get?secids=1.600519&ut=bd1d9ddb04089700cf9c27f6f7426281&fields=f1,f2,f3,f4,f12,f13,f14,f62,f128,f136,f169,f170,f171&pi=0&pz=20&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:1+s:2&rt=${Date.now()}`,
    "股票实时行情接口 - 贵州茅台（新接口）",
    stockHeaders
  );
}

/**
 * 股票K线数据接口
 * 测试获取贵州茅台的月线K线数据
 * 使用东方财富历史数据接口：https://push2his.eastmoney.com/api/qt/stock/kline/get
 * 参数说明：
 * - cb: JSONP回调函数名
 * - secid: 股票代码（1.600519 表示沪市贵州茅台）
 * - ut: 用户标识参数
 * - fields1/fields2: 返回字段列表
 * - klt: K线类型（101=日线, 103=月线）
 * - fqt: 复权类型（0=不复权, 1=前复权）
 * - end: 结束日期
 * - lmt: 返回数据条数限制
 */
async function testStockKline() {
  // 配置K线数据专用请求头，包含完整的Cookie信息以绕过反爬机制
  const klineHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Referer": "https://quote.eastmoney.com/sh600519.html?spm=search",
    "Accept": "*/*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Cookie": "st_nvi=vtAWVtcYZaXPSnJ5smQWyee8f; nid18=0117faaefa66226d01f9d326a1ca25b7; nid18_create_time=1769109464029; gviem=phGjENtLD8H7covzMLBe44bf4; gviem_create_time=1769109464029; qgqp_b_id=a607e2f3fa7a44ed505352e4b0095b40; AUTH_FUND.EASTMONEY.COM_GSJZ=AUTH*TTJJ*TOKEN; EMFUND0=03-26%2021%3A58%3A12@%23%24%u62DB%u5546%u4E2D%u8BC1800%u6307%u6570%u589E%u5F3AA@%23%24016276; EMFUND1=03-26%2021%3A59%3A49@%23%24%u535A%u65F6%u4E0A%u8BC1%u79D1%u521B%u677F%u4EBA%u5DE5%u667A%u80FDETF%u53D1%u8D77%u5F0F%u8054%u63A5C@%23%24023521; EMFUND2=03-26%2023%3A07%3A15@%23%24%u5EFA%u4FE1%u6CAA%u6DF1300%u7EA2%u5229ETF%u8054%u63A5A@%23%24012712; EMFUND3=03-27%2000%3A27%3A55@%23%24%u5357%u65B9%u6807%u666E%u7EA2%u5229%u4F4E%u6CE250ETF%u8054%u63A5A@%23%24008163; EMFUND5=03-27%2000%3A44%3A39@%23%24%u94F6%u534E%u96C6%u6210%u7535%u8DEF%u6DF7%u5408C@%23%24013841; EMFUND6=03-27%2001%3A22%3A15@%23%24%u5357%u65B9%u6709%u8272%u91D1%u5C5EETF%u8054%u63A5C@%23%24004433; EMFUND7=03-27%2001%3A23%3A05@%23%24%u5E7F%u53D1%u4E2D%u8BC1%u519B%u5DE5ETF%u8054%u63A5A@%23%24003017; EMFUND9=03-31%2001%3A09%3A27@%23%24%u5609%u5B9E%u6E2F%u80A1%u901A%u65B0%u7ECF%u6D4E%u6307%u6570C@%23%24006614; st_si=68587094849594; EMFUND8=03-31%2001%3A16%3A41@%23%24%u534E%u590F%u6210%u957F%u6DF7%u5408@%23%24000001; rskey=FVkG9WjdXaHFYRGZkdktlVFZQV1k3cEMrUT09QM1Jx; fullscreengg=1; fullscreengg2=1; st_asi=delete; EMFUND4=03-31 23:59:43@#$%u56FD%u6CF0%u56FD%u8BC1%u98DF%u54C1%u996E%u6599%u884C%u4E1A%28LOF%29A@%23%24160222; st_pvi=15644928882968; st_sp=2026-02-01%2002%3A42%3A23; st_inirUrl=https%3A%2F%2Fwww.eastmoney.com%2F; st_sn=20; st_psi=20260401000409600-113200301201-8469126079",
    "Pragma": "no-cache",
    "Sec-Fetch-Dest": "script",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "same-site",
    "sec-ch-ua": "\"Chromium\";v=\"146\", \"Not-A.Brand\";v=\"24\", \"Google Chrome\";v=\"146\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\""
  };
  
  // 发送请求获取贵州茅台月线K线数据并返回结果
  return await fetchApi(
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?cb=jQuery351029190319602936143_1774973048959&secid=1.600519&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=103&fqt=1&end=20500101&lmt=120&_=${Date.now()}`,
    "股票K线数据接口 - 贵州茅台月线",
    klineHeaders
  );
}

/**
 * 股票分时数据接口
 * 测试获取贵州茅台的当日分时数据
 * 使用东方财富分时数据接口：https://push2.eastmoney.com/api/qt/stock/trends2/get
 * 参数说明：
 * - secid: 股票代码（1.600519 表示沪市贵州茅台）
 * - fields1/fields2: 返回字段列表
 * - ndays: 获取天数（1表示当日）
 */
async function testStockMinute() {
  // 发送请求获取贵州茅台当日分时数据并返回结果
  return await fetchApi(
    "https://push2.eastmoney.com/api/qt/stock/trends2/get?secid=1.600519&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f53,f56,f58&iscr=0&iscca=0&ndays=1",
    "股票分时数据接口 - 贵州茅台当日分时",
  );
}

/**
 * 股票买卖盘数据接口
 * 测试获取贵州茅台的买卖五档数据
 * 使用东方财富股票详情接口：https://push2.eastmoney.com/api/qt/stock/get
 * 参数说明：
 * - secid: 股票代码（1.600519 表示沪市贵州茅台）
 * - fields: 返回字段列表（包含买卖盘数据）
 * - ut: 用户标识参数
 * - invt/fltt: 数据类型参数
 */
async function testStockOrderBook() {
  console.log("\n=== 测试股票买卖盘数据接口 ===");
  const stockCode = "600519";
  const url = `https://push2.eastmoney.com/api/qt/stock/get?invt=2&fltt=1&fields=f58%2Cf734%2Cf107%2Cf57%2Cf43%2Cf59%2Cf169%2Cf301%2Cf60%2Cf170%2Cf152%2Cf177%2Cf111%2Cf46%2Cf44%2Cf45%2Cf47%2Cf260%2Cf48%2Cf261%2Cf279%2Cf277%2Cf278%2Cf288%2Cf19%2Cf17%2Cf531%2Cf15%2Cf13%2Cf11%2Cf20%2Cf18%2Cf16%2Cf14%2Cf12%2Cf39%2Cf37%2Cf35%2Cf33%2Cf31%2Cf40%2Cf38%2Cf36%2Cf34%2Cf32&secid=1.${stockCode}&ut=fa5fd1943c7b386f172d6893dbfba10b&wbp2u=%7C0%7C0%7C0%7Cweb&dect=1&_=${Date.now()}`;
  
  console.log("测试URL:", url);
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error("请求失败:", response.status);
      return {
        url: url,
        description: "股票买卖盘数据接口 - 贵州茅台",
        status: 'failed',
        statusCode: response.status,
        dataType: 'unknown',
        dataLength: 0,
        error: `HTTP error! status: ${response.status}`
      };
    }
    
    const data = await response.json();
    
    console.log("\n=== 股票买卖盘数据接口 - 贵州茅台 ===");
    console.log("请求URL:", url);
    console.log("响应状态:", response.status);
    console.log("响应状态文本:", response.statusText);
    console.log("响应内容长度:", JSON.stringify(data).length);
    console.log("返回数据:", JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log("\n=== 买卖盘数据解析 ===");
      const stockData = data.data;
      
      // 卖盘数据（卖五到卖一）
      console.log("卖五     " + (stockData.f31 / 100).toFixed(2) + "         " + stockData.f32);
      console.log("卖四     " + (stockData.f33 / 100).toFixed(2) + "         " + stockData.f34);
      console.log("卖三     " + (stockData.f35 / 100).toFixed(2) + "         " + stockData.f36);
      console.log("卖二     " + (stockData.f37 / 100).toFixed(2) + "         " + stockData.f38);
      console.log("卖一     " + (stockData.f39 / 100).toFixed(2) + "         " + stockData.f40);
      console.log("");
      
      // 买盘数据（买一到买五）
      console.log("买一     " + (stockData.f19 / 100).toFixed(2) + "         " + stockData.f20);
      console.log("买二     " + (stockData.f17 / 100).toFixed(2) + "         " + stockData.f18);
      console.log("买三     " + (stockData.f15 / 100).toFixed(2) + "         " + stockData.f16);
      console.log("买四     " + (stockData.f13 / 100).toFixed(2) + "         " + stockData.f14);
      console.log("买五     " + (stockData.f11 / 100).toFixed(2) + "         " + stockData.f12);
    }
    
    return {
      url: url,
      description: "股票买卖盘数据接口 - 贵州茅台",
      status: 'success',
      statusCode: 200,
      dataType: 'json',
      dataLength: JSON.stringify(data).length,
      error: null,
      data: data
    };
    
  } catch (error) {
    console.error("请求失败:", error.message);
    return {
      url: url,
      description: "股票买卖盘数据接口 - 贵州茅台",
      status: 'failed',
      statusCode: null,
      dataType: 'unknown',
      dataLength: 0,
      error: error.message
    };
  }
}

// ==============================================
// 2. 基金相关接口 (Fund APIs)
// ==============================================

/**
 * 基金实时净值接口
 * 测试获取易方达中小盘的实时净值数据
 * 使用第三方基金净值接口：http://fundgz.1234567.com.cn/js/110011.js
 * 参数说明：
 * - 110011: 基金代码（易方达中小盘）
 */
async function testFundRealTime() {
  // 发送请求获取易方达中小盘实时净值数据并返回结果
  return await fetchApi(
    "http://fundgz.1234567.com.cn/js/110011.js",
    "基金实时净值接口 - 易方达中小盘",
  );
}

/**
 * 基金历史净值接口
 * 测试获取易方达中小盘的近1年历史净值数据
 * 使用东方财富移动端API：https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx
 * 参数说明：
 * - FCODE: 基金代码（110011 表示易方达中小盘）
 * - RANGE: 时间范围（n表示近1年）
 * - deviceid/plat/product/version: 移动端设备参数
 */
async function testFundNetDiagram() {
  // 发送请求获取易方达中小盘近1年历史净值数据并返回结果
  return await fetchApi(
    "https://fundmobapi.eastmoney.com/FundMApi/FundNetDiagram.ashx?FCODE=110011&RANGE=n&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
    "基金历史净值接口 - 易方达中小盘近1年",
  );
}

/**
 * 基金持仓股票接口
 * 测试获取易方达中小盘的持仓股票数据，并进一步获取持仓股票的实时行情
 * 使用东方财富移动端API：https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition
 * 参数说明：
 * - FCODE: 基金代码（110011 表示易方达中小盘）
 * - deviceid/plat/product/version: 移动端设备参数
 */
async function testFundHoldings() {
  // 获取基金持仓数据并返回结果
  const result = await fetchApi(
    "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition?FCODE=110011&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
    "基金持仓股票接口 - 易方达中小盘持仓",
  );
  
  if (result.data && result.data.Datas && result.data.Datas.fundStocks) {
    const stockData = result.data.Datas.fundStocks;
    console.log("\n=== 持仓股票详细信息 ===");
    
    // 获取前5只持仓股票的实时行情
    for (let i = 0; i < Math.min(5, stockData.length); i++) {
      const stock = stockData[i];
      const stockCode = stock.GPDM;
      const stockName = stock.GPJC;
      const stockExchange = stock.TEXCH; // 1=沪市, 2=深市, 5=港股
      
      // 转换股票代码格式
      let secid;
      if (stockExchange === "1") {
        secid = `1.${stockCode}`; // 沪市
      } else if (stockExchange === "2") {
        secid = `0.${stockCode}`; // 深市
      } else {
        continue; // 暂时只处理A股
      }
      
      console.log(`\n获取股票信息: ${stockName} (${stockCode})`);
      
      // 使用股票实时行情接口获取股票信息
      const stockHeaders = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        "Referer": "https://quote.eastmoney.com/",
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Connection": "keep-alive"
      };
      
      await fetchApi(
        `https://push2.eastmoney.com/api/qt/ulist/get?secids=${secid}&ut=bd1d9ddb04089700cf9c27f6f7426281&fields=f1,f2,f3,f4,f12,f13,f14,f62,f128,f136,f169,f170,f171&pi=0&pz=20&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:1+s:2&rt=${Date.now()}`,
        `股票实时行情 - ${stockName}`,
        stockHeaders
      );
    }
  }
  
  return result;
}

/**
 * 基金公司信息接口
 * 测试获取基金公司信息数据
 * 使用东方财富基金公司信息接口：https://fund.eastmoney.com/api/static/FundCommpanyInfo.js
 * 返回数据格式：JavaScript对象，包含基金公司代码与名称的映射表
 * 数据结构：包含券商类公司和基金公司的列表
 */
async function testFundCompanyInfo() {
  console.log("\n=== 测试基金公司信息接口 ===");
  const url = "https://fund.eastmoney.com/api/static/FundCommpanyInfo.js";
  console.log("测试URL:", url);
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error("请求失败:", response.status);
      return {
        url: url,
        description: "基金公司信息接口",
        status: 'failed',
        statusCode: response.status,
        dataType: 'unknown',
        dataLength: 0,
        error: `HTTP error! status: ${response.status}`
      };
    }
    
    const responseText = await response.text();
    
    // 提取JavaScript对象数据
    console.log("响应数据前100字符:", responseText.substring(0, 100));
    
    try {
      // 使用eval解析JavaScript对象
      const companyData = eval(responseText.replace(/^var data=/, ''));
      
      console.log("解析后的数据类型:", typeof companyData);
      console.log("解析后的数据键:", Object.keys(companyData));
      
      if (companyData.券商类公司 && Array.isArray(companyData.券商类公司)) {
        console.log(`券商类公司数量: ${companyData.券商类公司.length}`);
      }
      
      if (companyData.基金公司 && Array.isArray(companyData.基金公司)) {
        console.log(`基金公司数量: ${companyData.基金公司.length}`);
        
        // 显示前5家基金公司信息
        console.log("\n前5家基金公司信息:");
        for (let i = 0; i < Math.min(5, companyData.基金公司.length); i++) {
          const company = companyData.基金公司[i];
          console.log(`${i + 1}. ${company[1]} (代码: ${company[0]})`);
        }
      }
      
      console.log(`基金公司总数: ${(companyData.券商类公司?.length || 0) + (companyData.基金公司?.length || 0)}`);
      
    } catch (error) {
      console.error("解析基金公司信息数据失败:", error.message);
    }
    
    return {
      url: url,
      description: "基金公司信息接口",
      status: 'success',
      statusCode: 200,
      dataType: 'javascript',
      dataLength: responseText.length,
      error: null
    };
    
  } catch (error) {
    console.error("请求失败:", error.message);
    return {
      url: url,
      description: "基金公司信息接口",
      status: 'failed',
      statusCode: null,
      dataType: 'unknown',
      dataLength: 0,
      error: error.message
    };
  }
}

/**
 * 基金公司映射表接口
 * 测试获取基金公司代码与名称的映射数据
 * 使用东方财富基金公司映射表接口：https://fund.eastmoney.com/js/jjjz_gs.js
 * 参数说明：
 * - dt: 时间戳，防止缓存
 * 返回数据格式：JavaScript对象，包含基金公司代码与名称的映射表
 * 数据结构：二维数组，每个元素包含[公司代码, 公司名称]
 */
async function testFundCompanyMapping() {
  // 配置基金公司映射表专用请求头，模拟浏览器请求
  const mappingHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Referer": "https://fund.eastmoney.com/",
    "Accept": "application/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive"
  };
  
  // 测试基金公司映射表接口，添加时间戳参数防止缓存
  const url = `https://fund.eastmoney.com/js/jjjz_gs.js?dt=${Date.now()}`;
  
  console.log("\n=== 测试基金公司映射表接口 ===");
  console.log("测试URL:", url);
  
  // 直接发送请求获取基金公司映射表数据
  console.log("\n=== 基金公司映射表解析 ===");
  
  try {
    const response = await fetch(url, { headers: mappingHeaders });
    if (!response.ok) {
      console.error("请求失败:", response.status);
      return {
        url: url,
        description: "基金公司映射表接口",
        status: 'failed',
        statusCode: response.status,
        dataType: 'unknown',
        dataLength: 0,
        error: `HTTP error! status: ${response.status}`
      };
    }
    
    const responseText = await response.text();
    
    // 提取JavaScript对象数据
    console.log("响应数据前100字符:", responseText.substring(0, 100));
    
    try {
      // 使用eval解析JavaScript对象
      const gsData = eval(responseText.replace(/^var gs=/, ''));
      
      // 直接获取公司列表数据
      const companyList = Array.isArray(gsData) ? gsData : (gsData.op || []);
      
      if (companyList.length > 0) {
        console.log(`基金公司总数: ${companyList.length}`);
        
        // 显示前5家基金公司信息
        console.log("\n前5家基金公司信息:");
        for (let i = 0; i < Math.min(5, companyList.length); i++) {
          const company = companyList[i];
          console.log(`${i + 1}. ${company[1]} (代码: ${company[0]})`);
        }
        
        // 搜索知名基金公司
        const wellKnownCompanies = ['华夏基金', '南方基金', '易方达基金', '广发基金', '嘉实基金'];
        console.log("\n知名基金公司搜索:");
        
        wellKnownCompanies.forEach(name => {
          const found = companyList.find(item => item[1] === name);
          if (found) {
            console.log(`${name}: ${found[0]}`);
          } else {
            console.log(`${name}: 未找到`);
          }
        });
        
      } else {
        console.error("未找到基金公司数据");
      }
      
    } catch (error) {
      console.error("解析基金公司映射表数据失败:", error.message);
    }
    
    return {
      url: url,
      description: "基金公司映射表接口",
      status: 'success',
      statusCode: 200,
      dataType: 'javascript',
      dataLength: responseText.length,
      error: null
    };
    
  } catch (error) {
    console.error("请求失败:", error.message);
    return {
      url: url,
      description: "基金公司映射表接口",
      status: 'failed',
      statusCode: null,
      dataType: 'unknown',
      dataLength: 0,
      error: error.message
    };
  }
}

/**
 * 基金收益率图表数据接口
 * 测试获取基金收益率图表数据，包含基金自身收益率、指数收益率和基金类型收益率的对比
 * 使用东方财富基金收益率图表接口：https://fundmobapi.eastmoney.com/FundMApi/FundYieldDiagramNew.ashx
 * 参数说明：
 * - FCODE: 基金代码
 * - RANGE: 时间范围（n表示近1年）
 * - deviceid/plat/product/version: 移动端设备参数
 */
async function testFundYieldDiagramNew() {
  console.log("\n=== 基金收益率图表数据接口测试 ===");
  const url = "https://fundmobapi.eastmoney.com/FundMApi/FundYieldDiagramNew.ashx?FCODE=110011&RANGE=n&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0";
  console.log(`请求URL: ${url}`);
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.error("请求失败:", response.status);
      return {
        url: url,
        description: "基金收益率图表数据接口",
        status: 'failed',
        statusCode: response.status,
        dataType: 'unknown',
        dataLength: 0,
        error: `HTTP error! status: ${response.status}`
      };
    }
    
    const data = await response.json();
    
    console.log("返回数据:", JSON.stringify(data, null, 2));
    
    if (!data.Datas || data.Datas.length === 0) {
      console.log("返回数据为空");
      return {
        url: url,
        description: "基金收益率图表数据接口",
        status: 'failed',
        statusCode: 200,
        dataType: 'json',
        dataLength: JSON.stringify(data).length,
        error: '返回数据为空'
      };
    }
    
    console.log("基金收益率数据解析成功");
    console.log(`数据条数: ${data.Datas.length}`);
    console.log(`指数名称: ${data.Expansion?.INDEXNAME || '未知'}`);
    
    // 显示最近几条数据
    const recentData = data.Datas.slice(-3);
    console.log("最近3条数据:", JSON.stringify(recentData, null, 2));
    
    return {
      url: url,
      description: "基金收益率图表数据接口",
      status: 'success',
      statusCode: 200,
      dataType: 'json',
      dataLength: JSON.stringify(data).length,
      error: null,
      data: data
    };
  } catch (error) {
    console.error("请求失败:", error.message);
    return {
      url: url,
      description: "基金收益率图表数据接口",
      status: 'failed',
      statusCode: null,
      dataType: 'unknown',
      dataLength: 0,
      error: error.message
    };
  }
}

/**
 * 基金净值列表接口
 * 测试获取基金净值列表数据
 * 使用东方财富基金净值列表接口：https://fundmobapi.eastmoney.com/FundMApi/FundNetList.ashx
 * 参数说明：
 * - FCODE: 基金代码（110011 表示易方达中小盘）
 * - deviceid/plat/product/version: 移动端设备参数
 * - appType: 应用类型（ttjj表示天天基金）
 */
async function testFundNetList() {
  // 配置基金净值列表专用请求头，模拟浏览器请求
  const fundNetHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Referer": "https://fund.eastmoney.com/",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive"
  };
  
  // 测试基金净值列表接口，添加appType参数解决返回空数据的问题
  const url = "https://fundmobapi.eastmoney.com/FundMApi/FundNetList.ashx?FCODE=110011&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&appType=ttjj";
  
  console.log("\n=== 测试基金净值列表接口 ===");
  console.log("测试URL:", url);
  
  // 直接发送请求获取基金净值列表数据
  console.log("\n=== 基金净值列表解析 ===");
  
  try {
    const response = await fetch(url, { headers: fundNetHeaders });
    if (!response.ok) {
      console.error("请求失败:", response.status);
      return {
        url: url,
        description: "基金净值列表接口 - 易方达中小盘",
        status: 'failed',
        statusCode: response.status,
        dataType: 'unknown',
        dataLength: 0,
        error: `HTTP error! status: ${response.status}`
      };
    }
    
    const responseText = await response.text();
    
    // 提取JavaScript对象数据
    console.log("响应数据前100字符:", responseText.substring(0, 100));
    
    try {
      // 使用eval解析JavaScript对象
      const netData = eval(responseText.replace(/^jsonpgz\(/, '').replace(/\);$/, ''));
      
      console.log("解析后的数据类型:", typeof netData);
      console.log("解析后的数据键:", Object.keys(netData));
      
      if (netData && netData.length > 0) {
        console.log(`净值数据条数: ${netData.length}`);
        
        // 显示前5条净值数据
        console.log("\n前5条净值数据:");
        for (let i = 0; i < Math.min(5, netData.length); i++) {
          const netItem = netData[i];
          console.log(`${i + 1}. 日期: ${netItem.FSRQ}, 单位净值: ${netItem.DWJZ}, 累计净值: ${netItem.LJJZ}, 日增长率: ${netItem.JZZZL}%`);
        }
        
      } else {
        console.error("净值数据为空");
      }
      
    } catch (error) {
      console.error("解析基金净值列表数据失败:", error.message);
    }
    
    return {
      url: url,
      description: "基金净值列表接口 - 易方达中小盘",
      status: 'success',
      statusCode: 200,
      dataType: 'jsonp',
      dataLength: responseText.length,
      error: null
    };
    
  } catch (error) {
    console.error("请求失败:", error.message);
    return {
      url: url,
      description: "基金净值列表接口 - 易方达中小盘",
      status: 'failed',
      statusCode: null,
      dataType: 'unknown',
      dataLength: 0,
      error: error.message
    };
  }
}

/**
 * 基金持仓新接口
 * 测试获取基金持仓数据，对比不同参数组合的返回结果
 * 使用东方财富基金持仓新接口：https://fundmobapi.eastmoney.com/FundMApi/FundInverstPositionNew.ashx
 * 参数说明：
 * - FCODE: 基金代码（110011 表示易方达中小盘）
 * - deviceid/plat/product/version: 移动端设备参数
 * - appType: 应用类型（ttjj表示天天基金）
 */
async function testFundInverstPositionNew() {
  // 配置基金持仓专用请求头，模拟浏览器请求
  const fundPositionHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Referer": "https://fund.eastmoney.com/",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Connection": "keep-alive"
  };
  
  // 测试不同参数组合的基金持仓接口
  const urls = [
    "https://fundmobapi.eastmoney.com/FundMApi/FundInverstPositionNew.ashx?FCODE=110011&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
    "https://fundmobapi.eastmoney.com/FundMApi/FundInverstPositionNew.ashx?FCODE=110011&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&appType=ttjj",
    "https://fundmobapi.eastmoney.com/FundMApi/FundInverstPositionNew.ashx?FCODE=110011&deviceid=Wap&plat=Android&product=EFund&version=6.2.4&appType=ttjj"
  ];
  
  let successfulResult = null;
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    
    console.log(`\n=== 测试基金持仓新接口 - 参数${i + 1} ===`);
    console.log("测试URL:", url);
    
    try {
      const response = await fetch(url, { headers: fundPositionHeaders });
      if (!response.ok) {
        console.error("请求失败:", response.status);
        continue;
      }
      
      const data = await response.json();
      
      console.log("响应状态:", response.status);
      console.log("响应内容长度:", JSON.stringify(data).length);
      console.log("返回数据:", JSON.stringify(data, null, 2));
      
      if (data.Datas && data.Datas.length > 0) {
        console.log(`持仓数据解析成功，数据条数: ${data.Datas.length}`);
        successfulResult = {
          url: url,
          description: `基金持仓新接口 - 参数${i + 1}`,
          status: 'success',
          statusCode: 200,
          dataType: 'json',
          dataLength: JSON.stringify(data).length,
          error: null,
          data: data
        };
        break; // 找到成功的参数组合就退出循环
      } else {
        console.log("持仓数据为空");
      }
      
    } catch (error) {
      console.error("请求失败:", error.message);
    }
  }
  
  if (!successfulResult) {
    return {
      url: urls[0],
      description: "基金持仓新接口",
      status: 'failed',
      statusCode: null,
      dataType: 'unknown',
      dataLength: 0,
      error: '所有参数组合均返回空数据'
    };
  }
  
  return successfulResult;
}

// ==============================================
// 3. 市场数据接口 (Market APIs)
// ==============================================

/**
 * 大盘资金流向接口
 * 测试获取上证指数的资金流向数据
 * 使用东方财富资金流向接口：https://push2.eastmoney.com/api/qt/stock/fflow/kline/get
 * 参数说明：
 * - secid: 上证指数代码（1.000001）
 * - secid2: 深证成指代码（0.399001）
 * - fields1/fields2: 返回字段列表
 */
async function testMarketFundFlow() {
  // 发送请求获取上证指数资金流向数据并返回结果
  return await fetchApi(
    "https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?lmt=0&klt=1&secid=1.000001&secid2=0.399001&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63",
    "大盘资金流向接口 - 上证指数",
  );
}

/**
 * 北向资金接口
 * 测试获取北向资金实时数据
 * 使用东方财富北向资金接口：https://push2.eastmoney.com/api/qt/kamt.rtmin/get
 * 参数说明：
 * - fields1/fields2: 返回字段列表（包含北向资金流入流出数据）
 */
async function testNorthFund() {
  // 发送请求获取北向资金实时数据并返回结果
  return await fetchApi(
    "https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f53,f54,f55,f56",
    "北向资金接口",
  );
}

/**
 * 北向资金分时数据接口（新）
 * 测试获取北向资金实时分时数据，包含北向流入和南向流出
 * 使用东方财富北向资金分时数据接口：https://push2.eastmoney.com/api/qt/kamt.rtmin/get
 * 参数说明：
 * - fields1/fields2: 返回字段列表（包含北向资金流入流出数据）
 * - v: 时间戳参数，防止缓存
 */
async function testNorthboundCapital() {
  // 工具函数：获取时间戳
  function ts() {
    return Date.now();
  }
  
  // 工具函数：发送JSON请求
  async function fetchJSON(url) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
  
  // 解析北向资金数据
  function parseFlow(arr) {
    if (!arr) return [];
    return arr.map((item) => {
      const p = item.split(",");
      return {
        time: p[0],
        netBuy: p[1] === "-" ? null : (p[1] / 1e4).toFixed(4),
        balance: p[2] === "-" ? null : (p[2] / 1e4).toFixed(4),
        netBuy2: p[3] === "-" ? null : (p[3] / 1e4).toFixed(4),
        balance2: p[4] === "-" ? null : (p[4] / 1e4).toFixed(4),
        total: p[5] === "-" ? null : (p[5] / 1e4).toFixed(4),
      };
    });
  }
  
  console.log("\n=== 北向资金分时数据接口测试 ===");
  const url = `https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f53,f54,f55,f56&ut=&v=${ts()}`;
  console.log(`请求URL: ${url}`);
  
  try {
    const data = await fetchJSON(url);
    if (!data.data) {
      console.log("返回数据为空");
      return {
        url: url,
        description: "北向资金分时数据接口",
        status: 'failed',
        statusCode: null,
        dataType: 'json',
        dataLength: 0,
        error: '返回数据为空'
      };
    }
    
    const result = {
      s2n: parseFlow(data.data.s2n),
      n2s: parseFlow(data.data.n2s),
    };
    
    console.log("北向资金数据解析成功");
    console.log(`北向资金（s2n）数据条数: ${result.s2n.length}`);
    console.log(`南向资金（n2s）数据条数: ${result.n2s.length}`);
    
    if (result.s2n.length > 0) {
      console.log("最近一条北向资金数据:", JSON.stringify(result.s2n[result.s2n.length - 1], null, 2));
    }
    
    if (result.n2s.length > 0) {
      console.log("最近一条南向资金数据:", JSON.stringify(result.n2s[result.n2s.length - 1], null, 2));
    }
    
    return {
      url: url,
      description: "北向资金分时数据接口",
      status: 'success',
      statusCode: 200,
      dataType: 'json',
      dataLength: JSON.stringify(data).length,
      error: null,
      data: result
    };
  } catch (error) {
    console.error("请求失败:", error.message);
    return {
      url: url,
      description: "北向资金分时数据接口",
      status: 'failed',
      statusCode: null,
      dataType: 'unknown',
      dataLength: 0,
      error: error.message
    };
  }
}

/**
 * 涨跌分布接口
 * 测试获取市场涨跌分布数据
 * 使用东方财富涨跌分布接口：https://push2ex.eastmoney.com/getTopicZDFenBu
 * 参数说明：
 * - cb: JSONP回调函数名
 * - ut: 用户标识参数
 * - dpt: 数据类型（wz.ztzt表示涨跌停数据）
 */
async function testUpDownDistribution() {
  // 发送请求获取市场涨跌分布数据并返回结果
  return await fetchApi(
    "https://push2ex.eastmoney.com/getTopicZDFenBu?cb=callbackdata7930743&ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt",
    "涨跌分布接口",
  );
}

/**
 * 市场概览接口
 * 测试获取上证指数和深证成指的行情数据
 * 使用东方财富行情接口：https://push2.eastmoney.com/api/qt/ulist.np/get
 * 参数说明：
 * - fltt: 数据类型（2表示行情数据）
 * - secids: 股票代码列表（1.000001=上证指数, 0.399001=深证成指）
 * - fields: 返回字段列表（包含指数价格、涨跌幅、成交额、涨跌家数等）
 * - _: 时间戳，防止缓存
 */
async function testMarketOverview() {
  // 配置市场概览专用请求头，包含完整的Cookie信息以绕过反爬机制
  const marketHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Referer": "https://quote.eastmoney.com/",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Connection": "keep-alive",
    "Cookie": "st_nvi=vtAWVtcYZaXPSnJ5smQWyee8f; nid18=0117faaefa66226d01f9d326a1ca25b7; nid18_create_time=1769109464029; gviem=phGjENtLD8H7covzMLBe44bf4; gviem_create_time=1769109464029; qgqp_b_id=a607e2f3fa7a44ed505352e4b0095b40; AUTH_FUND.EASTMONEY.COM_GSJZ=AUTH*TTJJ*TOKEN; EMFUND0=03-26%2021%3A58%3A12@%23%24%u62DB%u5546%u4E2D%u8BC1800%u6307%u6570%u589E%u5F3AA@%23%24016276; EMFUND1=03-26%2021%3A59%3A49@%23%24%u535A%u65F6%u4E0A%u8BC1%u79D1%u521B%u677F%u4EBA%u5DE5%u667A%u80FDETF%u53D1%u8D77%u5F0F%u8054%u63A5C@%23%24023521; EMFUND2=03-26%2023%3A07%3A15@%23%24%u5EFA%u4FE1%u6CAA%u6DF1300%u7EA2%u5229ETF%u8054%u63A5A@%23%24012712; EMFUND3=03-27%2000%3A27%3A55@%23%24%u5357%u65B9%u6807%u666E%u7EA2%u5229%u4F4E%u6CE250ETF%u8054%u63A5A@%23%24008163; EMFUND5=03-27%2000%3A44%3A39@%23%24%u94F6%u534E%u96C6%u6210%u7535%u8DEF%u6DF7%u5408C@%23%24013841; EMFUND6=03-27%2001%3A22%3A15@%23%24%u5357%u65B9%u6709%u8272%u91D1%u5C5EETF%u8054%u63A5C@%23%24004433; EMFUND7=03-27%2001%3A23%3A05@%23%24%u5E7F%u53D1%u4E2D%u8BC1%u519B%u5DE5ETF%u8054%u63A5A@%23%24003017; EMFUND9=03-31%2001%3A09%3A27@%23%24%u5609%u5B9E%u6E2F%u80A1%u901A%u65B0%u7ECF%u6D4E%u6307%u6570C@%23%24006614; st_si=68587094849594; EMFUND8=03-31%2001%3A16%3A41@%23%24%u534E%u590F%u6210%u957F%u6DF7%u5408@%23%24000001; rskey=FVkG9WjdXaHFYRGZkdktlVFZQV1k3cEMrUT09QM1Jx; fullscreengg=1; fullscreengg2=1; st_asi=delete; EMFUND4=03-31 23:59:43@#$%u56FD%u6CF0%u56FD%u8BC1%u98DF%u54C1%u996E%u6599%u884C%u4E1A%28LOF%29A@%23%24160222; st_pvi=15644928882968; st_sp=2026-02-01%2002%3A42%3A23; st_inirUrl=https%3A%2F%2Fwww.eastmoney.com%2F; st_sn=20; st_psi=20260401000409600-113200301201-8469126079"
  };
  
  // 发送请求获取上证指数和深证成指行情数据并返回结果
  return await fetchApi(
    `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&fields=f1,f2,f3,f4,f6,f12,f13,f104,f105,f106&_=${Date.now()}`,
    "市场概览接口 - 上证指数和深证成指",
    marketHeaders
  );
}

/**
 * 行业板块资金流向接口
 * 测试获取行业板块的资金流向数据
 * 使用东方财富行业板块资金流向接口：https://data.eastmoney.com/dataapi/bkzj/getbkzj
 * 参数说明：
 * - key: 资金流向类型（f62=主力净流入, f63=超大单净流入, f64=大单净流入, f65=中单净流入）
 * - code: 板块代码（m:90+s:2=申万行业, m:90+s:3=行业板块, m:90+s:4=概念板块）
 */
async function testSectorCapitalFlow() {
  // 配置行业板块资金流向专用请求头，包含完整的Cookie信息以绕过反爬机制
  const sectorHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Referer": "https://data.eastmoney.com/bkds/",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Connection": "keep-alive",
    "Cookie": "st_nvi=vtAWVtcYZaXPSnJ5smQWyee8f; nid18=0117faaefa66226d01f9d326a1ca25b7; nid18_create_time=1769109464029; gviem=phGjENtLD8H7covzMLBe44bf4; gviem_create_time=1769109464029; qgqp_b_id=a607e2f3fa7a44ed505352e4b0095b40; AUTH_FUND.EASTMONEY.COM_GSJZ=AUTH*TTJJ*TOKEN; EMFUND0=03-26%2021%3A58%3A12@%23%24%u62DB%u5546%u4E2D%u8BC1800%u6307%u6570%u589E%u5F3AA@%23%24016276; EMFUND1=03-26%2021%3A59%3A49@%23%24%u535A%u65F6%u4E0A%u8BC1%u79D1%u521B%u677F%u4EBA%u5DE5%u667A%u80FDETF%u53D1%u8D77%u5F0F%u8054%u63A5C@%23%24023521; EMFUND2=03-26%2023%3A07%3A15@%23%24%u5EFA%u4FE1%u6CAA%u6DF1300%u7EA2%u5229ETF%u8054%u63A5A@%23%24012712; EMFUND3=03-27%2000%3A27%3A55@%23%24%u5357%u65B9%u6807%u666E%u7EA2%u5229%u4F4E%u6CE250ETF%u8054%u63A5A@%23%24008163; EMFUND5=03-27%2000%3A44%3A39@%23%24%u94F6%u534E%u96C6%u6210%u7535%u8DEF%u6DF7%u5408C@%23%24013841; EMFUND6=03-27%2001%3A22%3A15@%23%24%u5357%u65B9%u6709%u8272%u91D1%u5C5EETF%u8054%u63A5C@%23%24004433; EMFUND7=03-27%2001%3A23%3A05@%23%24%u5E7F%u53D1%u4E2D%u8BC1%u519B%u5DE5ETF%u8054%u63A5A@%23%24003017; EMFUND9=03-31%2001%3A09%3A27@%23%24%u5609%u5B9E%u6E2F%u80A1%u901A%u65B0%u7ECF%u6D4E%u6307%u6570C@%23%24006614; st_si=68587094849594; EMFUND8=03-31%2001%3A16%3A41@%23%24%u534E%u590F%u6210%u957F%u6DF7%u5408@%23%24000001; rskey=FVkG9WjdXaHFYRGZkdktlVFZQV1k3cEMrUT09QM1Jx; fullscreengg=1; fullscreengg2=1; st_asi=delete; EMFUND4=03-31 23:59:43@#$%u56FD%u6CF0%u56FD%u8BC1%u98DF%u54C1%u996E%u6599%u884C%u4E1A%28LOF%29A@%23%24160222; st_pvi=15644928882968; st_sp=2026-02-01%2002%3A42%3A23; st_inirUrl=https%3A%2F%2Fwww.eastmoney.com%2F; st_sn=20; st_psi=20260401000409600-113200301201-8469126079"
  };
  
  // 测试主力净流入（f62）
  const result1 = await fetchApi(
    `https://data.eastmoney.com/dataapi/bkzj/getbkzj?key=f62&code=${encodeURIComponent("m:90+s:2")}`,
    "行业板块资金流向接口 - 申万行业主力净流入",
    sectorHeaders
  );
  
  // 测试超大单净流入（f63）
  await fetchApi(
    `https://data.eastmoney.com/dataapi/bkzj/getbkzj?key=f63&code=${encodeURIComponent("m:90+s:2")}`,
    "行业板块资金流向接口 - 申万行业超大单净流入",
    sectorHeaders
  );
  
  return result1;
}

// ==============================================
// 4. 搜索和查询接口 (Search APIs)
// ==============================================

/**
 * 基金搜索接口
 * 测试基金搜索功能，支持按名称和代码搜索
 * 使用东方财富基金搜索接口：https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx
 * 参数说明：
 * - m: 搜索类别（1表示搜基金）
 * - key: 搜索关键字（基金名称或代码）
 * - _: 时间戳，防止缓存
 */
async function testFundSearch() {
  // 测试搜索易方达基金并返回第一个结果
  const result1 = await fetchApi(
    "https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=易方达&_=1642000000000",
    "基金搜索 - 搜索易方达基金",
  );
  
  // 测试按基金代码搜索
  await fetchApi(
    "https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=004433&_=1642000000000",
    "基金搜索 - 基金代码",
  );
  
  return result1;
}

/**
 * 基金估算净值列表接口
 * 测试获取基金估算净值列表数据，支持不同基金类型和排序方式
 * 使用东方财富基金估算净值接口：https://api.fund.eastmoney.com/FundGuZhi/GetFundGZList
 * 参数说明：
 * - type: 基金类型（5=指数型基金, 25=股票型基金）
 * - sort: 排序字段（1=按估算涨幅排序）
 * - orderType: 排序方向（asc=升序, desc=降序）
 * - pageIndex/pageSize: 分页参数
 */
async function testFundGZList() {
  // 测试获取指数型基金数据并返回结果
  const result1 = await fetchApi(
    "https://api.fund.eastmoney.com/FundGuZhi/GetFundGZList?type=5&sort=1&orderType=asc&canbuy=0&pageIndex=1&pageSize=10",
    "基金估算净值列表 - 指数型基金按估算涨幅升序",
  );

  // 测试获取股票型基金数据
  await fetchApi(
    "https://api.fund.eastmoney.com/FundGuZhi/GetFundGZList?type=25&sort=1&orderType=desc&canbuy=0&pageIndex=1&pageSize=5",
    "基金估算净值列表 - 股票型基金按估算涨幅降序",
  );
  
  return result1;
}

/**
 * 基金排行接口
 * 测试获取基金排行榜数据
 * 使用东方财富基金排行接口：https://fund.eastmoney.com/data/rankhandler.aspx
 * 参数说明：
 * - op: 操作类型（ph=排行）
 * - dt: 数据类型（kf=开放基金）
 * - ft: 基金类型（zs=指数型）
 * - sc: 排序字段（1nzf=近一年涨幅）
 * - st: 排序方向（desc=降序）
 * - sd/ed: 起止日期
 * - pi/pn: 分页参数
 */
async function testFundMNRank() {
  // 发送请求获取基金排行数据并返回结果
  return await fetchApi(
    "https://fund.eastmoney.com/data/rankhandler.aspx?op=ph&dt=kf&ft=zs&rs=&gs=0&sc=1nzf&st=desc&sd=2025-03-31&ed=2026-03-31&qdii=|&tabSubtype=,,,,,&pi=1&pn=50&dx=1&v=0.012092155296976492",
    "基金排行 - 指数型基金按近一年涨幅降序",
  );
}

/**
 * 基金基础信息接口（移动端API）
 * 测试获取基金详细基础信息
 * 使用东方财富移动端API：https://fundmobapi.eastmoney.com/FundMApi/FundBaseTypeInformation.ashx
 * 参数说明：
 * - FCODE: 基金代码（580007 表示东吴安享量化混合）
 * - deviceid/plat/product/version: 移动端设备参数
 */
async function testFundBaseTypeInformation() {
  // 发送请求获取基金基础信息数据并返回结果
  return await fetchApi(
    "https://fundmobapi.eastmoney.com/FundMApi/FundBaseTypeInformation.ashx?FCODE=580007&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
    "基金基础信息 - 东吴安享量化混合（移动端API）",
  );
}

/**
 * 基金累计业绩接口
 * 测试获取基金累计业绩数据，支持不同时间范围
 * 使用第三方基金数据接口：https://dataapi.1234567.com.cn/dataapi/fund/FundVPageAcc
 * 参数说明：
 * - INDEXCODE: 基准指数代码（000300 表示沪深300）
 * - CODE/FCODE: 基金代码（004433 表示南方有色金属ETF联接C）
 * - RANGE: 时间范围（y=近一年, 3m=近3月, 6m=近6月, 1y=近1年, 3y=近3年）
 * - deviceid/product: 设备和产品参数
 */
async function testFundAccumulatedPerformance() {
  // 测试默认时间范围（近一年）
  const result1 = await fetchApi(
    "https://dataapi.1234567.com.cn/dataapi/fund/FundVPageAcc?INDEXCODE=000300&CODE=004433&FCODE=004433&RANGE=y&deviceid=Wap&product=EFund",
    "基金累计业绩接口 - 南方有色金属ETF联接C（近一年）",
  );
  
  // 测试不同时间范围
  await fetchApi(
    "https://dataapi.1234567.com.cn/dataapi/fund/FundVPageAcc?INDEXCODE=000300&CODE=004433&FCODE=004433&RANGE=3m&deviceid=Wap&product=EFund",
    "基金累计业绩接口 - 南方有色金属ETF联接C（近3月）",
  );
  
  await fetchApi(
    "https://dataapi.1234567.com.cn/dataapi/fund/FundVPageAcc?INDEXCODE=000300&CODE=004433&FCODE=004433&RANGE=1y&deviceid=Wap&product=EFund",
    "基金累计业绩接口 - 南方有色金属ETF联接C（近1年）",
  );
  
  return result1;
}

/**
 * 基金经理列表接口
 * 测试获取基金经理信息列表
 * 使用东方财富移动端API：https://fundmobapi.eastmoney.com/FundMApi/FundManagerList.ashx
 * 参数说明：
 * - FCODE: 基金代码（004433 表示南方有色金属ETF联接C）
 * - deviceid/plat/product/version: 移动端设备参数
 * - Uid: 用户ID（留空）
 * - _: 时间戳，防止缓存
 */
async function testFundManagerList() {
  // 测试基金经理列表接口并返回结果
  return await fetchApi(
    "https://fundmobapi.eastmoney.com/FundMApi/FundManagerList.ashx?FCODE=004433&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=&_=1642000000000",
    "基金经理列表 - 南方有色金属ETF联接C",
  );
}

// ==============================================
// 5. 工具接口 (Utility APIs)
// ==============================================

/**
 * 汇率查询接口
 * 测试获取美元兑人民币汇率数据
 * 使用汇率查询接口：https://webapi.huilv.cc/api/exchange
 * 参数说明：
 * - num: 兑换数量（100美元）
 * - chiyouhuobi: 持有货币（USD=美元）
 * - duihuanhuobi: 兑换货币（CNY=人民币）
 * - type: 汇率类型（1=现汇买入价）
 * - callback: JSONP回调函数名
 */
async function testExchangeRate() {
  // 发送请求获取美元兑人民币汇率数据并返回结果
  return await fetchApi(
    "https://webapi.huilv.cc/api/exchange?num=100&chiyouhuobi=USD&duihuanhuobi=CNY&type=1&callback=jisuanjieguo",
    "汇率查询接口 - 美元兑人民币",
  );
}

// ==============================================
// 主函数
// ==============================================

/**
 * 运行所有测试函数
 * 根据测试类型分组运行不同的测试函数
 */
async function runTests() {
  console.log("开始运行API接口测试...");
  
  // 运行股票相关接口测试
  console.log("\n" + "=".repeat(60));
  console.log("股票相关接口测试");
  console.log("=".repeat(60));
  await testStockRealTime();
  await testStockKline();
  await testStockMinute();
  await testStockOrderBook();
  
  // 运行基金相关接口测试
  console.log("\n" + "=".repeat(60));
  console.log("基金相关接口测试");
  console.log("=".repeat(60));
  await testFundRealTime();
  await testFundNetDiagram();
  await testFundHoldings();
  await testFundCompanyInfo();
  await testFundCompanyMapping();
  await testFundYieldDiagramNew();
  await testFundNetList();
  await testFundInverstPositionNew();
  
  // 运行市场数据接口测试
  console.log("\n" + "=".repeat(60));
  console.log("市场数据接口测试");
  console.log("=".repeat(60));
  await testMarketFundFlow();
  await testNorthFund();
  await testNorthboundCapital();
  await testUpDownDistribution();
  await testMarketOverview();
  await testSectorCapitalFlow();
  
  // 运行搜索和查询接口测试
  console.log("\n" + "=".repeat(60));
  console.log("搜索和查询接口测试");
  console.log("=".repeat(60));
  await testFundSearch();
  await testFundGZList();
  await testFundMNRank();
  await testFundBaseTypeInformation();
  await testFundAccumulatedPerformance();
  await testFundManagerList();
  
  // 运行工具接口测试
  console.log("\n" + "=".repeat(60));
  console.log("工具接口测试");
  console.log("=".repeat(60));
  await testExchangeRate();
  
  console.log("\n" + "=".repeat(60));
  console.log("所有测试完成！");
  console.log("=".repeat(60));
}

// 运行测试
runTests().catch(console.error);