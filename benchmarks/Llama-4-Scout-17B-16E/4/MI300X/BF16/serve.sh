set -euo pipefail

MODEL="meta-llama/Llama-4-Scout-17B-16E"
TENSOR_PARALLEL_SIZE=4
DTYPE="bfloat16"
PORT="${PORT:-8000}"
GPU_ID="${GPU_ID:-0,1,2,3}"

export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

# FOR THIS RUN
export SAFETENSORS_FAST_GPU=1
export VLLM_WORKER_MULTIPROC_METHOD=spawn
export VLLM_USE_MODELSCOPE=False

echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code
