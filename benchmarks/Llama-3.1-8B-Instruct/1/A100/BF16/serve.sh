MODEL="meta-llama/Llama-3.1-8B-Instruct"

TENSOR_PARALLEL_SIZE=1
DTYPE="bfloat16"
PORT="${PORT:-8000}"
GPU_ID="${GPU_ID:-0}"

export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

echo ">>> Starting vLLM server for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code
