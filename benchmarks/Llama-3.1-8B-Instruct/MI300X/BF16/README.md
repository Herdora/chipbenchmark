# Llama-3.1-8B-Instruct MI300X BF16 Benchmark

## Model Attribution

This benchmark uses the **Meta Llama 3.1 8B Instruct** model.

- **Model**: [meta-llama/Llama-3.1-8B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)
- **Developer**: Meta
- **Release Date**: July 23, 2024
- **License**: [Llama 3.1 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/LICENSE)
- **Model Architecture**: Auto-regressive language model using optimized transformer architecture
- **Parameters**: 8B
- **Context Length**: 128k tokens
- **Supported Languages**: English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai

## Prerequisites

```bash
# Install tmux if not available
sudo apt update && sudo apt install -y tmux
```

```bash
# Login to Hugging Face (for Meta-Llama models)
huggingface-cli login --token <your_token>
```

## Quick Start

**Note: Run these commands from the BF16 directory**

```bash
# Terminal 1: Start server session
tmux new-session -s server
./init-env.sh
./serve.sh

# Terminal 2: Start benchmark session  
tmux new-session -s bench
./init-env.sh
./bench.sh
```

## Tmux Controls
- `tmux attach -t server` - Attach to server session
- `tmux attach -t bench` - Attach to benchmark session
- `Ctrl+b d` - Detach from current session
- `tmux list-sessions` - Show all sessions

## Results
- `data.json` - Benchmark metrics
- `data.log` - Full benchmark log
- `data_snapshot.json` - Live snapshot
