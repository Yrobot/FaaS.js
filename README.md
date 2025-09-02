# FaaS.(js/ts)

> 一个 文件即服务的 docker 镜像

以 bun.sh 为基础环境，支持 js/ts 文件，以文件路径为请求路径，将 函数 以 服务的形式 进行暴露。

`api/hi/index.(ts/js)` => `POST/GET/... /api/hi`

- `api/hi/index.(ts/js)`

```ts
export function GET(req: Request) {
  return new Response("hello world");
}
```

## Quick Start

```bash
docker run -d -p 3000:3000 --name faas-js \
  -v $DOCKER_DATA_DIR/faas-js/app:/app \
  -e POST=3000 \
  ghcr.io/yrobot/faas-js:latest
```

### 在 `app/api` 下添加 ts 文件

> 文件 export 的 函数 需符合 Bun.serve 接口定义规范
> https://bun.com/docs/api/http#bun-serve

- 支持 `@` 的 ts alias

`util/time.ts`

```ts
import dayjs from "dayjs";

export const getTime = () => dayjs().format("YYYY-MM-DD HH:mm:ss");
```

`api/name/index.(ts/js)`

```ts
import { getTime } from "@/util/time";

export function POST(req: Request) {
  return Response.json({
    name: "FaaS.js",
    time: getTime(),
  });
}
```

## TODO

### 支持 Dynamic Routes

- `/api/xxx/:id`
- `/api/:scope/:id`

### 支持 Wildcard Routes

- `/api/all/*`

### 匹配优先级

> https://bun.com/docs/api/http#route-precedence

Routes are matched in order of specificity:

1. Exact routes (/users/all)
2. Parameter routes (/users/:id)
3. Wildcard routes (/users/\_)
4. Global catch-all (/\_)
