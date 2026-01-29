# 1. 启动 ChromaDB (8000端口)
cd /root/autodl-fs/casepilot_p/casepilot_p/casepilot/backend && nohup chroma run --path ./chroma-data --port 8000 > chroma.log 2>&1 &

# 2. 启动后端 (3000端口)
cd /root/autodl-fs/casepilot_p/casepilot_p/casepilot/backend && nohup node src/app.js > ../dev.log 2>&1 &

# 3. 启动前端 (8080端口)
cd /root/autodl-fs/casepilot_p/casepilot_p/casepilot/UI && nohup npx http-server -p 8080 > ../frontend.log 2>&1 &

# 检查服务状态
sleep 5 && ps aux | grep -E "chroma|node src/app.js|http-server" | grep -v grep


# 替换 <SSH端口> 和 <远程地址> 为 AutoDL 提供的登录信息
ssh -CNg -L 8080:127.0.0.1:8080 -L 3000:127.0.0.1:3000 -p <SSH端口> root@<远程地址>
ssh -CNg -L 8080:127.0.0.1:8080 -L 3000:127.0.0.1:3000 -p 45990 root@connect.westb.seetacloud.com
