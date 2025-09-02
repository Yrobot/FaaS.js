/**
 * FaaS.js Error Handler
 *
 * ⚠️  请勿修改此文件！
 * ⚠️  此文件会在容器启动时从备份自动恢复
 * ⚠️  任何修改都会在下次重启时丢失
 */

import { logger } from "@/logger";

export type ErrorType =
  | "ROUTE_NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "HANDLER_LOAD_FAILED"
  | "HANDLER_EXECUTION_FAILED"
  | "INVALID_RESPONSE"
  | "TYPESCRIPT_ERROR"
  | "DEPENDENCY_ERROR"
  | "INTERNAL_ERROR";

interface ErrorConfig {
  status: number;
  message: string;
  docUrl?: string;
  suggestion?: string;
}

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  ROUTE_NOT_FOUND: {
    status: 404,
    message: "API route not found",
    docUrl: "https://github.com/Yrobot/FaaS.js#在-appapi-下添加-ts-文件",
    suggestion:
      "Create an index.ts file in the api directory matching your request path",
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: "HTTP method not allowed",
    docUrl: "https://bun.com/docs/api/http#per-http-method-routes",
    suggestion:
      "Export the corresponding HTTP method function (GET, POST, etc.) or use 'default' export",
  },
  HANDLER_LOAD_FAILED: {
    status: 500,
    message: "Failed to load route handler",
    docUrl: "https://github.com/Yrobot/FaaS.js#在-appapi-下添加-ts-文件",
    suggestion:
      "Check file syntax and ensure proper TypeScript/JavaScript export",
  },
  HANDLER_EXECUTION_FAILED: {
    status: 500,
    message: "Handler execution failed",
    docUrl: "https://github.com/Yrobot/FaaS.js#在-appapi-下添加-ts-文件",
    suggestion: "Check your handler function for runtime errors",
  },
  INVALID_RESPONSE: {
    status: 500,
    message: "Handler returned invalid response",
    docUrl: "https://bun.com/docs/api/http#static-responses",
    suggestion: "Handler must return a Response object or Promise<Response>",
  },
  TYPESCRIPT_ERROR: {
    status: 500,
    message: "TypeScript compilation error",
    docUrl: "https://github.com/yrobot/faas-js#typescript-support", // TODO: add docs #typescript-support
    suggestion: "Check your TypeScript syntax and type definitions",
  },
  DEPENDENCY_ERROR: {
    status: 500,
    message: "Dependency import error",
    // docUrl: "https://github.com/yrobot/faas-js#dependencies",
    suggestion:
      "Ensure dependencies are listed in package.json and restart FaaS.js container",
  },
  INTERNAL_ERROR: {
    status: 500,
    message: "Internal server error",
    docUrl: "https://github.com/Yrobot/FaaS.js/issues",
    suggestion:
      "This is an unexpected error. Please check the logs for more details. Open an issue if you need help.",
  },
};

export class ErrorHandler {
  /**
   * 创建标准化的错误响应
   */
  static createErrorResponse(
    errorType: ErrorType,
    context: Record<string, any> = {},
    originalError?: any
  ): Response {
    const config = ERROR_CONFIGS[errorType];
    const errorId = Math.random().toString(36).substring(2, 8);

    const errorResponse = {
      error: {
        id: errorId,
        type: errorType,
        message: config.message,
        suggestion: config.suggestion,
        documentation: config.docUrl,
        context,
        timestamp: new Date().toISOString(),
      },
    };

    // 记录详细错误日志
    logger.error(`💥 Error [${errorId}] ${errorType}: ${config.message}`, {
      context,
      originalError: originalError
        ? {
            name: originalError.name,
            message: originalError.message,
            stack: originalError.stack,
          }
        : undefined,
    });

    return new Response(JSON.stringify(errorResponse, null, 2), {
      status: config.status,
      headers: {
        "Content-Type": "application/json",
        "X-Error-ID": errorId,
        "X-Error-Type": errorType,
      },
    });
  }

  /**
   * 分析错误类型
   */
  static analyzeError(
    error: any,
    context: Record<string, any> = {}
  ): ErrorType {
    if (!error) return "INTERNAL_ERROR";

    const errorMessage = error.message || error.toString().toLowerCase();

    // TypeScript 相关错误
    if (
      errorMessage.includes("typescript") ||
      errorMessage.includes("type error")
    ) {
      return "TYPESCRIPT_ERROR";
    }

    // 模块导入错误
    if (
      errorMessage.includes("cannot resolve") ||
      errorMessage.includes("module not found") ||
      errorMessage.includes("cannot find module")
    ) {
      return "DEPENDENCY_ERROR";
    }

    // 语法错误
    if (
      errorMessage.includes("syntaxerror") ||
      errorMessage.includes("unexpected token")
    ) {
      return "TYPESCRIPT_ERROR";
    }

    // 处理器执行错误
    if (context.phase === "handler_execution") {
      return "HANDLER_EXECUTION_FAILED";
    }

    // 处理器加载错误
    if (context.phase === "handler_loading") {
      return "HANDLER_LOAD_FAILED";
    }

    return "INTERNAL_ERROR";
  }
}

/**
 * 全局错误处理函数
 */
export function handleError(
  error: any,
  context: Record<string, any> = {}
): Response {
  const errorType = ErrorHandler.analyzeError(error, context);
  return ErrorHandler.createErrorResponse(errorType, context, error);
}

/**
 * 未捕获异常处理器
 */
process.on("uncaughtException", (error) => {
  logger.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("💥 Unhandled Rejection at:", { promise, reason });
});
