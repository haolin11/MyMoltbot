import { apiKey } from '../config/llm.js';
import logger from '../utils/logger.js';

/**
 * 通义千问LLM服务
 */
export class LLMService {
  /**
   * 文本嵌入（Embedding）
   * 使用通义千问的text-embedding-v2模型
   */
  static async embedText(text) {
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY未配置');
    }

    try {
      // 使用HTTP请求方式调用通义千问API，设置30秒超时
      const fetch = (await import('node-fetch')).default;
      const timeout = 30000; // 30秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'text-embedding-v2',
            input: {
              texts: [text]
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        
        // 检查响应状态，支持多种响应格式
        if (data.statusCode === 200 && data.output && data.output.embeddings) {
          return data.output.embeddings[0].embedding;
        } else if (data.output && data.output.embeddings) {
          // 如果API返回了embeddings，即使没有statusCode也认为是成功的
          return data.output.embeddings[0].embedding;
        } else if (response.ok && data.output && data.output.embeddings) {
          // 如果HTTP状态码是200，即使没有statusCode字段也尝试解析
          return data.output.embeddings[0].embedding;
        } else {
          throw new Error(`Embedding API返回错误: ${JSON.stringify(data)}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('API请求超时（30秒），请检查网络连接或API服务状态');
        }
        throw fetchError;
      }
    } catch (error) {
      logger.error('文本嵌入失败:', error);
      throw new Error(`文本嵌入失败: ${error.message}`);
    }
  }

  /**
   * 批量文本嵌入
   */
  static async embedTexts(texts) {
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY未配置');
    }

    if (texts.length === 0) {
      return [];
    }

    try {
      // 通义千问API支持批量，但建议每批不超过25条
      const batchSize = 25;
      const embeddings = [];

      const fetch = (await import('node-fetch')).default;
      const timeout = 60000; // 批量请求使用60秒超时
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'text-embedding-v2',
              input: {
                texts: batch
              }
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          const data = await response.json();
          
          // 检查响应状态，支持多种响应格式
          if (data.statusCode === 200 && data.output && data.output.embeddings) {
            embeddings.push(...data.output.embeddings.map(e => e.embedding));
          } else if (data.output && data.output.embeddings) {
            // 如果API返回了embeddings，即使没有statusCode也认为是成功的
            embeddings.push(...data.output.embeddings.map(e => e.embedding));
          } else if (response.ok && data.output && data.output.embeddings) {
            // 如果HTTP状态码是200，即使没有statusCode字段也尝试解析
            embeddings.push(...data.output.embeddings.map(e => e.embedding));
          } else {
            throw new Error(`Embedding API返回错误: ${JSON.stringify(data)}`);
          }

          // 避免API限流，添加小延迟
          if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error(`批量文本嵌入请求超时（60秒），批次 ${Math.floor(i / batchSize) + 1}，请检查网络连接或API服务状态`);
          }
          throw fetchError;
        }
      }

      return embeddings;
    } catch (error) {
      logger.error('批量文本嵌入失败:', error);
      throw new Error(`批量文本嵌入失败: ${error.message}`);
    }
  }

  /**
   * 文本生成（Completion）
   * 使用通义千问的qwen-turbo或qwen-plus模型
   */
  static async generateText(prompt, options = {}) {
    if (!apiKey) {
      throw new Error('DASHSCOPE_API_KEY未配置');
    }

    const {
      model = 'qwen-turbo',
      temperature = 0.7,
      maxTokens = 2000,
      stream = false
    } = options;

    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          input: {
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: temperature,
            max_tokens: maxTokens
          }
        })
      });

      const data = await response.json();
      
      // 检查响应状态
      if (data.statusCode === 200 && data.output) {
        if (stream) {
          // 流式响应处理（简化处理）
          return data.output;
        } else {
          // 支持多种响应格式
          return data.output.choices?.[0]?.message?.content || data.output.text || '';
        }
      } else if (data.output && data.output.text) {
        // 如果API返回了output.text，即使没有statusCode也认为是成功的
        return data.output.text;
      } else if (response.ok && data.output) {
        // 如果HTTP状态码是200，即使没有statusCode字段也尝试解析
        return data.output.choices?.[0]?.message?.content || data.output.text || '';
      } else {
        throw new Error(`Generation API返回错误: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      logger.error('文本生成失败:', error);
      throw new Error(`文本生成失败: ${error.message}`);
    }
  }

  /**
   * 使用RAG上下文和Web搜索结果生成方案（优化版PE工程）
   * 参考企业级Agent设计模式：Web搜索(基准线) + RAG(落地案例) + 示例驱动 + 专家评估
   */
  static async generateSolutionWithRAG(userInput, ragContext, options = {}) {
    const {
      inputMethod = 'text',
      model = 'qwen-plus',
      temperature = 0.4 // 进一步降低温度，增加严谨性
    } = options;

    const { CaseModel } = await import('../models/index.js');
    
    // 1. 获取行业基准数据（模拟搜索或实际API调用）
    const searchKeywords = userInput.industry || userInput.title || 'AI解决方案';
    const webMetrics = await this.getWebIndustryStandards(searchKeywords);

    // 2. 预处理检索到的落地案例
    const caseIds = [...new Set(ragContext.map(ctx => ctx.case_id).filter(Boolean))];
    const referenceCases = await Promise.all(
      caseIds.map(id => CaseModel.findById(id))
    );
    const validCases = referenceCases.filter(Boolean);

    // 3. 构建落地案例指标表
    const metricsTable = this.buildMetricsTable(validCases);
    
    // 4. 构建行业基准数据看板（Web来源）
    const industryBenchTable = this.buildIndustryBenchTable(webMetrics);

    // 5. 构建示例驱动的上下文
    const examplesContext = this.buildExamplesContext(validCases, ragContext);

    // 6. 构建用户需求上下文
    const userContext = this.buildUserContext(userInput, inputMethod);

    // 7. 构建完整的PE提示词
    const prompt = this.buildEnterprisePrompt({
      userContext,
      metricsTable,
      industryBenchTable,
      examplesContext,
      ragContext,
      validCases
    });

    logger.info(`PE生成提示词长度: ${prompt.length} 字符，包含行业基准数据: ${webMetrics.length} 条`);

    return await this.generateText(prompt, {
      model,
      temperature,
      maxTokens: 6000
    });
  }

  /**
   * 模拟/调用Web搜索获取行业标准值
   * 实际生产中可集成Google Search API或Bing Search API
   */
  static async getWebIndustryStandards(keyword) {
    // 这是一个模拟实现，实际可以调用外部API
    // 这里的逻辑可以根据关键词动态返回一些真实的行业平均值
    const standards = [
      { metric: '推理延迟', value: '100-200ms', source: 'NVIDIA 边缘计算白皮书 2024' },
      { metric: '模型准确率(SOTA)', value: '≥92%', source: 'PapersWithCode Industry Benchmarks' },
      { metric: '系统可用性', value: '99.9%', source: '云服务 SLA 标准' }
    ];
    
    // 简单逻辑：如果是医疗，增加特定指标
    if (keyword.includes('医疗') || keyword.includes('诊断')) {
      standards.push({ metric: '辅助诊断灵敏度', value: '≥85%', source: 'Nature Medicine 临床AI评估标准' });
    }
    
    return standards;
  }

  /**
   * 构建行业基准数据表
   */
  static buildIndustryBenchTable(standards) {
    if (!standards || standards.length === 0) return '';
    
    const rows = standards.map(s => `| ${s.metric} | ${s.value} | ${s.source} |`).join('\n');
    
    return `
╔══════════════════════════════════════════════════════════════════╗
║                    全球行业基准数据（Web/SOTA 参考）               ║
╚══════════════════════════════════════════════════════════════════╝

| 核心指标项 | 行业标准/SOTA值 | 权威来源 |
|-----------|----------------|---------|
${rows}

⚠️ 专家提示：
- 上述数据代表行业目前的“理论最优值”或“通用准则”
- 本方案目标应综合考虑落地成本与上述基准值的平衡`;
  }

  /**
   * 构建结构化指标表（参考DB-GPT的字段特征描述模式）
   */
  static buildMetricsTable(cases) {
    if (!cases || cases.length === 0) return '暂无历史案例指标数据';

    const metricsData = cases
      .filter(c => c.metrics || c.acceptance_standards)
      .map((c, idx) => {
        let metricsStr = '';
        if (c.metrics) {
          try {
            const metrics = typeof c.metrics === 'string' ? JSON.parse(c.metrics) : c.metrics;
            metricsStr = Object.entries(metrics)
              .map(([key, value]) => `  - ${key}: ${value}`)
              .join('\n');
          } catch (e) {
            metricsStr = `  - 原始数据: ${c.metrics}`;
          }
        }
        return `
【案例${idx + 1}】${c.title}
├─ 行业: ${c.industry || '未知'}
├─ 技术: ${c.technology || '未知'}
├─ 核心指标:
${metricsStr || '  - 暂无结构化指标'}
└─ 验收标准: ${c.acceptance_standards || '参见案例文档'}`;
      });

    if (metricsData.length === 0) return '暂无历史案例指标数据';

    return `
╔══════════════════════════════════════════════════════════════════╗
║                    历史案例指标参考表                              ║
╚══════════════════════════════════════════════════════════════════╝
${metricsData.join('\n')}

⚠️ 重要说明：
- 上述指标为历史案例的实际达成值，可作为本方案的"性能天花板"参考
- 基准线通常为行业平均水平的80%，最优值为历史最佳的110%
- 请在生成方案时，明确引用这些数值并给出本方案的预期目标`;
  }

  /**
   * 构建示例驱动上下文（参考DB-GPT的举例模式）
   * 包含：1. RAG检索的相关案例 2. 行业标准方案模板示例
   */
  static buildExamplesContext(cases, ragContext) {
    // 通用方案模板示例（类似DB-GPT的SQL示例模式）
    const templateExamples = this.buildTemplateExamples();

    // RAG检索的相关案例
    let ragExamples = '';
    if (ragContext && ragContext.length > 0) {
      const topContexts = ragContext.slice(0, 3);
      ragExamples = `
╔══════════════════════════════════════════════════════════════════╗
║                    参考案例示例（RAG检索结果）                      ║
╚══════════════════════════════════════════════════════════════════╝

${topContexts.map((ctx, idx) => `
【检索案例${idx + 1}】${ctx.case_title || '未知'}
├─ 相似度评分: ${(ctx.score * 100).toFixed(1)}%
├─ 行业场景: ${ctx.case_industry || '未知'} / ${ctx.case_scenario || '未知'}
├─ 核心技术: ${ctx.case_technology || '未知'}
└─ 内容摘要:
${ctx.content.substring(0, 600)}${ctx.content.length > 600 ? '...' : ''}
`).join('\n' + '─'.repeat(60) + '\n')}`;
    }

    return `${templateExamples}
${ragExamples}

💡 使用说明：
- 生成方案时应参考【检索案例】的技术架构和实施路径
- 对于相似场景，可借鉴其验收标准和评估指标
- 必须在方案中注明参考来源（如"参考[案例名称]"），确保可溯源性
- 评估指标对比表必须包含历史案例值、来源案例、本方案目标三列`;
  }

  /**
   * 构建通用方案模板示例（参考DB-GPT的举例模式）
   */
  static buildTemplateExamples() {
    return `
╔══════════════════════════════════════════════════════════════════╗
║                    方案生成示例模板（举例学习）                      ║
╚══════════════════════════════════════════════════════════════════╝

【示例场景1】工业视觉质检系统
用户需求：需要开发一套针对PCB板的缺陷检测系统，能识别焊点缺失、短路、划痕等问题。

正确的评估指标写法：
| 指标名称 | 历史案例值 | 来源案例 | 本方案目标 | 行业基准线 |
|---------|-----------|---------|-----------|----------|
| 缺陷检测准确率 | 94.5% | [某电子厂质检项目] | ≥96% | 90% |
| 漏检率 | 0.3% | [某电子厂质检项目] | <0.2% | 1% |
| 单张推理时间 | 45ms | [某电子厂质检项目] | <35ms | 80ms |

正确的验收标准写法：
✓ 在2000张标注测试集上，mAP@0.5≥0.92，验证脚本：scripts/eval_map.py
✓ 在Jetson AGX Orin上单张推理时间<35ms，测试命令：python benchmark.py --device orin
✓ 连续72小时压力测试无OOM或崩溃，监控日志：logs/stress_test.log

${'─'.repeat(60)}

【示例场景2】SLAM定位建图系统
用户需求：开发室内仓库的自主导航机器人，需要厘米级定位精度。

正确的评估指标写法：
| 指标名称 | 历史案例值 | 来源案例 | 本方案目标 | 行业基准线 |
|---------|-----------|---------|-----------|----------|
| 定位精度(RMSE) | 3.2cm | [某仓储AGV项目] | ≤3.5cm | 10cm |
| 建图完整度 | 98.5% | [某仓储AGV项目] | ≥99% | 95% |
| CPU占用率 | 35% | [某仓储AGV项目] | <40% | 60% |

正确的风险边界写法：
⚠️ 本方案适用于结构化室内环境（有明确墙面/货架纹理），不适用于：
- 开阔无特征空间（需增加辅助标记）
- 动态遮挡率>40%的场景（需增加动态物体过滤模块）
- 光照变化超过100lux/s的环境（需增加自动曝光补偿）

${'─'.repeat(60)}

【示例场景3】多模态异常检测系统
用户需求：工厂设备巡检，需要识别过热、泄漏、异常振动等故障。

正确的技术选型写法：
- 热成像模块：FLIR Lepton 3.5（分辨率160×120，LWIR 8-14μm，NETD<50mK）
- 振动传感器：ADXL355（±2g/±4g/±8g可选，噪声密度25μg/√Hz）
- 边缘推理：Jetson AGX Orin 64GB（275 TOPS INT8，60W功耗）
- 深度学习框架：PyTorch 2.1 + TensorRT 8.6
- 模型架构：YOLOv8m（异常检测） + ResNet-18（多分类）

正确的里程碑写法：
| 阶段 | 时间 | 交付物 | 验收标准 |
|-----|------|--------|--------|
| 原型验证 | 4周 | Demo系统 | 3类异常识别准确率>80% |
| 工程开发 | 8周 | 完整系统 | 全部5类异常识别准确率>92% |
| 现场部署 | 4周 | 生产系统 | 连续30天稳定运行，误报率<1% |`;
  }

  /**
   * 构建用户需求上下文
   */
  static buildUserContext(userInput, inputMethod) {
    if (inputMethod === 'text') {
      return `
┌─────────────────────────────────────────────────────────────────┐
│ 用户需求（文本描述方式）                                          │
└─────────────────────────────────────────────────────────────────┘
项目标题: ${userInput.title || '未提供'}
需求描述: ${userInput.description || userInput || '未提供'}`;
    } else {
      return `
┌─────────────────────────────────────────────────────────────────┐
│ 用户需求（结构化表单方式）                                        │
└─────────────────────────────────────────────────────────────────┘
项目标题: ${userInput.title || '未提供'}
所属行业: ${userInput.industry || '未指定'}
技术方向: ${userInput.technology || '未指定'}
预算范围: ${userInput.budget || '未指定'}
项目目标: ${userInput.objectives || '未提供'}
技术要求: ${userInput.requirements || '未提供'}
时间周期: ${userInput.timeline || '未指定'}`;
    }
  }

  /**
   * 构建企业级完整提示词
   */
  static buildEnterprisePrompt({ userContext, metricsTable, industryBenchTable, examplesContext, ragContext, validCases }) {
    const systemRole = `你是一位顶尖的企业级AI解决方案架构师（Enterprise Solution Architect Agent）。
你具备极强的商业洞察力和工程落地能力，擅长将最前沿的AI技术与实际业务场景相结合。
你的回答风格应当是：严谨、专业、客观，避免夸大其词，所有结论都应有数据支撑。`;

    const instructions = `
【核心任务】
请为用户生成一份详尽、可落地的技术解决方案。
你需要平衡“行业SOTA指标”与“实际工程落地指标”。

【数据利用指引】
1. 参考下方的《全球行业基准数据》，这代表了行业目前的最高水平。
2. 参考下方的《历史案例指标参考表》，这代表了我们在实际项目中达成的落地数据。
3. 如果两者存在差距，请在方案中进行专业分析，并给出本方案的预期目标。`;

    const constraints = `
╔══════════════════════════════════════════════════════════════════╗
║                    生成规则与边界限制                              ║
╚══════════════════════════════════════════════════════════════════╝

【必须遵守的规则】
1. 评估指标三级划分：必须区分“行业标杆”、“历史实测”、“本案目标”。
2. 系统架构可视化：涉及到系统拓扑、数据流、逻辑架构时，**必须使用 Mermaid 语法**绘图。
   - 例如：使用指令 \` \` \`mermaid\ngraph TD\n... \` \` \` 格式。
   - 禁止使用 ASCII 字符画图。
3. 数学公式规范：所有算法公式、性能计算必须使用 **标准 LaTeX 格式**。
   - 块级公式必须用 $$ ... $$ 包裹，且公式内不得包含 Markdown 特殊符号。
   - 行内公式必须用 $ ... $ 包裹。
   - 示例：设 CSD 为 $$ \text{CSD}_{ij} = \mathbb{E}[X_i X_j^*] $$
4. 系统架构可视化：涉及到系统拓扑、数据流、逻辑架构时，必须使用 Mermaid 语法绘图（禁止 ASCII）。
5. 交付物具体化：交付物需包含代码架构方案、预训练模型说明、部署脚本。
6. 项目化工具支持：在方案正文最末尾，必须附带一个 XML 标签包裹的 JSON 数据块，用于填充项目管理工具。
   格式如下：
   <PROJECT_DATA>
   {
     "tasks": [{"name": "任务名", "desc": "描述"}, ...],
     "milestones": [{"name": "里程碑", "date": "T+30d"}, ...],
     "risks": [{"name": "风险点", "impact": "高", "solution": "应对方案"}]
   }
   </PROJECT_DATA>

【输出格式要求】
方案必须包含以下结构化章节，使用Markdown格式：

## 1. 项目愿景与业务蓝图
（现状分析、痛点对标、业务价值闭环）

## 2. 深度技术架构设计
（包含 Mermaid 格式的系统拓扑结构图、核心组件选型、高可用与弹性设计、数据交互协议说明）

## 3. 核心算法与工程实现
（包含 LaTeX 格式的数学推导或算法公式、模型演进路线、数据增强策略、训练推理优化）

## 4. 实施路径与资源配置
（敏捷迭代周期、人员配比建议、硬件资源预估）

## 5. 综合评估指标对比 (Critical Benchmark)
⭐【关键章节】必须包含：
| 评价维度 | 行业基准(Web) | 历史落地值(Case) | 本方案预期目标 | 来源与依据 |
|---------|--------------|-----------------|--------------|-----------|
| (具体填写) |

## 6. 验收体系与 EMC 风险控制
（可量化的验收标准、边界压力测试、容错机制）

## 7. 工程交付物清单

## 8. 附录：参考资料与溯源
（引用的历史案例ID、权威白皮书连接）`;

    const fullPrompt = `${systemRole}

${instructions}

${userContext}

${industryBenchTable}

${metricsTable}

${examplesContext}

${constraints}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                          开始生成深度方案
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请以资深架构师的身份，严格按照上述规则和格式，生成一份企业级深度技术解决方案：

`;

    return fullPrompt;
  }

  /**
   * 使用AI整理和补充案例元数据
   */
  static async enrichCaseMetadata(text, extractedMetadata) {
    if (!apiKey) {
      return extractedMetadata; // 如果API未配置，返回原始数据
    }

    try {
      const prompt = `请分析以下项目文档内容，提取并补充项目的结构化信息。特别注意提取具体的评估指标（如准确率、mIoU、响应时间等数值）和验收标准。

文档内容（前2000字符）：
${text.substring(0, 2000)}

当前提取的信息：
- 标题：${extractedMetadata.title || '未提取'}
- 行业：${extractedMetadata.industry || '未提取'}
- 场景：${extractedMetadata.scenario || '未提取'}
- 技术类型：${extractedMetadata.technology || '未提取'}

请以JSON格式返回补充后的信息，格式如下：
{
  "title": "项目标题",
  "industry": "所属行业（如：制造业、医疗健康、金融科技等）",
  "scenario": "应用场景（如：AI风控、智能制造、AI诊断等）",
  "technology": "技术类型（如：机器学习、深度学习、物联网等）",
  "description": "项目描述（100-200字）",
  "metrics": {
    "指标名称1": "数值或描述",
    "指标名称2": "数值或描述"
  },
  "acceptance_standards": "具体的验收标准描述"
}

只返回JSON，不要其他内容：`;

      const response = await this.generateText(prompt, {
        model: 'qwen-turbo',
        temperature: 0.3,
        maxTokens: 500
      });

      // 尝试解析JSON响应
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const enriched = JSON.parse(jsonMatch[0]);
          return {
            ...extractedMetadata,
            ...enriched
          };
        }
      } catch (parseError) {
        logger.warn('解析AI返回的JSON失败，使用原始数据');
      }

      return extractedMetadata;
    } catch (error) {
      logger.error('AI补充元数据失败:', error);
      return extractedMetadata; // 失败时返回原始数据
    }
  }
}

export default LLMService;

