# Docker 部署指南

## 快速开始

### 方式一：使用 Docker Compose（推荐）

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式二：使用 Docker 命令

```bash
# 构建镜像
docker build -t ai-cook-frontend:latest .

# 运行容器
docker run -d -p 3000:80 --name ai-cook-frontend ai-cook-frontend:latest

# 查看日志
docker logs -f ai-cook-frontend

# 停止并删除容器
docker stop ai-cook-frontend && docker rm ai-cook-frontend
```

## 访问应用

浏览器访问：http://localhost:3000

## 环境变量配置

如果需要在构建时传入环境变量，修改 Dockerfile：

```dockerfile
# 在 builder 阶段添加
ARG NEXT_PUBLIC_OSS_BUCKET
ENV NEXT_PUBLIC_OSS_BUCKET=$NEXT_PUBLIC_OSS_BUCKET
```

构建命令：

```bash
docker build --build-arg NEXT_PUBLIC_OSS_BUCKET=your-bucket -t ai-cook-frontend:latest .
```

## CI/CD 集成示例

### GitHub Actions

创建文件 `.github/workflows/docker-build.yml`：

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: docker.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata for Docker
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == format('refs/heads/{0}', 'main') }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### GitLab CI

创建文件 `.gitlab-ci.yml`：

```yaml
stages:
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  DOCKER_IMAGE_LATEST: $CI_REGISTRY_IMAGE:latest

docker-build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE -t $DOCKER_IMAGE_LATEST .
    - docker push $DOCKER_IMAGE
    - docker push $DOCKER_IMAGE_LATEST
  only:
    - main
    - develop

deploy-production:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker pull $DOCKER_IMAGE_LATEST
    - docker stop ai-cook-frontend || true
    - docker rm ai-cook-frontend || true
    - docker run -d -p 3000:80 --name ai-cook-frontend $DOCKER_IMAGE_LATEST
  only:
    - main
  when: manual
```

### Jenkins Pipeline

创建文件 `Jenkinsfile`：

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'ai-cook-frontend'
        REGISTRY = 'docker.io'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${env.BUILD_NUMBER}")
                }
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    docker.withRegistry("https://${REGISTRY}", 'docker-credentials') {
                        docker.image("${DOCKER_IMAGE}:${env.BUILD_NUMBER}").push()
                        docker.image("${DOCKER_IMAGE}:${env.BUILD_NUMBER}").push('latest')
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                    docker stop ${DOCKER_IMAGE} || true
                    docker rm ${DOCKER_IMAGE} || true
                    docker run -d -p 3000:80 --name ${DOCKER_IMAGE} ${DOCKER_IMAGE}:latest
                '''
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
```

## 生产环境建议

### 1. 使用多阶段构建优化镜像大小
当前配置已使用多阶段构建，最终镜像约 25MB。

### 2. 安全性配置
- 使用非 root 用户运行容器
- 限制容器资源使用
- 使用只读文件系统

修改 Dockerfile：

```dockerfile
# 在 runner 阶段添加
RUN addgroup -g 1001 -S nginx-user && \
    adduser -u 1001 -S nginx-user -G nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user
```

### 3. 健康检查

在 Dockerfile 中添加：

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

### 4. 资源限制

在 docker-compose.yml 中添加：

```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

## 常见问题

### Q: 构建失败，提示找不到 out 目录？
A: 确保项目配置了 `output: "export"`，并且 `npm run build` 能成功生成静态文件。

### Q: 如何查看容器内的文件？
A: 使用命令 `docker exec -it ai-cook-frontend sh`

### Q: 如何更新应用？
A: 
```bash
docker-compose down
docker-compose up -d --build
```

### Q: 如何查看镜像大小？
A: `docker images ai-cook-frontend`
