set -euo pipefail

MODEL="RedHatAI/Meta-Llama-3-70B-Instruct-FP8"
TENSOR_PARALLEL_SIZE=1
PORT="${PORT:-8000}"
GPU_ID="${GPU_ID:-0}"

export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --trust-remote-code
