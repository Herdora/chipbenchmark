set -euo pipefail

MODEL="meta-llama/Llama-4-Scout-17B-16E"
TENSOR_PARALLEL_SIZE=4
DTYPE="bfloat16"
PORT="${PORT:-8003}"
GPU_ID="${GPU_ID:-2,3,4,5}" # CHANGE DEPENDING ON ALLOCATED GPUS

export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

# EXTRA FLAGS FOR RUN
export SAFETENSORS_FAST_GPU=1
export VLLM_WORKER_MULTIPROC_METHOD=spawn
export VLLM_USE_MODELSCOPE=False

echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code
