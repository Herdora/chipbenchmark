# Llama-3-70B-Instruct MI300X FP8 Benchmark

## Model Attribution

This benchmark uses the **Meta Llama 3 70B Instruct FP8** model.

- **Model**: [RedHatAI/Meta-Llama-3-70B-Instruct-FP8](https://huggingface.co/RedHatAI/Meta-Llama-3-70B-Instruct-FP8)
- **Developer**: Neural Magic (quantized version of Meta's original model)
- **Release Date**: June 8, 2024
- **License**: [Llama 3 Community License](https://ai.meta.com/llama/license/)
- **Parameters**: 70B

## Quick Start

**Note: Run these commands from the FP8 directory**

### Initialize Environment First
```bash
# Initialize environment (run this before tmux)
./init-env.sh
# Login to Hugging Face (for Meta-Llama models)
huggingface-cli login --token <your_token>
```

### Option 1: Same Window (Split Panes)
```bash
# Start tmux session
tmux new-session -s benchmark

# Split window horizontally
Ctrl+b "

# In first pane (server):
./serve.sh

# Switch to second pane (Ctrl+b arrow keys) and run:
./bench.sh
```

### Option 2: Separate Sessions
```bash
# Terminal 1: Start server session
tmux new-session -s server
./serve.sh

# Terminal 2: Start benchmark session  
tmux new-session -s bench
./bench.sh
```


## Tmux Controls
- `tmux attach -t server` - Attach to server session
- `tmux attach -t bench` - Attach to benchmark session
- `tmux attach -t benchmark` - Attach to benchmark session (Option 1)
- `Ctrl+b d` - Detach from current session
- `Ctrl+b "` - Split window horizontally
- `Ctrl+b %` - Split window vertically
- `Ctrl+b arrow keys` - Switch between panes
- `Ctrl+b c` - Create new window
- `Ctrl+b n/p` - Next/Previous window
- `tmux list-sessions` - Show all sessions

## Results
- `data.json` - Benchmark metrics
- `data.log` - Full benchmark log
- `data_snapshot.json` - Live snapshot
