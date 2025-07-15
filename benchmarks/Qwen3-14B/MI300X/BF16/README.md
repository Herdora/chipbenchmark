# Qwen3-14B MI300X FP8 Benchmark

## Model Attribution

This benchmark uses the **Qwen3-14B** model.

- **Model**: [Qwen/Qwen3-14B](https://huggingface.co/Qwen/Qwen3-14B)
- **Developer**: Qwen Team
- **Release Date**: January 2025
- **License**: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **Model Architecture**: Causal Language Model with optimized transformer architecture
- **Parameters**: 14.8B (13.2B non-embedding)
- **Context Length**: 32,768 tokens natively (up to 131,072 with YaRN scaling)
- **Supported Languages**: 100+ languages and dialects
- **Key Features**: Thinking mode, enhanced reasoning, agent capabilities, multilingual support
- **Intended Use**: Commercial and research use for reasoning, instruction-following, and agent tasks

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
