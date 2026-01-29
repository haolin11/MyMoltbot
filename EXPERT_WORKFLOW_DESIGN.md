# 🤝 专家协作完整流程设计

**设计日期**: 2026-01-29  
**版本**: v4.0 Expert Collaboration Edition  
**基于**: UI/UX Pro Max 专业数据库

---

## 🎯 专家协作完整流程

### 流程概述

```
1. 案例匹配
   ↓
2. 查看案例详情
   ↓
3. 申请专家接入（从案例）
   ↓
4. 专家匹配中...
   ↓
5. 查看专家资料 + 报价
   ↓
6. 付费确认
   ↓
7. 专家进入协作
   ↓
8. 聊天窗口沟通
   ↓
9. 专家完成/修改内容
   ↓
10. 验收完成
```

---

## 📋 详细设计

### 1. 案例匹配页面

**位置**: P-CASE_LIBRARY.html

**新增元素**：
```html
<div class="case-card">
  <img src="case-image.jpg" />
  <h3>AI客服系统方案</h3>
  <div class="case-expert-badge">
    <i class="fa-solid fa-user-tie"></i>
    有专家支持
  </div>
  <p>匹配度：95%</p>
  <button class="btn-request-expert">申请专家协助</button>
</div>
```

**特点**：
- 案例卡片显示"有专家支持"徽章
- 匹配度百分比
- "申请专家协助"按钮

---

### 2. 专家申请流程

#### 2.1 点击"申请专家协助"

**弹出Modal**：
```html
<div class="expert-request-modal">
  <div class="modal-header">
    <h2>申请专家协助</h2>
    <button class="close">×</button>
  </div>
  
  <div class="modal-body">
    <!-- 案例信息 -->
    <div class="case-info-card">
      <h4>AI客服系统方案</h4>
      <p>该案例由专家完成，匹配度95%</p>
    </div>
    
    <!-- 匹配中... -->
    <div class="expert-matching">
      <div class="spinner"></div>
      <p>正在为您匹配最合适的专家...</p>
    </div>
  </div>
</div>
```

#### 2.2 专家匹配完成

**显示专家信息**：
```html
<div class="expert-profile-card">
  <div class="expert-header">
    <img src="expert-avatar.jpg" class="avatar" />
    <div class="expert-info">
      <h3>张明 <span class="verified">✓ 认证专家</span></h3>
      <p class="expertise">AI解决方案 · 10年经验</p>
      <div class="expert-stats">
        <span><i class="fa-solid fa-star"></i> 4.9</span>
        <span><i class="fa-solid fa-briefcase"></i> 156个项目</span>
        <span><i class="fa-solid fa-clock"></i> 平均2小时响应</span>
      </div>
    </div>
  </div>
  
  <div class="expert-intro">
    <h4>专家简介</h4>
    <p>专注于AI客服系统设计，曾为多家500强企业提供咨询服务...</p>
  </div>
  
  <div class="pricing-section">
    <h4>服务报价</h4>
    <div class="pricing-options">
      <label class="pricing-option">
        <input type="radio" name="service" checked />
        <div class="option-content">
          <div class="option-title">方案咨询</div>
          <div class="option-price">¥299</div>
          <div class="option-desc">30分钟视频咨询，提供改进建议</div>
        </div>
      </label>
      
      <label class="pricing-option">
        <input type="radio" name="service" />
        <div class="option-content">
          <div class="option-title">方案优化</div>
          <div class="option-price">¥899</div>
          <div class="option-desc">完整优化方案，包含2次修改</div>
        </div>
      </label>
      
      <label class="pricing-option">
        <input type="radio" name="service" />
        <div class="option-content">
          <div class="option-title">深度协作</div>
          <div class="option-price">¥2999</div>
          <div class="option-desc">全程参与，不限次数沟通和修改</div>
        </div>
      </label>
    </div>
  </div>
  
  <div class="modal-footer">
    <button class="btn-cancel">取消</button>
    <button class="btn-confirm-payment">确认付费 ¥299</button>
  </div>
</div>
```

---

### 3. 付费流程

#### 3.1 点击"确认付费"

**支付Modal**：
```html
<div class="payment-modal">
  <div class="payment-header">
    <h3>确认支付</h3>
  </div>
  
  <div class="payment-summary">
    <div class="service-item">
      <span>方案咨询服务</span>
      <span>¥299</span>
    </div>
    <div class="total">
      <span>合计</span>
      <span class="amount">¥299</span>
    </div>
  </div>
  
  <div class="payment-methods">
    <button class="payment-method active">
      <i class="fa-brands fa-alipay"></i>
      支付宝
    </button>
    <button class="payment-method">
      <i class="fa-brands fa-weixin"></i>
      微信支付
    </button>
  </div>
  
  <button class="btn-pay-now">立即支付</button>
</div>
```

#### 3.2 支付完成

**显示成功提示**：
```html
<div class="payment-success">
  <div class="success-icon">✓</div>
  <h3>支付成功</h3>
  <p>专家已接入，即将开始协作</p>
  <button class="btn-start-chat">进入聊天窗口</button>
</div>
```

---

### 4. 聊天窗口设计

**位置**: P-SOLUTION_GENERATOR.html 右侧面板

**新增Tab**："专家协作"

```html
<div class="expert-collaboration-panel">
  <!-- 专家信息条 -->
  <div class="expert-info-bar">
    <img src="expert-avatar.jpg" class="avatar-sm" />
    <div class="expert-name">
      <span>张明</span>
      <span class="status online">在线</span>
    </div>
    <button class="btn-end-session">结束协作</button>
  </div>
  
  <!-- 聊天消息区 -->
  <div class="chat-messages" id="expert-chat">
    <!-- 系统消息 -->
    <div class="message system">
      <div class="message-content">
        专家张明已加入协作。服务时间：30分钟
      </div>
      <div class="message-time">14:32</div>
    </div>
    
    <!-- 专家消息 -->
    <div class="message expert">
      <img src="expert-avatar.jpg" class="message-avatar" />
      <div class="message-bubble">
        <div class="message-author">张明 · 专家</div>
        <div class="message-content">
          您好！我看了您的方案，有几个地方可以优化...
        </div>
        <div class="message-time">14:33</div>
      </div>
    </div>
    
    <!-- 用户消息 -->
    <div class="message user">
      <div class="message-bubble">
        <div class="message-content">
          谢谢！请问RAG部分应该如何改进？
        </div>
        <div class="message-time">14:34</div>
      </div>
    </div>
    
    <!-- 专家操作通知 -->
    <div class="message action">
      <div class="action-card">
        <i class="fa-solid fa-pen-to-square"></i>
        <span>专家正在编辑"系统架构"部分...</span>
      </div>
    </div>
  </div>
  
  <!-- 输入区 -->
  <div class="chat-input-area">
    <textarea 
      placeholder="向专家提问或说明需求..." 
      rows="2"
    ></textarea>
    <div class="chat-actions">
      <button class="btn-attach">
        <i class="fa-solid fa-paperclip"></i>
      </button>
      <button class="btn-send-message">
        <i class="fa-solid fa-paper-plane"></i>
        发送
      </button>
    </div>
  </div>
  
  <!-- 时间提醒 -->
  <div class="time-reminder">
    <i class="fa-solid fa-clock"></i>
    剩余时间：23分钟
  </div>
</div>
```

---

### 5. 专家编辑内容

#### 5.1 专家请求编辑权限

**聊天窗口显示**：
```html
<div class="message expert">
  <div class="message-bubble">
    <div class="message-content">
      我想帮您优化"系统架构"这部分内容，可以吗？
    </div>
    <div class="permission-request">
      <p>专家请求编辑权限：</p>
      <div class="section-name">系统架构</div>
      <div class="request-actions">
        <button class="btn-deny">拒绝</button>
        <button class="btn-approve">允许编辑</button>
      </div>
    </div>
  </div>
</div>
```

#### 5.2 用户批准后

**文档区域显示**：
```html
<div class="expert-editing-indicator">
  <div class="indicator-bar">
    <img src="expert-avatar.jpg" class="avatar-xs" />
    <span>专家张明正在编辑此部分</span>
    <button class="btn-watch">查看</button>
  </div>
</div>

<!-- 编辑的section被高亮 -->
<section class="cp-section editing-by-expert">
  <div class="editing-overlay">
    <div class="editing-message">
      <i class="fa-solid fa-user-pen"></i>
      专家正在编辑...
    </div>
  </div>
  <!-- 原内容被lock -->
</section>
```

#### 5.3 专家完成编辑

**聊天窗口通知**：
```html
<div class="message system">
  <div class="completion-card">
    <div class="completion-header">
      <i class="fa-solid fa-check-circle text-success"></i>
      <span>专家已完成编辑</span>
    </div>
    <div class="completion-section">
      <div class="section-name">系统架构</div>
      <div class="changes-summary">
        新增2段内容，优化3处描述
      </div>
    </div>
    <div class="completion-actions">
      <button class="btn-view-changes">查看变更</button>
      <button class="btn-accept">接受</button>
      <button class="btn-reject">退回修改</button>
    </div>
  </div>
</div>
```

#### 5.4 变更对比视图

**弹出对比Modal**：
```html
<div class="changes-comparison-modal">
  <div class="modal-header">
    <h3>专家修改对比</h3>
    <button class="close">×</button>
  </div>
  
  <div class="comparison-view">
    <!-- 左侧：原版本 -->
    <div class="version-panel original">
      <div class="panel-header">原版本</div>
      <div class="content">
        <p>RAG + 引用强制 + 置信阈值拒答 + 审核流（演示）。</p>
      </div>
    </div>
    
    <!-- 右侧：专家版本 -->
    <div class="version-panel expert">
      <div class="panel-header">专家优化版</div>
      <div class="content">
        <p><span class="added">采用检索增强生成（RAG）架构，</span>RAG + 引用强制 + 置信阈值拒答 + <span class="modified">多级审核流程</span>。</p>
        <p class="added">关键特性：</p>
        <ul class="added">
          <li>向量数据库实时检索</li>
          <li>上下文相关性评分 >0.8</li>
          <li>置信度低于阈值自动转人工</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="modal-footer">
    <button class="btn-reject">退回修改</button>
    <button class="btn-accept-changes">接受修改</button>
  </div>
</div>
```

---

### 6. 协作完成

#### 6.1 时间到/服务完成

**聊天窗口提示**：
```html
<div class="message system">
  <div class="session-end-card">
    <div class="end-icon">✓</div>
    <h4>协作服务已完成</h4>
    <div class="session-summary">
      <div class="summary-item">
        <span>协作时长</span>
        <span>30分钟</span>
      </div>
      <div class="summary-item">
        <span>编辑部分</span>
        <span>3个</span>
      </div>
      <div class="summary-item">
        <span>对话轮次</span>
        <span>15轮</span>
      </div>
    </div>
    <div class="rating-section">
      <p>请为本次协作评分：</p>
      <div class="star-rating">
        ⭐⭐⭐⭐⭐
      </div>
      <textarea placeholder="留下您的评价（可选）"></textarea>
      <button class="btn-submit-review">提交评价</button>
    </div>
  </div>
</div>
```

---

## 🎨 UI元素设计

### 专家卡片样式
```css
.expert-profile-card {
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  border: 2px solid #0EA5E9;
  border-radius: 16px;
  padding: 24px;
}

.expert-header {
  display: flex;
  gap: 16px;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #0EA5E9;
}

.verified {
  color: #0EA5E9;
  font-size: 14px;
}

.expert-stats {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 14px;
  color: #64748B;
}
```

### 聊天消息样式
```css
.chat-messages {
  height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: #F8FAFC;
}

.message {
  margin-bottom: 16px;
}

.message.expert .message-bubble {
  background: white;
  border: 1px solid #E2E8F0;
  border-left: 3px solid #0EA5E9;
}

.message.user .message-bubble {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  margin-left: auto;
  max-width: 70%;
}

.message.system {
  text-align: center;
  color: #64748B;
  font-size: 14px;
}

.message.action {
  background: #FEF3C7;
  border-left: 3px solid #F59E0B;
  padding: 12px;
  border-radius: 8px;
}
```

### 编辑指示器样式
```css
.expert-editing-indicator {
  position: sticky;
  top: 64px;
  z-index: 100;
  background: #FEF3C7;
  border-bottom: 2px solid #F59E0B;
}

.indicator-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.editing-by-expert {
  position: relative;
  border: 2px solid #F59E0B;
  background: #FFFBEB;
}

.editing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(251, 191, 36, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}
```

---

## 💰 付费模式

### 按需付费套餐

| 套餐 | 价格 | 包含内容 | 适用场景 |
|------|------|----------|----------|
| **方案咨询** | ¥299 | 30分钟视频，改进建议 | 快速咨询 |
| **方案优化** | ¥899 | 完整优化，2次修改 | 深度优化 |
| **深度协作** | ¥2999 | 全程参与，不限次数 | 重要项目 |

### 支付流程
1. 选择套餐
2. 确认付费
3. 支付（支付宝/微信）
4. 专家接入
5. 开始协作

---

## 🔒 权限控制

### 编辑权限
- 用户始终拥有最终控制权
- 专家每次编辑需申请权限
- 用户可以实时查看编辑
- 用户可以拒绝或退回修改

### 查看权限
- 用户可随时查看专家编辑进度
- 支持变更对比视图
- 保留历史版本

---

## 📊 数据流转

```
用户操作 ─→ 系统记录 ─→ 专家查看
    ↓
 付费确认
    ↓
专家接入 ─→ 聊天沟通 ─→ 用户响应
    ↓
请求编辑 ─→ 用户批准 ─→ 专家编辑
    ↓
完成编辑 ─→ 用户验收 ─→ 接受/退回
    ↓
协作完成 ─→ 评价反馈
```

---

## 🎯 核心价值

### 对用户
- ✅ 从匹配案例直接找到专家
- ✅ 按需付费，透明定价
- ✅ 实时沟通，快速响应
- ✅ 保留控制权，可拒绝修改
- ✅ 变更对比，清晰可见

### 对专家
- ✅ 精准匹配客户
- ✅ 清晰的服务范围
- ✅ 合理的收费模式
- ✅ 高效的协作工具
- ✅ 评价体系建立信誉

---

**设计日期**: 2026-01-29  
**版本**: v4.0 Expert Collaboration Edition  
**核心**: 案例匹配 → 付费确认 → 聊天协作 → 内容编辑 → 验收完成
