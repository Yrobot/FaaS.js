/**
 * FaaS.js - File as a Service
 *
 * ⚠️  请勿修改此文件！
 * ⚠️  此文件会在容器启动时从备份自动恢复
 * ⚠️  任何修改都会在下次重启时丢失
 */

import { join, resolve } from "path";
import { existsSync } from "fs";
import { logger, banner } from "@/logger";
import { handleError, ErrorHandler } from "@/error-handler";

const PORT = parseInt(process.env.PORT || "3000");
const API_PREFIX_PATH = "/api";

const PROJECT_PATH = resolve("./");

type RequestHandler = (req: Request) => Response | Promise<Response>;

interface RouteHandler {
  GET?: RequestHandler;
  POST?: RequestHandler;
  PUT?: RequestHandler;
  DELETE?: RequestHandler;
  PATCH?: RequestHandler;
  OPTIONS?: RequestHandler;
  HEAD?: RequestHandler;
  default?: RequestHandler;
}

/**
 * 动态加载路由处理器
 */
async function loadRouteHandler(
  filepath: string
): Promise<RouteHandler | null> {
  try {
    // 清除模块缓存以支持热重载
    delete require.cache[filepath];

    const module = await import(filepath);
    return module;
  } catch (error) {
    logger.error(`Failed to load route handler: ${filepath}`, error);
    return null;
  }
}

/**
 * 解析请求路径到文件路径
 */
function resolveFilePath(pathname: string): string | null {
  // 移除查询参数
  const cleanPath = pathname.split("?")[0] ?? "";

  // 构建可能的文件路径
  const possiblePaths = [
    join(PROJECT_PATH, cleanPath, "index.ts"),
    join(PROJECT_PATH, cleanPath, "index.js"),
    // join(API_DIR_PATH, cleanPath + ".ts"),
    // join(API_DIR_PATH, cleanPath + ".js"),
  ];

  for (const filepath of possiblePaths) {
    if (existsSync(filepath)) {
      return filepath;
    }
  }

  return null;
}

/**
 * 处理 HTTP 请求
 */
async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;

  logger.info(`📥 ${method} ${pathname}`);

  // 拦截
  switch (pathname) {
    case "/":
      return new Response(banner);
    default:
      break;
  }

  try {
    // 解析文件路径
    const filepath = resolveFilePath(pathname);

    if (!filepath) {
      logger.warn(`❌ Route not found: ${pathname}`);
      return new Response(
        JSON.stringify({
          error: "Route not found",
          path: pathname,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    logger.info(`📁 Loading handler: ${filepath.replace(process.cwd(), ".")}`);

    // 加载路由处理器
    const handler = await loadRouteHandler(filepath);

    if (!handler) {
      logger.error(`❌ Failed to load handler: ${filepath}`);
      return ErrorHandler.createErrorResponse("HANDLER_LOAD_FAILED", {
        filepath,
      });
    }

    // 查找对应的方法处理器，优先级：default > 具体方法
    const methodHandler =
      handler.default || handler[method as keyof RouteHandler];

    if (!methodHandler || typeof methodHandler !== "function") {
      logger.warn(`❌ Method ${method} not supported for ${pathname}`);
      return new Response(
        JSON.stringify({
          error: `Method ${method} not allowed`,
          path: pathname,
          availableMethods: Object.keys(handler).filter(
            (key) => typeof handler[key as keyof RouteHandler] === "function"
          ),
          timestamp: new Date().toISOString(),
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            Allow: Object.keys(handler).join(", "),
          },
        }
      );
    }

    // 执行处理器
    logger.info(`🔧 Executing ${handler.default ? "default" : method} handler`);

    // 重定向 console.log 以添加缩进
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const resetConsole = () => {
      // 恢复原始 console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };

    console.log = (...args: any[]) => {
      logger.info(`    📝 ${args.join(" ")}`);
    };
    console.error = (...args: any[]) => {
      logger.error(`    ❌ ${args.join(" ")}`);
    };
    console.warn = (...args: any[]) => {
      logger.warn(`    ⚠️  ${args.join(" ")}`);
    };

    try {
      const response = await methodHandler(req);

      resetConsole();

      logger.success(`✅ ${method} ${pathname} -> ${response.status}`);

      return response;
    } catch (handlerError) {
      resetConsole();
      throw handlerError;
    }
  } catch (error) {
    logger.error(`💥 Request failed: ${method} ${pathname}`, error);
    return handleError(error, { method, pathname });
  }
}

/**
 * 启动服务器
 */
const server = Bun.serve({
  port: PORT,

  async fetch(req) {
    // const url = new URL(req.url);
    return await handleRequest(req);
  },
  error(error) {
    logger.error("🔥 Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

const ORIGIN = `http://localhost:${PORT}`;

logger.printBanner();
logger.success(`🚀 FaaS.js server started`);
logger.info(`Listening on ${ORIGIN}`);
logger.info(`API base path: ${API_PREFIX_PATH}`);
logger.info(`Health check: ${ORIGIN}/api/health`);

// 优雅关闭
process.on("SIGTERM", () => {
  logger.info("🛑 SIGTERM received, shutting down gracefully");
  server.stop();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("🛑 SIGINT received, shutting down gracefully");
  server.stop();
  process.exit(0);
});
