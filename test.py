import openai

client = openai.OpenAI(base_url="http://localhost:8080/v1", api_key="not-needed")

# Use the first model (qwen2.5-7b)
r1 = client.chat.completions.create(
    model="default",
    messages=[{"role": "user", "content": "Say hello in one word."}]
)
print(r1.choices[0].message.content)