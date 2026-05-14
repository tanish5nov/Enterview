#!/bin/sh
set -e

MODEL="${OLLAMA_MODEL:-qwen2.5:0.5b}"

# start Ollama in the background
ollama serve &
OLLAMA_PID=$!

# wait for Ollama to be ready
echo "Waiting for Ollama to start..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 2
done

# pull the model if not already present
MODEL_BASE="${MODEL%%:*}"
if ! ollama list | grep -q "$MODEL_BASE"; then
  echo "Pulling model: $MODEL"
  ollama pull "$MODEL"
fi

echo "Ollama ready with model: $MODEL"
wait $OLLAMA_PID
