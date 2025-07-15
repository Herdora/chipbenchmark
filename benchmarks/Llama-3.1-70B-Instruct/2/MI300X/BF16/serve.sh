set -euo pipefail

MODEL="meta-llama/Llama-3.1-70B-Instruct"
TENSOR_PARALLEL_SIZE=2
DTYPE="bfloat16"
PORT="${PORT:-8002}"
GPU_ID="${GPU_ID:-2,3}"

export CUDA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code
