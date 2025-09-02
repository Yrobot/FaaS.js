/**
 * FaaS.js - /api/health
 *
 * ⚠️  请勿修改此文件！
 * ⚠️  此文件会在容器启动时从备份自动恢复
 * ⚠️  任何修改都会在下次重启时丢失
 */

export default () =>
  Response.json({
    status: "healthy",
    service: "FaaS.js",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
