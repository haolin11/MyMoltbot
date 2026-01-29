import { initChroma, getCaseCollection, getChromaClient } from '../src/config/chroma.js';
import { VectorService } from '../src/services/vectorService.js';
import { vectorConfig } from '../src/config/vector.js';
import logger from '../src/utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 检查Chroma向量数据库状态
 */
async function checkChroma() {
  try {
    console.log('🔍 开始检查Chroma向量数据库...\n');

    // 1. 初始化Chroma连接
    console.log('1️⃣ 检查Chroma连接...');
    const chromaConnected = await initChroma();
    if (!chromaConnected) {
      console.error('❌ Chroma连接失败');
      console.log('提示: 请确保Chroma服务已启动 (docker run -d -p 8000:8000 --name chroma chromadb/chroma)');
      process.exit(1);
    }
    console.log('✅ Chroma连接成功\n');

    // 2. 检查集合是否存在
    console.log('2️⃣ 检查集合状态...');
    const collection = getCaseCollection();
    if (!collection) {
      console.error('❌ 集合未初始化');
      process.exit(1);
    }
    console.log('✅ 集合已加载\n');

    // 3. 获取集合统计信息
    console.log('3️⃣ 检查向量数量...');
    const stats = await VectorService.getCollectionStats();
    console.log(`   总向量数: ${stats.totalVectors}`);
    
    if (stats.totalVectors === 0) {
      console.log('⚠️  警告: 向量数据库为空！');
      console.log('   这可能是检索不到结果的原因。');
      console.log('   请运行导入脚本: npm run import-cases\n');
    } else {
      console.log(`✅ 向量数据库中有 ${stats.totalVectors} 个向量\n`);
    }

    // 4. 尝试获取一些样本数据
    console.log('4️⃣ 检查样本数据...');
    try {
      const sampleResults = await collection.get({
        limit: 5
      });
      
      if (sampleResults.ids && sampleResults.ids.length > 0) {
        console.log(`   找到 ${sampleResults.ids.length} 个样本向量:`);
        sampleResults.ids.forEach((id, index) => {
          const metadata = sampleResults.metadatas?.[index] || {};
          const caseId = metadata.case_id || '未知';
          console.log(`   - ID: ${id}, Case ID: ${caseId}`);
        });
        console.log('');
      } else {
        console.log('   ⚠️  未找到样本数据\n');
      }
    } catch (error) {
      console.log(`   ⚠️  获取样本数据失败: ${error.message}\n`);
    }

    // 5. 测试查询
    console.log('5️⃣ 测试向量检索...');
    try {
      const testQuery = '定位建图';
      console.log(`   查询文本: "${testQuery}"`);
      console.log(`   正在调用API生成查询向量（可能需要几秒钟）...`);
      
      // 设置30秒超时
      const searchPromise = VectorService.searchSimilar(testQuery, {
        topK: vectorConfig.defaultTopK,
        minScore: vectorConfig.relaxedMinScore
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('向量检索超时（30秒）')), 30000);
      });
      
      const results = await Promise.race([searchPromise, timeoutPromise]);
      
      console.log(`   检索结果: ${results.length} 个相似文本块`);
      console.log(`   使用的相似度阈值: ${vectorConfig.relaxedMinScore}`);
      
      if (results.length > 0) {
        console.log('   前3个结果:');
        results.slice(0, 3).forEach((result, index) => {
          console.log(`   ${index + 1}. Case ID: ${result.case_id}, Score: ${result.score.toFixed(3)}`);
          console.log(`      内容预览: ${result.content.substring(0, 50)}...`);
        });
        console.log('');
      } else {
        console.log('   ⚠️  未检索到结果');
        console.log('   可能原因:');
        console.log('   - 向量数据库为空（需要导入数据）');
        console.log(`   - 相似度阈值过高（当前minScore=${vectorConfig.relaxedMinScore}）`);
        console.log('   - 查询文本与案例内容差异较大');
        console.log(`   - 提示: 可在.env文件中调整VECTOR_RELAXED_MIN_SCORE参数\n`);
      }
    } catch (error) {
      console.log(`   ❌ 测试查询失败: ${error.message}`);
      if (error.message.includes('超时') || error.message.includes('timeout')) {
        console.log('   💡 提示:');
        console.log('   - 检查网络连接是否正常');
        console.log('   - 检查DASHSCOPE_API_KEY是否正确配置');
        console.log('   - 检查API密钥是否有足够的额度');
        console.log('   - 可以稍后重试\n');
      } else {
        console.log('');
      }
    }

    // 6. 检查Chroma客户端状态
    console.log('6️⃣ 检查Chroma客户端信息...');
    const client = getChromaClient();
    if (client) {
      try {
        const collections = await client.listCollections();
        console.log(`   可用集合数: ${collections.length}`);
        collections.forEach(col => {
          console.log(`   - ${col.name} (${col.metadata?.description || '无描述'})`);
        });
        console.log('');
      } catch (error) {
        console.log(`   ⚠️  获取集合列表失败: ${error.message}\n`);
      }
    }

    // 7. 显示向量检索配置
    console.log('7️⃣ 向量检索配置信息...');
    console.log(`   默认相似度阈值: ${vectorConfig.defaultMinScore}`);
    console.log(`   宽松相似度阈值: ${vectorConfig.relaxedMinScore}`);
    console.log(`   严格相似度阈值: ${vectorConfig.strictMinScore}`);
    console.log(`   默认检索数量: ${vectorConfig.defaultTopK}`);
    console.log(`   💡 提示: 可在.env文件中调整这些参数\n`);

    console.log('✅ 检查完成！');
    
    if (stats.totalVectors === 0) {
      console.log('\n💡 建议: 运行以下命令导入案例数据:');
      console.log('   npm run import-cases');
      process.exit(1);
    }

  } catch (error) {
    logger.error('检查失败:', error);
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  }
}

// 运行检查
checkChroma();

