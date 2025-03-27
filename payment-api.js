/**
 * 支付宝API集成服务
 * 提供支付创建、查询和验证功能
 */
class AlipayService {
    constructor(config = {}) {
        // 商户配置信息
        this.config = {
            appId: config.appId || '2021000000000000', // 默认为测试appId
            privateKey: config.privateKey || 'your_private_key',
            alipayPublicKey: config.alipayPublicKey || 'alipay_public_key',
            gateway: 'https://openapi.alipay.com/gateway.do',
            ...config
        };
        
        // 订单存储
        this.orders = {};
        
        // 轮询配置
        this.pollingInterval = 3000; // 3秒轮询一次
        this.maxPollingAttempts = 10; // 最多轮询10次
    }
    
    /**
     * 创建支付订单
     * @param {Object} orderInfo - 订单信息
     * @returns {Promise<Object>} - 订单详情
     */
    async createOrder(orderInfo) {
        // 生成唯一订单号
        const orderId = 'ALI' + Date.now() + Math.floor(Math.random() * 1000);
        
        // 创建订单对象
        const order = {
            orderId: orderId,
            amount: orderInfo.amount || 9.90,
            subject: orderInfo.subject || '儿童发育评估完整报告',
            status: 'pending',
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            metadata: orderInfo.metadata || {}
        };
        
        // 存储订单
        this.orders[orderId] = order;
        
        // 模拟API调用延迟
        await this._simulateNetworkDelay();
        
        // 返回订单信息
        return {
            orderId: order.orderId,
            amount: order.amount,
            subject: order.subject,
            qrCodeUrl: '1742965101857.jpg', // 使用静态二维码
            status: order.status
        };
    }
    
    /**
     * 查询订单状态
     * @param {string} orderId - 订单ID
     * @returns {Promise<Object>} - 订单状态
     */
    async queryOrder(orderId) {
        // 模拟API调用延迟
        await this._simulateNetworkDelay();
        
        // 检查订单是否存在
        if (!this.orders[orderId]) {
            throw new Error('订单不存在');
        }
        
        // 获取订单
        const order = this.orders[orderId];
        
        // 返回订单状态
        return {
            orderId: order.orderId,
            status: order.status,
            amount: order.amount,
            subject: order.subject,
            createTime: order.createTime,
            updateTime: order.updateTime
        };
    }
    
    /**
     * 开始轮询订单状态
     * @param {string} orderId - 订单ID
     * @param {Function} onStatusChange - 状态变化回调
     * @param {Function} onSuccess - 成功回调
     * @param {Function} onError - 错误回调
     * @param {Function} onTimeout - 超时回调
     * @returns {Object} - 轮询控制器
     */
    startPolling(orderId, onStatusChange, onSuccess, onError, onTimeout) {
        let attempts = 0;
        let pollingStopped = false;
        
        // 创建轮询控制器
        const controller = {
            stop: () => {
                pollingStopped = true;
                if (controller.intervalId) {
                    clearInterval(controller.intervalId);
                    controller.intervalId = null;
                }
            }
        };
        
        // 轮询函数
        const poll = async () => {
            if (pollingStopped) return;
            
            attempts++;
            
            try {
                // 调用状态变化回调
                if (onStatusChange) {
                    onStatusChange({
                        attempt: attempts,
                        maxAttempts: this.maxPollingAttempts,
                        orderId: orderId
                    });
                }
                
                // 模拟订单状态变化
                // 在真实环境中，这里应该调用支付宝API查询订单状态
                await this._simulateOrderStatusChange(orderId);
                
                // 查询订单状态
                const orderStatus = await this.queryOrder(orderId);
                
                // 如果订单已支付成功
                if (orderStatus.status === 'success') {
                    controller.stop();
                    if (onSuccess) {
                        onSuccess(orderStatus);
                    }
                    return;
                }
                
                // 如果订单已失败
                if (orderStatus.status === 'failed') {
                    controller.stop();
                    if (onError) {
                        onError(new Error('支付失败'), orderStatus);
                    }
                    return;
                }
                
                // 如果达到最大尝试次数
                if (attempts >= this.maxPollingAttempts) {
                    controller.stop();
                    if (onTimeout) {
                        onTimeout(new Error('支付验证超时'), orderStatus);
                    }
                    return;
                }
            } catch (error) {
                if (onError) {
                    onError(error);
                }
            }
        };
        
        // 立即执行一次
        poll();
        
        // 设置定时器
        controller.intervalId = setInterval(poll, this.pollingInterval);
        
        return controller;
    }
    
    /**
     * 模拟网络延迟
     * @private
     * @returns {Promise<void>}
     */
    async _simulateNetworkDelay() {
        const delay = 300 + Math.random() * 700; // 300-1000ms随机延迟
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    /**
     * 模拟订单状态变化
     * @private
     * @param {string} orderId - 订单ID
     * @returns {Promise<void>}
     */
    async _simulateOrderStatusChange(orderId) {
        // 检查订单是否存在
        if (!this.orders[orderId]) {
            throw new Error('订单不存在');
        }
        
        // 获取订单
        const order = this.orders[orderId];
        
        // 计算订单创建时间距现在的秒数
        const createTime = new Date(order.createTime).getTime();
        const now = Date.now();
        const secondsElapsed = (now - createTime) / 1000;
        
        // 模拟订单状态变化逻辑
        // 10秒内订单状态为pending
        // 10-15秒之间随机决定成功或失败（成功率80%）
        // 15秒后如果还是pending则设为失败
        if (secondsElapsed > 15) {
            order.status = 'failed';
        } else if (secondsElapsed > 10) {
            // 80%的概率支付成功
            if (order.status === 'pending' && Math.random() < 0.8) {
                order.status = 'success';
            } else if (order.status === 'pending') {
                order.status = 'failed';
            }
        }
        
        // 更新订单时间
        order.updateTime = new Date().toISOString();
        
        // 存储更新后的订单
        this.orders[orderId] = order;
    }
}

// 导出AlipayService类
window.AlipayService = AlipayService;
