#!/usr/bin/env bash

DOCKER_IMAGE="vllm/vllm-openai:v0.9.1" # 9.1 to match latest rocm stable release. This image found at (https://hub.docker.com/layers/vllm/vllm-openai/v0.9.1/images/sha256-0b51ec38fb965b44f6aa75d8d847c5f21bc062b7140e1d83444b39b67fc4a2ea)
CURRENT_DIR=$(pwd)
CONTAINER_DIR="/vllm-workspace"

echo ">>> Starting Docker container"
echo ">>> Mounting: $CURRENT_DIR -> $CONTAINER_DIR"
echo ">>> Installing tmux in container..."

docker run -it \
  --entrypoint bash \
  --gpus all \
  --network host \
  --ipc host \
  --cap-add SYS_PTRACE \
  --security-opt seccomp=unconfined \
  -v "$CURRENT_DIR:$CONTAINER_DIR" \
  -w "$CONTAINER_DIR" \
  "$DOCKER_IMAGE" \
  -c "apt-get update && apt-get install -y tmux && bash"
  
 