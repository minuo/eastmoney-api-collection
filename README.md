# eastmoney-api-collection

东方财富金融数据API接口集合测试工具

## 项目简介

这是一个全面的东方财富金融数据API接口测试工具，包含股票、基金、市场数据、搜索查询等多种金融数据接口的测试用例。项目按照功能模块进行分组，便于管理和使用。

## 功能特性

- **股票数据接口测试**：实时行情、K线数据、分时数据、买卖盘数据
- **基金数据接口测试**：实时净值、历史净值、持仓数据、公司信息、收益率图表
- **市场数据接口测试**：大盘资金流向、北向资金、涨跌分布、市场概览、行业板块资金流向
- **搜索查询接口测试**：基金搜索、净值列表、基金排行、基础信息、累计业绩、基金经理列表
- **工具接口测试**：汇率查询

## 使用方法

1. 克隆仓库到本地
2. 运行测试文件：`node eastmoney-api.js`

## 接口列表

### 股票相关接口 (4个)
- `testStockRealTime` - 股票实时行情接口
- `testStockKline` - 股票K线数据接口
- `testStockMinute` - 股票分时数据接口
- `testStockOrderBook` - 股票买卖盘数据接口

### 基金相关接口 (8个)
- `testFundRealTime` - 基金实时净值接口
- `testFundHistoryNet` - 基金历史净值接口
- `testFundHoldings` - 基金持仓股票接口
- `testFundCompanyInfo` - 基金公司信息接口
- `testFundCompanyMapping` - 基金公司映射表接口
- `testFundYieldDiagramNew` - 基金收益率图表接口
- `testFundNetList` - 基金净值列表接口
- `testFundInverstPositionNew` - 基金持仓新接口

### 市场数据接口 (6个)
- `testMarketFundFlow` - 大盘资金流向接口
- `testNorthFund` - 北向资金接口
- `testNorthboundCapital` - 北向资金分时数据接口
- `testUpDownDistribution` - 涨跌分布数据接口
- `testMarketOverview` - 市场概览数据接口
- `testSectorCapitalFlow` - 行业板块资金流向接口

### 搜索和查询接口 (6个)
- `testFundSearch` - 基金搜索接口
- `testFundGZList` - 基金估算净值列表接口
- `testFundMNRank` - 基金排行接口
- `testFundBaseTypeInformation` - 基金基础信息接口
- `testFundAccumulatedPerformance` - 基金累计业绩接口
- `testFundManagerList` - 基金经理列表接口

### 工具接口 (1个)
- `testExchangeRate` - 汇率查询接口

## 注意事项

- 部分接口可能需要特定的请求头才能正常访问
- 请遵守东方财富网站的使用条款和数据政策
- 建议不要频繁请求，避免触发反爬机制
- 接口参数可能会随时间变化，请定期检查接口可用性

## 许可证

MIT License