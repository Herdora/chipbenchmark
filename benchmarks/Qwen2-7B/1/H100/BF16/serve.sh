set -euo pipefail

MODEL="Qwen/Qwen2-7B"
TENSOR_PARALLEL_SIZE=1
DTYPE="bfloat16"
PORT="${PORT:-8003}"
GPU_ID="${GPU_ID:-6}" # CHANGE DEPENDING ON ALLOCATED GPUS

export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code
