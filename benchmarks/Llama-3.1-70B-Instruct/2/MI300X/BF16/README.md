# Llama-3.1-70B-Instruct MI300X BF16 Benchmark

## Model Attribution

This benchmark uses the **Llama-3.1-70B-Instruct** model.

- **Model**: [meta-llama/Llama-3.1-70B-Instruct](https://huggingface.co/meta-llama/Llama-3.1-70B-Instruct)
- **Developer**: Meta
- **Release Date**: July 23, 2024
- **License**: [Llama 3.1 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/LICENSE)
- **Model Architecture**: Auto-regressive language model using optimized transformer architecture
- **Parameters**: 70B
- **Context Length**: 128k tokens
- **Supported Languages**: English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai

## Quick Start

**Note: Run these commands from the BF16 directory**

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
