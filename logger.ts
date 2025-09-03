/**
 * FaaS.js Logger
 *
 * ⚠️  请勿修改此文件！
 * ⚠️  此文件会在容器启动时从备份自动恢复
 * ⚠️  任何修改都会在下次重启时丢失
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS" | "DEBUG";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: any;
}

export const banner = `
╔══════════════════════════════════════╗
║            🚀 FaaS.js                ║
║        File as a Service             ║
║             @yrobot                  ║
║                                      ║
║  Transform your files into APIs      ║
║  Powered by Bun.sh                   ║
╚══════════════════════════════════════╝
    `;

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString().replace("T", " ").substring(0, 19);
  }

  private formatLogEntry(level: LogLevel, message: string): string {
    const timestamp = this.formatTimestamp();
    const levelIcon = this.getLevelIcon(level);
    const levelColor = this.getLevelColor(level);

    return `${levelColor}[${timestamp}] ${levelIcon} ${message}\x1b[0m`;
  }

  private getLevelIcon(level: LogLevel): string {
    switch (level) {
      case "INFO":
        return "";
      // return "📘";
      case "WARN":
        return "⚠️ ";
      case "ERROR":
        return "❌";
      case "SUCCESS":
        return "✅";
      case "DEBUG":
        return "🔍";
      default:
        return "";
      // return "📄";
    }
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case "INFO":
        return "\x1b[36m"; // Cyan
      case "WARN":
        return "\x1b[33m"; // Yellow
      case "ERROR":
        return "\x1b[31m"; // Red
      case "SUCCESS":
        return "\x1b[32m"; // Green
      case "DEBUG":
        return "\x1b[35m"; // Magenta
      default:
        return "\x1b[0m"; // Reset
    }
  }

  info(message: string, data?: any): void {
    console.log(this.formatLogEntry("INFO", message));
    if (data) {
      console.log(
        "\x1b[36m    📋 Data:",
        JSON.stringify(data, null, 2)
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n"),
        "\x1b[0m"
      );
    }
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatLogEntry("WARN", message));
    if (data) {
      console.warn(
        "\x1b[33m    📋 Data:",
        JSON.stringify(data, null, 2)
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n"),
        "\x1b[0m"
      );
    }
  }

  error(message: string, error?: any): void {
    console.error(this.formatLogEntry("ERROR", message));
    if (error) {
      console.error(error);
      // const errorStr =
      //   error instanceof Error
      //     ? `${error.name}: ${error.message}\n${error.stack}`
      //     : JSON.stringify(error, null, 2);
      // console.error(
      //   "\x1b[31m    💥 Error Details:\n" +
      //     errorStr
      //       .split("\n")
      //       .map((line) => `    ${line}`)
      //       .join("\n") +
      //     "\x1b[0m"
      // );
    }
  }

  success(message: string, data?: any): void {
    console.log(this.formatLogEntry("SUCCESS", message));
    if (data) {
      console.log(
        "\x1b[32m    📋 Data:",
        JSON.stringify(data, null, 2)
          .split("\n")
          .map((line) => `    ${line}`)
          .join("\n"),
        "\x1b[0m"
      );
    }
  }

  debug(message: string, data?: any): void {
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DEBUG === "true"
    ) {
      console.log(this.formatLogEntry("DEBUG", message));
      if (data) {
        console.log(
          "\x1b[35m    📋 Debug Data:",
          JSON.stringify(data, null, 2)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n"),
          "\x1b[0m"
        );
      }
    }
  }

  /**
   * 创建请求上下文日志器，用于特定请求的日志记录
   */
  createRequestLogger(method: string, path: string) {
    const requestId = Math.random().toString(36).substring(2, 8);
    const prefix = `[${requestId}] ${method} ${path}`;

    return {
      info: (message: string, data?: any) =>
        this.info(`${prefix} - ${message}`, data),
      warn: (message: string, data?: any) =>
        this.warn(`${prefix} - ${message}`, data),
      error: (message: string, error?: any) =>
        this.error(`${prefix} - ${message}`, error),
      success: (message: string, data?: any) =>
        this.success(`${prefix} - ${message}`, data),
      debug: (message: string, data?: any) =>
        this.debug(`${prefix} - ${message}`, data),
    };
  }

  /**
   * 打印启动横幅
   */
  printBanner(): void {
    console.log("\x1b[36m" + banner + "\x1b[0m");
  }
}

export const logger = new Logger();
