set -euo pipefail

<<<<<<< HEAD
MODEL="meta-llama/Llama-3.1-70B-Instruct"
TENSOR_PARALLEL_SIZE=4
DTYPE="bfloat16"
PORT="${PORT:-8004}"
GPU_ID="${GPU_ID:-0,1,4,5}"
=======
MODEL="meta-llama/Llama-4-Scout-17B-16E"
TENSOR_PARALLEL_SIZE=4
DTYPE="bfloat16"
PORT="${PORT:-8004}"
GPU_ID="${GPU_ID:-4,5,6,7}"
>>>>>>> d1ca277 (Add mi300x benchmarks (some complete, some running).)

export CUDA_VISIBLE_DEVICES=$GPU_ID
export HSA_VISIBLE_DEVICES=$GPU_ID
export VLLM_USE_V1=1

<<<<<<< HEAD
=======
# FOR THIS RUN
export SAFETENSORS_FAST_GPU=1
export VLLM_WORKER_MULTIPROC_METHOD=spawn
export VLLM_USE_MODELSCOPE=False

>>>>>>> d1ca277 (Add mi300x benchmarks (some complete, some running).)
echo ">>> Starting vLLM server on GPU $GPU_ID (port $PORT) for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --port "$PORT" \
  --dtype "$DTYPE" \
  --trust-remote-code
