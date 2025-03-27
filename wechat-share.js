// 微信分享SDK组件
const WechatShare = {
  // 初始化
  init(options) {
    // 默认配置
    this.config = {
      debug: false,
      appId: '', // 必填，公众号的唯一标识
      timestamp: '', // 必填，生成签名的时间戳
      nonceStr: '', // 必填，生成签名的随机串
      signature: '', // 必填，签名
      jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'], // 必填，需要使用的JS接口列表
      ...options
    };
    
    // 分享内容
    this.shareData = {
      title: '测测你的育儿力指数', // 分享标题
      desc: '我已获得【高级育儿师】称号，快来试试！', // 分享描述
      link: window.location.href, // 分享链接，默认为当前页面链接
      imgUrl: '', // 分享图标
      ...options.shareData
    };
    
    // 加载微信JSSDK
    this.loadScript();
  },
  
  // 加载微信JSSDK脚本
  loadScript() {
    if (typeof wx !== 'undefined') {
      this.configWechat();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
    script.onload = () => {
      this.configWechat();
    };
    script.onerror = (error) => {
      console.error('微信JSSDK加载失败:', error);
      // 尝试备用地址
      const backupScript = document.createElement('script');
      backupScript.src = 'https://res2.wx.qq.com/open/js/jweixin-1.6.0.js';
      backupScript.onload = () => {
        this.configWechat();
      };
      backupScript.onerror = (error) => {
        console.error('微信JSSDK备用地址加载失败:', error);
      };
      document.head.appendChild(backupScript);
    };
    document.head.appendChild(script);
  },
  
  // 配置微信JSSDK
  configWechat() {
    if (typeof wx === 'undefined') {
      console.error('微信JSSDK未加载');
      return;
    }
    
    wx.config(this.config);
    
    wx.ready(() => {
      this.setShareInfo();
      console.log('微信JSSDK配置成功');
    });
    
    wx.error((res) => {
      console.error('微信JSSDK配置失败:', res);
    });
  },
  
  // 设置分享信息
  setShareInfo() {
    // 自定义"分享给朋友"及"分享到QQ"按钮的分享内容
    wx.updateAppMessageShareData({ 
      title: this.shareData.title,
      desc: this.shareData.desc,
      link: this.shareData.link,
      imgUrl: this.shareData.imgUrl,
      success: () => {
        console.log('设置分享给朋友成功');
      }
    });
    
    // 自定义"分享到朋友圈"及"分享到QQ空间"按钮的分享内容
    wx.updateTimelineShareData({ 
      title: this.shareData.title,
      link: this.shareData.link,
      imgUrl: this.shareData.imgUrl,
      success: () => {
        console.log('设置分享到朋友圈成功');
      }
    });
  },
  
  // 更新分享内容
  updateShareInfo(shareData) {
    this.shareData = {
      ...this.shareData,
      ...shareData
    };
    
    if (typeof wx !== 'undefined') {
      wx.ready(() => {
        this.setShareInfo();
      });
    }
  }
};

// 导出组件
window.WechatShare = WechatShare;
