# Llama-3.1-8B-Instruct L40S BF16 Benchmark

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