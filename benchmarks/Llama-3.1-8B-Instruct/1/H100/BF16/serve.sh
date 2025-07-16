MODEL="meta-llama/Llama-3.1-8B-Instruct"

TENSOR_PARALLEL_SIZE=1

export VLLM_USE_V1=1

echo ">>> Starting vLLM server for model $MODEL"

vllm serve "$MODEL" \
  --tensor-parallel-size "$TENSOR_PARALLEL_SIZE" \
  --trust-remote-code
