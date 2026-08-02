from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "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"
)


completion = client.chat.completions.create(
  model="deepseek-ai/deepseek-v4-pro",
  messages=[{"role":"user","content":""}],
  temperature=1,
  top_p=0.95,
  max_tokens=16384,
  extra_body={"chat_template_kwargs":{"thinking":False}},
  stream=False
)

print(completion.choices[0].message.content)