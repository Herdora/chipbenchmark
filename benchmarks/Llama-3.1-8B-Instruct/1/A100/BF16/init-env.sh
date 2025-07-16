#!/usr/bin/env bash

DOCKER_IMAGE="vllm/vllm-openai:v0.9.1"
CURRENT_DIR=$(pwd)
CONTAINER_DIR="/vllm-workspace"

echo ">>> Starting Docker container for Llama-3.1-8B-Instruct"
echo ">>> Mounting: $CURRENT_DIR -> $CONTAINER_DIR"

docker run -it \
  --entrypoint bash \
  --gpus all \
  --network host \
  --ipc host \
  --cap-add SYS_PTRACE \
  --security-opt seccomp=unconfined \
  -v "$CURRENT_DIR:$CONTAINER_DIR" \
  -w "$CONTAINER_DIR" \
  "$DOCKER_IMAGE"
  
 