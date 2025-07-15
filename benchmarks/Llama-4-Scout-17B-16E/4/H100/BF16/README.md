# Llama-4-Scout-17B-16E H100 BF16 Benchmark

## Model Attribution

This benchmark uses the **Meta Llama 4 Scout 17B 16E Instruct BF16** model.

- **Model**: [meta-llama/Llama-4-Scout-17B-16E](https://huggingface.co/meta-llama/Llama-4-Scout-17B-16E)
- **Release Date**: July 15, 2025
- **License**: [Llama 4 Community License](https://ai.meta.com/llama/license/)
- **Parameters**: 17B

## Quick Start

**Note: Run these commands from the BF16 directory**

### If Need to Add User to Docker Group
```bash
sudo usermod -aG docker $USER
```

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
