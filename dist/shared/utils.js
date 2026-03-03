"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStockProfit = calculateStockProfit;
exports.calculateFundProfit = calculateFundProfit;
exports.calculateGroupProfit = calculateGroupProfit;
exports.formatPercent = formatPercent;
exports.formatCurrency = formatCurrency;
exports.formatTime = formatTime;
exports.generateId = generateId;
exports.isValidStockSymbol = isValidStockSymbol;
exports.isValidFundCode = isValidFundCode;
//股票收益计算
function calculateStockProfit(stock, currentPrice) {
    const cost = stock.costPrice * stock.quantity;
    const marketValue = currentPrice * stock.quantity;
    const profit = marketValue - cost;
    const profitRate = cost !== 0 ? profit / cost : 0;
    return {
        cost,
        marketValue,
        profit,
        profitRate
    };
}
//基金收益计算
function calculateFundProfit(fund, currentNav) {
    const cost = fund.costNav * fund.shares;
    const marketValue = currentNav * fund.shares;
    const profit = marketValue - cost;
    const profitRate = cost !== 0 ? profit / cost : 0;
    return {
        cost,
        marketValue,
        profit,
        profitRate
    };
}
//分组收益汇总计算
function calculateGroupProfit(positions) {
    const totalCost = positions.reduce((sum, pos) => sum + pos.profit.cost, 0);
    const totalMarketValue = positions.reduce((sum, pos) => sum + pos.profit.marketValue, 0);
    const totalProfit = totalMarketValue - totalCost;
    const totalProfitRate = totalCost !== 0 ? totalProfit / totalCost : 0;
    return {
        cost: totalCost,
        marketValue: totalMarketValue,
        profit: totalProfit,
        profitRate: totalProfitRate
    };
}
//格化百分比显示
function formatPercent(rate) {
    if (isNaN(rate) || !isFinite(rate))
        return '0.00%';
    return `${(rate * 100).toFixed(2)}%`;
}
// 格式化金额显示
function formatCurrency(amount) {
    if (isNaN(amount))
        return '0.00';
    return amount.toFixed(2);
}
// 格式化时间显示
function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN');
}
// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
//验证股票代码格式
function isValidStockSymbol(symbol) {
    //支持A股代码格式（如：000001, 600000, 300001等）
    return /^[0-9]{6}$/.test(symbol);
}
//验证基金代码格式
function isValidFundCode(code) {
    //支持基金代码格式
    return /^[0-9]{6}$/.test(code);
}
