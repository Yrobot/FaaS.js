FROM oven/bun:latest

# 设置工作目录
WORKDIR /app

# 创建备份目录
RUN mkdir -p /backups

# 复制备份文件到备份目录
COPY index.ts /backups/index.ts
COPY logger.ts /backups/logger.ts
COPY error-handler.ts /backups/error-handler.ts
COPY package.json /backups/package.json
COPY tsconfig.json /backups/tsconfig.json
COPY api/health/index.ts /backups/api/health/index.ts


# 复制文件到app
COPY .gitignore /app/.gitignore

# 设置环境变量
ENV PORT=3000
ENV NODE_ENV=production
RUN VERSION=$(grep -m1 version package.json | cut -d'"' -f4) && \
      echo "VERSION=$VERSION" > /etc/environment

# 暴露端口
EXPOSE 3000

# 创建启动脚本
RUN echo '#!/bin/sh\n\
# 从备份恢复核心文件\n\
echo "🔄 Restoring core files from backups..."\n\
cp -f /backups/index.ts /app/index.ts\n\
cp -f /backups/logger.ts /app/logger.ts\n\
cp -f /backups/error-handler.ts /app/error-handler.ts\n\
cp -f /backups/tsconfig.json /app/tsconfig.json\n\
mkdir -p /app/api/health\n\
cp -f /backups/api/health/index.ts /app/api/health/index.ts\n\
\n\
# 检查是否存在 package.json，不存在则创建默认的\n\
if [ ! -f /app/package.json ]; then\n\
  cp /backups/package.json /app/package.json\n\
fi\n\
\n\
# 安装依赖\n\
echo "📦 Installing dependencies..."\n\
bun install\n\
\n\
# 启动服务\n\
echo "🚀 Starting FaaS.js server on port ${PORT}..."\n\
bun run index.ts\n\
' > /start.sh && chmod +x /start.sh

# 启动脚本
CMD ["/start.sh"]