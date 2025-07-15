MODEL="meta-llama/Llama-3.1-8B-Instruct"

TENSOR_PARALLEL_SIZE=4
DTYPE="bfloat16"
PORT="${PORT:-8001}"
GPU_ID="${GPU_ID:-4,5,6,7}"

export VLLM_USE_V1=1
export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID

echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code