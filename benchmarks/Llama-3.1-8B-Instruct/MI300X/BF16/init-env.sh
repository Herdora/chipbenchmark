#!/usr/bin/env bash

DOCKER_IMAGE="rocm/vllm:rocm6.4.1_vllm_0.9.1_20250702"
CURRENT_DIR=$(pwd)
CONTAINER_DIR="/vllm-workspace"

echo ">>> Starting Docker container for Llama-3.1-8B-Instruct with AMD MI300X"
echo ">>> Mounting: $CURRENT_DIR -> $CONTAINER_DIR"

docker run -it \
  --network host \
  --ipc host \
  --cap-add SYS_PTRACE \
  --security-opt seccomp=unconfined \
  --group-add video \
  --device /dev/kfd \
  --device /dev/dri \
  -v "$CURRENT_DIR:$CONTAINER_DIR" \
  -w "$CONTAINER_DIR" \
  "$DOCKER_IMAGE" \
  bash
  
 