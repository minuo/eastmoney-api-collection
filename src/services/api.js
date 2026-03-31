const headers = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Referer": "https://fund.eastmoney.com/",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  "Connection": "keep-alive"
};

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();
const pendingRequests = new Map();

const getCacheKey = (url) => {
  const cleanUrl = url.replace(/rt=\d+&?/g, '').replace(/_=\d+&?/g, '');
  return cleanUrl;
};

const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('请求超时')), timeout)
    )
  ]);
};

const parseVarRData = (text) => {
  const dataStr = text.replace(/^var r =/, '').replace(/;$/, '');
  
  const parseArray = (str) => {
    const result = [];
    let i = 0;
    let current = '';
    let inString = false;
    let stringChar = '';
    let depth = 0;
    let inValue = false;
    
    while (i < str.length) {
      const char = str[i];
      
      if (inString) {
        if (char === stringChar && str[i-1] !== '\\') {
          inString = false;
          current += char;
        } else {
          current += char;
        }
        i++;
        continue;
      }
      
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        i++;
        continue;
      }
      
      if (char === '[') {
        if (depth === 0) {
          depth = 1;
          i++;
          continue;
        }
        depth++;
        current += char;
      } else if (char === ']') {
        depth--;
        if (depth === 0) {
          if (current.trim()) {
            result.push(parseValue(current));
          }
          return result;
        }
        current += char;
      } else if (char === ',') {
        if (depth === 1) {
          if (current.trim()) {
            result.push(parseValue(current));
          }
          current = '';
        } else {
          current += char;
        }
      } else {
        current += char;
      }
      i++;
    }
    
    return result;
  };
  
  const parseValue = (str) => {
    str = str.trim();
    
    if (str === '') return '';
    
    if (str.startsWith('"') || str.startsWith("'")) {
      return str.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    
    if (str.startsWith('[')) {
      return parseArray(str);
    }
    
    if (!isNaN(str)) {
      return parseFloat(str);
    }
    
    return str;
  };
  
  return parseArray(dataStr);
};

const fetchApi = async (url, description, customHeaders = null) => {
  const cacheKey = getCacheKey(url);
  
  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
    return cachedEntry.data;
  }
  
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const requestHeaders = customHeaders || headers;
      const response = await fetchWithTimeout(url, { headers: requestHeaders });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      let data = null;
      
      if (text.startsWith('var r =')) {
        try {
          data = parseVarRData(text);
        } catch (e) {
          console.error('解析基金搜索数据失败:', e);
        }
      } else if (text.startsWith('jQuery') || (text.includes('(') && text.includes(')'))) {
        const match = text.match(/\((.*)\)/);
        if (match) {
          try {
            data = JSON.parse(match[1]);
          } catch (e) {
            console.error('JSONP解析失败:', e);
          }
        }
      } else {
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          data = text;
        }
      }
      
      if (data !== null && data !== undefined) {
        cache.set(cacheKey, { data, timestamp: Date.now() });
      }
      
      return data;
    } catch (error) {
      console.error(`请求失败: ${description}`, error);
      return null;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();
  
  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export const api = {
  getStockRealTime: async (secid) => {
    const url = `/api/push2/api/qt/ulist/get?secids=${secid}&ut=bd1d9ddb04089700cf9c27f6f7426281&fields=f1,f2,f3,f4,f12,f13,f14,f62,f128,f136,f169,f170,f171&pi=0&pz=20&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:1+s:2&rt=${Date.now()}`;
    return await fetchApi(url, '股票实时行情');
  },

  getStockKline: async (secid, klt = 103, fqt = 1) => {
    const url = `/api/push2his/api/qt/stock/kline/get?cb=jQuery351029190319602936143_${Date.now()}&secid=${secid}&ut=fa5fd1943c7b386f172d6893dbfba10b&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${klt}&fqt=${fqt}&end=20500101&lmt=120&_=${Date.now()}`;
    return await fetchApi(url, '股票K线数据');
  },

  getFundRealTime: async (code) => {
    const url = `/api/fundgz/js/${code}.js`;
    return await fetchApi(url, '基金实时净值');
  },

  getFundHistoryNet: async (code) => {
    const url = `/api/fund/f10/F10DataApi.aspx?type=lsjz&code=${code}&page=1&per=20`;
    return await fetchApi(url, '基金历史净值');
  },

  getFundHoldings: async (code) => {
    const url = `/api/fundmobapi/FundMNewApi/FundMNInverstPosition?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
    return await fetchApi(url, '基金持仓股票');
  },

  getFundCompanyInfo: async () => {
    const url = '/api/fund/api/static/FundCommpanyInfo.js';
    return await fetchApi(url, '基金公司信息');
  },

  getFundCompanyMapping: async () => {
    const url = `/api/fund/js/jjjz_gs.js?dt=${Date.now()}`;
    return await fetchApi(url, '基金公司映射表');
  },

  getFundYieldDiagram: async (code, range = 'y') => {
    const url = `/api/fundmobapi/FundMNewApi/FundMNIntelligentNavTrend?FCODE=${code}&RANGE=${range}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
    return await fetchApi(url, '基金收益率图表');
  },

  getFundNetList: async (code) => {
    const url = `/api/fundmobapi/FundMApi/FundNetList.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&appType=ttjj`;
    return await fetchApi(url, '基金净值列表');
  },

  getFundInverstPositionNew: async (code) => {
    const url = `/api/fundmobapi/FundMApi/FundInverstPositionNew.ashx?FCODE=${code}&deviceid=Wap&plat=Android&product=EFund&version=6.2.4&appType=ttjj`;
    return await fetchApi(url, '基金持仓新接口');
  },

  getMarketFundFlow: async () => {
    const url = `/api/push2/api/qt/clist/get?pn=1&pz=50&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f19,f20,f21,f23,f24,f25,f26,f22,f33,f11,f62,f128,f136,f115,f152,f161,f4&rt=${Date.now()}`;
    return await fetchApi(url, '大盘资金流向');
  },

  getNorthFund: async () => {
    const url = `/api/push2/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65&rt=${Date.now()}`;
    return await fetchApi(url, '北向资金');
  },

  getNorthboundCapital: async () => {
    const url = `/api/data/zjlx/list/dzjlxh.html?rt=${Date.now()}`;
    return await fetchApi(url, '北向资金分时数据');
  },

  getUpDownDistribution: async () => {
    const url = `/api/push2/api/qt/clist/get?pn=1&pz=50&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f19,f20,f21,f23,f24,f25,f26,f22,f33,f11,f62,f128,f136,f115,f152,f161,f4&rt=${Date.now()}`;
    return await fetchApi(url, '涨跌分布');
  },

  getMarketOverview: async () => {
    const url = `/api/push2/api/qt/ulist/get?secids=1.000001,0.399001,0.399006&ut=bd1d9ddb04089700cf9c27f6f7426281&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f26,f22,f33,f11,f62,f128,f136,f115,f152,f161,f4&pi=0&pz=20&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:1+s:2&rt=${Date.now()}`;
    return await fetchApi(url, '市场概览');
  },

  getSectorCapitalFlow: async () => {
    const url = `/api/push2/api/qt/clist/get?pn=1&pz=50&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f19,f20,f21,f23,f24,f25,f26,f22,f33,f11,f62,f128,f136,f115,f152,f161,f4&rt=${Date.now()}`;
    return await fetchApi(url, '行业板块资金流向');
  },

  getFundSearch: async (keyword) => {
    const url = `/api/fund/js/fundcode_search.js?rt=${Date.now()}`;
    return await fetchApi(url, '基金搜索');
  },

  getFundNameByCode: async (code) => {
    try {
      const searchData = await api.getFundSearch();
      if (searchData && Array.isArray(searchData)) {
        const fund = searchData.find(item => item[0] === code);
        return fund ? fund[2] : null;
      }
      return null;
    } catch (e) {
      console.error('获取基金名称失败:', e);
      return null;
    }
  },

  getFundGZList: async () => {
    const url = `/api/fund/Data/Fund_JJJZ_Data.aspx?t=1&lx=1&letter=&gsid=&text=&sort=zdf,desc&page=1,200&dt=${Date.now()}&atfc=&onlySale=0`;
    return await fetchApi(url, '基金估算净值列表');
  },

  getFundMNRank: async () => {
    const url = '/api/fundmobapi/FundMNewApi/FundMNNetNewList?deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&PageIndex=1&PageSize=20&Sort=3&SortType=desc&FundType=%e4%b8%8d%e9%99%90%e9%80%89%e6%8b%a5%e4%ba%8c%e7%b1%bb&FundCompany=&SECode=';
    return await fetchApi(url, '基金排行');
  },

  getFundBaseTypeInformation: async (code) => {
    const url = `/api/fundmobapi/FundMApi/FundBaseTypeInformation.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0`;
    return await fetchApi(url, '基金基础信息');
  },

  getFundAccumulatedPerformance: async (code, indexCode = '000300', range = 'y') => {
    const url = `/api/dataapi/dataapi/fund/FundVPageAcc?INDEXCODE=${indexCode}&CODE=${code}&FCODE=${code}&RANGE=${range}&deviceid=Wap&product=EFund`;
    return await fetchApi(url, '基金累计业绩');
  },

  getFundManagerList: async (code) => {
    const url = `/api/fundmobapi/FundMApi/FundManagerList.ashx?FCODE=${code}&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0&Uid=&_=${Date.now()}`;
    return await fetchApi(url, '基金经理列表');
  },

  getExchangeRate: async () => {
    const url = '/api/huilv/api/exchange?num=100&chiyouhuobi=USD&duihuanhuobi=CNY&type=1&callback=jisuanjieguo';
    return await fetchApi(url, '汇率查询');
  }
};

export const majorIndices = [
  { secid: '1.000001', name: '上证指数', code: '000001' },
  { secid: '0.399001', name: '深证成指', code: '399001' },
  { secid: '0.399006', name: '创业板指', code: '399006' },
  { secid: '1.000300', name: '沪深300', code: '000300' },
  { secid: '0.399005', name: '中小板指', code: '399005' }
];
