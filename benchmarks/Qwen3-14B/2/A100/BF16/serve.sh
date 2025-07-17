set -euo pipefail

MODEL="Qwen/Qwen3-14B"
TENSOR_PARALLEL_SIZE=2
DTYPE="bfloat16"
PORT="${PORT:-8007}"
GPU_ID="${GPU_ID:-2,3}"

export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code
