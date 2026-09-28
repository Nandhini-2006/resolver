# AWS Error Resolver

AI-powered AWS error diagnosis system built with Qwen2.5-3B, QLoRA fine-tuning, and FastAPI.

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Machine Learning Pipeline](#machine-learning-pipeline)
5. [Dataset](#dataset)
6. [Base Model](#base-model)
7. [Fine-Tuning Methodology](#fine-tuning-methodology)
8. [Training Configuration](#training-configuration)
9. [Model Parameters](#model-parameters)
10. [Training Checkpoints](#training-checkpoints)
11. [Inference Architecture](#inference-architecture)
12. [API Reference](#api-reference)
13. [Getting Started](#getting-started)
14. [Project Structure](#project-structure)
15. [AWS Services Covered](#aws-services-covered)
16. [Technology Stack](#technology-stack)
17. [Limitations](#limitations)
18. [Future Roadmap](#future-roadmap)
19. [Development Workflow](#development-workflow)
20. [License](#license)

---

## Overview

AWS Error Resolver is a domain-specific Generative AI system that analyzes AWS error messages and generates a probable diagnosis, root cause, remediation steps, and verification steps.

The system fine-tunes Qwen2.5-3B-Instruct using QLoRA (Quantized Low-Rank Adaptation) on a structured dataset of 5,000 AWS troubleshooting examples, and serves the resulting model through a FastAPI REST API for real-time inference.

The project demonstrates an end-to-end applied machine learning workflow — dataset design, parameter-efficient fine-tuning, quantization, and production-style API deployment — applied to a practical DevOps/cloud engineering problem.

---

## Key Features

| Category | Capability |
|---|---|
| Modeling | Domain-specific fine-tuning of Qwen2.5-3B-Instruct |
| Efficiency | QLoRA parameter-efficient fine-tuning with 4-bit NF4 quantization |
| Data | 5,000-example curated AWS troubleshooting dataset with train/validation/test split |
| Coverage | Multi-service AWS error diagnosis across 16 core AWS services |
| Output | Root-cause analysis, remediation guidance, and verification steps |
| Serving | FastAPI inference backend with interactive Swagger documentation |
| Performance | GPU-efficient training and inference on constrained hardware |
| Reproducibility | Complete training checkpoints retained for evaluation and rollback |

---

## System Architecture

```
AWS Error + Context
        |
        v
     FastAPI
        |
        v
 Qwen2.5-3B-Instruct
        |
        +-- QLoRA Adapter
        |
        v
  Error Diagnosis
        |
        +-- Probable Cause
        +-- Diagnosis
        +-- Remediation
        +-- Verification
```

---

## Machine Learning Pipeline

```
AWS Troubleshooting Dataset
          |
          v
   Data Structuring
          |
          v
Train / Validation / Test Split
          |
          v
   Qwen2.5-3B-Instruct
          |
          v
    4-bit Quantization
          |
          v
    QLoRA Configuration
          |
          v
  Supervised Fine-Tuning
          |
          v
   Checkpoint Evaluation
          |
          v
  Fine-Tuned AWS Resolver
          |
          v
     FastAPI Deployment
```

---

## Dataset

A structured dataset of 5,000 AWS troubleshooting examples was designed specifically for this project.

**Schema fields:**

| Field | Description |
|---|---|
| `service` | AWS service involved (e.g., S3, EC2, Lambda) |
| `error` | Error code or identifier |
| `error_message` | Raw error message text |
| `context` | Situational context in which the error occurred |
| `cause` | Underlying root cause |
| `diagnosis` | Explanation of why the error occurred |
| `solution` | Recommended remediation |
| `verification` | Steps to confirm resolution |
| `output` | Final formatted model response |

Each example was converted into an instruction-following conversational format:

| Role | Content |
|---|---|
| System | AWS troubleshooting instructions |
| User | AWS service, error, and context |
| Assistant | Cause, diagnosis, solution, and verification |

**Dataset split:**

| Split | Examples |
|---|---|
| Training | 4,000 |
| Validation | 500 |
| Test | 500 |
| Total | 5,000 |

Note: This is a structured, synthetic/curated dataset built for this project. It is not an official AWS incident dataset, and because training and test data share structured patterns, test performance should not be interpreted as a real-world accuracy benchmark.

---

## Base Model

Model: `Qwen/Qwen2.5-3B-Instruct`

The model was selected as a balance between language understanding capability and the computational resources available for fine-tuning.

Training hardware: NVIDIA Tesla T4 (14.56 GB VRAM)

---

## Fine-Tuning Methodology

### Why QLoRA

Full fine-tuning of a 3-billion-parameter model would require updating billions of weights and substantially more GPU memory than was available. QLoRA (Quantized Low-Rank Adaptation) addresses this by loading the frozen base model in 4-bit precision and training only lightweight, low-rank adapter matrices on top of it.

```
        Qwen2.5-3B
            |
      4-bit Quantized
            |
            v
     Frozen Base Model
            |
            +
      LoRA Adapters
            |
            v
   Trainable Parameters
            |
            v
   AWS Domain Adaptation
```

This approach makes fine-tuning a 3B-parameter model computationally feasible on a single mid-range GPU.

### Quantization Configuration

| Setting | Value |
|---|---|
| Quantization | 4-bit |
| Quantization Type | NF4 |
| Compute Type | Float16 |
| Double Quantization | Enabled |
| Implementation | BitsAndBytes |

### LoRA Configuration

| Parameter | Value |
|---|---|
| Rank (r) | 16 |
| LoRA Alpha | 32 |
| Dropout | 0.05 |
| Task Type | Causal Language Modeling |
| Target Modules | `q_proj`, `k_proj`, `v_proj`, `o_proj` |

LoRA adapters were applied to the attention projection layers, so only a small set of additional parameters required optimization during training.

---

## Training Configuration

| Parameter | Value |
|---|---|
| Epochs | 3 |
| Training Examples | 4,000 |
| Validation Examples | 500 |
| Per-Device Batch Size | 1 |
| Gradient Accumulation Steps | 4 |
| Effective Batch Size | 4 |
| Learning Rate | 2e-4 |
| Weight Decay | 0.01 |
| Quantization | 4-bit NF4 |
| GPU | NVIDIA Tesla T4 |
| GPU Memory | 14.56 GB |

Gradient accumulation was used to increase the effective batch size while keeping the per-device memory footprint within the constraints of the available GPU. Training ran for approximately 3,000 optimizer steps, with the final checkpoint saved as `checkpoint-3000`.

---

## Model Parameters

| Metric | Value |
|---|---|
| Total Base Model Parameters | Approximately 3.09 billion |
| Trainable LoRA Parameters | Approximately 7.37 million |
| Trainable Parameter Ratio | Approximately 0.24% |

```
   3B Parameter Base Model
            |
          Frozen
            v
     Small LoRA Adapter
            |
         Trainable
            v
 AWS Troubleshooting Behavior
```

By training less than 0.25% of the total parameter count, the model achieves domain adaptation without the cost of full fine-tuning.

---

## Training Checkpoints

```
aws-qwen-lora/
├── checkpoint-1000/
├── checkpoint-2000/
├── checkpoint-3000/   (final checkpoint used for inference)
├── checkpoint-4/
└── checkpoint-6/
```

**Key inference artifacts:**

| File | Purpose |
|---|---|
| `adapter_model.safetensors` | Trained LoRA adapter weights |
| `adapter_config.json` | LoRA configuration metadata |
| `tokenizer.json` | Tokenizer definition |
| `tokenizer_config.json` | Tokenizer configuration |
| `chat_template.jinja` | Instruction-format chat template |

---

## Inference Architecture

The deployed model is reconstructed at inference time by loading the base model and attaching the trained adapter:

```
Qwen2.5-3B-Instruct
        +
   checkpoint-3000
        |
        v
Fine-Tuned AWS Error Resolver
```

### Example

**Input**

```json
{
  "service": "Amazon S3",
  "error": "AccessDenied: Access Denied",
  "context": "Application cannot download an S3 object."
}
```

**Generated Output**

```
Diagnosis:
The request is being rejected because the calling IAM
identity may not have permission to access the object.

Possible Solution:
Verify the IAM policy, bucket policy, object ownership,
and required s3:GetObject permission.

Verification:
Retry the object request after confirming the effective
permissions.
```

The generated response is a probable troubleshooting suggestion and should be independently verified before applying changes to production infrastructure.

---

## API Reference

The fine-tuned model is served through a FastAPI REST API.

### POST /diagnose

**Request Body**

```json
{
  "service": "Amazon EC2",
  "error": "InvalidAMIID.NotFound",
  "context": "The specified AMI cannot be found when launching the instance."
}
```

**Response Body**

```json
{
  "service": "Amazon EC2",
  "error": "InvalidAMIID.NotFound",
  "diagnosis": "The specified AMI may not exist in the selected region or account. Verify the AMI ID, region, and AMI availability before retrying."
}
```

Interactive, auto-generated API documentation is available at:

```
/docs
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- pip
- CUDA-capable GPU (recommended for inference; CPU inference will be significantly slower)

### Installation

```bash
git clone https://github.com/<your-username>/Aws_Resolver.git
cd Aws_Resolver/backend
pip install -r requirements.txt
```

### Running the API

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Once running, the API will be available at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs`.

### Sample Request (cURL)

```bash
curl -X POST "http://localhost:8000/diagnose" \
  -H "Content-Type: application/json" \
  -d '{
        "service": "Amazon EC2",
        "error": "InvalidAMIID.NotFound",
        "context": "The specified AMI cannot be found when launching the instance."
      }'
```

---

## Project Structure

```
Aws_Resolver/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── dataset/
│   │   └── aws_troubleshooting_5000.csv
│   └── model_layer/
│       └── qwen/
│           ├── checkpoint-6/
│           └── aws-qwen-lora/
│               ├── checkpoint-1000/
│               ├── checkpoint-2000/
│               ├── checkpoint-3000/
│               └── ...
└── README.md
```

---

## AWS Services Covered

The dataset and model provide troubleshooting coverage for:

- Amazon EC2
- Amazon S3
- AWS Lambda
- Amazon RDS
- Amazon DynamoDB
- Amazon ECR
- AWS IAM
- AWS CloudFormation
- Amazon SQS
- Amazon SNS
- Amazon API Gateway
- Amazon CloudWatch
- Amazon VPC
- Amazon ECS
- Amazon EKS
- AWS Secrets Manager

---

## Technology Stack

| Layer | Tools & Frameworks |
|---|---|
| Machine Learning | Python, PyTorch, Hugging Face Transformers, Hugging Face Datasets, TRL, PEFT, BitsAndBytes |
| Base Model | Qwen2.5-3B-Instruct |
| Fine-Tuning | LoRA / QLoRA |
| Backend | FastAPI, Pydantic, Uvicorn |
| Infrastructure | Google Colab, NVIDIA Tesla T4, CUDA |
| Version Control | Git, GitHub |

---

## Limitations

- The system generates probable troubleshooting suggestions; it does not guarantee that every recommendation is correct.
- It does not directly inspect live AWS accounts, infrastructure state, CloudTrail logs, or CloudWatch metrics.
- The training dataset is structured and synthetic/curated rather than derived from real-world AWS incident data. Because training and test examples share structural patterns, test-set performance should not be treated as a real-world accuracy benchmark.

---

## Future Roadmap

- Retrieval-Augmented Generation (RAG) grounded in official AWS documentation
- Source citations for generated recommendations
- Expansion to a larger, real-world AWS troubleshooting dataset
- Automated evaluation benchmarks
- Direct CloudWatch and CloudTrail log analysis
- Terraform and CloudFormation configuration analysis
- Multi-turn, conversational troubleshooting
- AWS account-aware diagnostics (via read-only IAM roles)
- Production-grade cloud deployment (containerized, autoscaled)

**Target architecture:**

```
AWS Error
    |
    v
 FastAPI
    |
    +---------------> AWS Documentation
    |                        |
    |                  Vector Retrieval
    |                        |
    v                        v
Error Processing ----> Relevant Context
    |                        |
    +------------+-----------+
                 |
                 v
         Fine-Tuned Qwen
                 |
                 v
         Grounded Diagnosis
                 |
                 v
          Solution + Sources
```

---

## Development Workflow

```
Problem Definition
        |
        v
Dataset Creation
        |
        v
Data Preparation
        |
        v
Qwen2.5-3B Selection
        |
        v
4-bit Quantization
        |
        v
QLoRA Configuration
        |
        v
Supervised Fine-Tuning
        |
        v
Checkpoint Evaluation
        |
        v
Model Inference
        |
        v
FastAPI Integration
        |
        v
API Testing
        |
        v
GitHub Deployment
```

---

## Project Outcome

This project demonstrates the practical application of parameter-efficient fine-tuning to adapt an open-source large language model for a specialized, domain-specific troubleshooting task — combining dataset engineering, quantization, QLoRA, and production API design into a single, deployable system.

```
AWS Troubleshooting Dataset
          +
      Qwen2.5-3B
          +
   4-bit Quantization
          +
        QLoRA
          +
Supervised Fine-Tuning
          +
       FastAPI
          =
  AWS Error Resolver
```

---

## License

This project is developed for educational and research purposes.

## Author

Feel free to connect for questions, feedback, or collaboration opportunities.
