set -euo pipefail

MODEL_NAME="RedHatAI/Meta-Llama-3-70B-Instruct-FP8"
MODEL=${1:-$MODEL_NAME}
PORT="${PORT:-8000}"
SERVER_URL="http://localhost:$PORT"
ISL_OSL=("200:200" "500:2000" "1000:1000" "5000:500" "10000:1000")
CONCURRENCY_LEVELS=(1 64 128 256)
LOGFILE="data.log"
JSONFILE="data.json"

export VLLM_USE_V1=1


parse_vllm_output() {
    local output="$1"
    local isl="$2"
    local osl="$3"
    local concurrency="$4"

    local successful_requests=$(echo "$output" | grep "Successful requests:" | awk '{print $3}')
    local benchmark_duration=$(echo "$output" | grep "Benchmark duration" | awk '{print $4}')
    local total_input_tokens=$(echo "$output" | grep "Total input tokens:" | awk '{print $4}')
    local total_generated_tokens=$(echo "$output" | grep "Total generated tokens:" | awk '{print $4}')
    local request_throughput=$(echo "$output" | grep "Request throughput" | awk '{print $4}')
    local output_token_throughput=$(echo "$output" | grep "Output token throughput" | awk '{print $5}')
    local total_token_throughput=$(echo "$output" | grep "Total Token throughput" | awk '{print $5}')

    local mean_ttft=$(echo "$output" | grep "Mean TTFT" | awk '{print $4}')
    local median_ttft=$(echo "$output" | grep "Median TTFT" | awk '{print $4}')
    local p99_ttft=$(echo "$output" | grep "P99 TTFT" | awk '{print $4}')

    local mean_tpot=$(echo "$output" | grep "Mean TPOT" | awk '{print $4}')
    local median_tpot=$(echo "$output" | grep "Median TPOT" | awk '{print $4}')
    local p99_tpot=$(echo "$output" | grep "P99 TPOT" | awk '{print $4}')

    local mean_itl=$(echo "$output" | grep "Mean ITL" | awk '{print $4}')
    local median_itl=$(echo "$output" | grep "Median ITL" | awk '{print $4}')
    local p99_itl=$(echo "$output" | grep "P99 ITL" | awk '{print $4}')

    local mean_e2el=$(echo "$output" | grep "Mean E2EL" | awk '{print $4}')
    local median_e2el=$(echo "$output" | grep "Median E2EL" | awk '{print $4}')
    local p99_e2el=$(echo "$output" | grep "P99 E2EL" | awk '{print $4}')

    cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "model": "$MODEL",
  "input_sequence_length": $isl,
  "output_sequence_length": $osl,
  "concurrency": $concurrency,
  "metrics": {
    "successful_requests": $successful_requests,
    "benchmark_duration_s": $benchmark_duration,
    "total_input_tokens": $total_input_tokens,
    "total_generated_tokens": $total_generated_tokens,
    "request_throughput_req_s": $request_throughput,
    "output_token_throughput_tok_s": $output_token_throughput,
    "total_token_throughput_tok_s": $total_token_throughput,
    "ttft": { "mean_ms": $mean_ttft, "median_ms": $median_ttft, "p99_ms": $p99_ttft },
    "tpot": { "mean_ms": $mean_tpot, "median_ms": $median_tpot, "p99_ms": $p99_tpot },
    "itl":  { "mean_ms": $mean_itl,  "median_ms": $median_itl,  "p99_ms": $p99_itl },
    "e2el": { "mean_ms": $mean_e2el, "median_ms": $median_e2el, "p99_ms": $p99_e2el }
  }
}
EOF
}

echo "[" > "$JSONFILE"
first_entry=true

{
  echo "=== $MODEL Benchmark started $(date) ==="
  echo "Model: $MODEL"
  echo "Server URL: $SERVER_URL"
  echo "Concurrency levels: ${CONCURRENCY_LEVELS[*]}"
  echo ""

  echo "--- Checking server health ---"
  if ! curl -s "$SERVER_URL/health" > /dev/null; then
    echo "❌ Error: vLLM server is not running at $SERVER_URL"
    echo "Please start the server first using your serve.sh script"
    exit 1
  fi
  echo "✅ Server is running"
  echo ""

  echo "--- Warming up ---"
  vllm bench serve \
    --model "$MODEL" \
    --base-url "$SERVER_URL" \
    --endpoint-type openai \
    --dataset-name random \
    --random-input-len 64 \
    --random-output-len 8 \
    --max-concurrency 1 \
    --num-prompts 10 \
    --trust-remote-code \
    --ignore-eos > /dev/null 2>&1 || true

  for in_out in "${ISL_OSL[@]}"; do
    isl=$(echo "$in_out" | cut -d':' -f1)
    osl=$(echo "$in_out" | cut -d':' -f2)

    for CONCURRENCY in "${CONCURRENCY_LEVELS[@]}"; do
      echo ""
      echo "--- Running benchmark: ISL=$isl, OSL=$osl, CONCURRENCY=$CONCURRENCY ---"


      prompt_count=$((CONCURRENCY * 4))

      temp_output=$(mktemp)
      

      vllm bench serve \
        --model "$MODEL" \
        --base-url "$SERVER_URL" \
        --endpoint-type openai \
        --dataset-name random \
        --random-input-len "$isl" \
        --random-output-len "$osl" \
        --max-concurrency "$CONCURRENCY" \
        --num-prompts "$prompt_count" \
        --trust-remote-code \
        --ignore-eos \
        --percentile_metrics ttft,tpot,itl,e2el 2>&1 | tee "$temp_output"


      if grep -q "Serving Benchmark Result" "$temp_output"; then

        if [ "$first_entry" = false ]; then
          echo "," >> "$JSONFILE"
        fi
        parse_vllm_output "$(cat "$temp_output")" "$isl" "$osl" "$CONCURRENCY" >> "$JSONFILE"
        first_entry=false


        sync


        temp_json=$(mktemp)
        head -n -1 "$JSONFILE" > "$temp_json"
        echo "]" >> "$temp_json"  
        cp "$temp_json" "data_snapshot.json"
        rm -f "$temp_json"


        echo ""
        echo "Key metrics:"
        echo "  Output token throughput: $(grep "Output token throughput" "$temp_output" | awk '{print $5}') tok/s"
        echo "  Request throughput: $(grep "Request throughput" "$temp_output" | awk '{print $4}') req/s"
        echo "  Mean TTFT: $(grep "Mean TTFT" "$temp_output" | awk '{print $4}') ms"
        echo "  Mean TPOT: $(grep "Mean TPOT" "$temp_output" | awk '{print $4}') ms"
        
        echo "Progress: Completed ${isl}:${osl} at concurrency ${CONCURRENCY}"
      else
        echo "ERROR: Benchmark failed for ISL=$isl, OSL=$osl, CONCURRENCY=$CONCURRENCY"
      fi

      rm -f "$temp_output"


      sleep 5
    done
  done

  echo ""
  echo "=== Benchmark completed $(date) ==="
} 2>&1 | tee -a "$LOGFILE"

echo "]" >> "$JSONFILE"

echo ""
echo "=== Summary ==="
echo "Results saved to:"
echo "  JSON: $JSONFILE"
echo "  Log:  $LOGFILE"
echo "  Snapshot: data_snapshot.json (valid JSON updated after each test)"
echo ""
echo "To view results:"
echo "  cat $JSONFILE | jq '.[] | {config: .input_sequence_length + \":\" + .output_sequence_length, concurrency: .concurrency, throughput: .metrics.output_token_throughput_tok_s, ttft: .metrics.ttft.mean_ms, tpot: .metrics.tpot.mean_ms}'" 