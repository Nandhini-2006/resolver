
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

app = FastAPI(title="AWS Error Resolver API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
CHECKPOINT = "model_layer/qwen/checkpoint-6"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto"
)

model = PeftModel.from_pretrained(
    base_model,
    CHECKPOINT
)

model.eval()


class AWSRequest(BaseModel):
    service: str
    error: str
    context: str = ""


@app.get("/")
def home():
    return {"message": "AWS Error Resolver API is running"}


@app.post("/diagnose")
def diagnose(request: AWSRequest):

    messages = [
        {
            "role": "system",
            "content": "You are an AWS troubleshooting assistant. Diagnose the AWS error and provide a possible solution."
        },
        {
            "role": "user",
            "content": (
                f"AWS Service: {request.service}\n"
                f"AWS Error: {request.error}\n"
                f"Context: {request.context}\n\n"
                "Provide diagnosis and possible solution."
            )
        }
    ]

    prompt = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = tokenizer(
        prompt,
        return_tensors="pt"
    ).to(model.device)

    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=300,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )

    answer = tokenizer.decode(
        output[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True
    )

    return {
        "service": request.service,
        "error": request.error,
        "diagnosis": answer
    }


print("✅ AWS Error Resolver loaded")
