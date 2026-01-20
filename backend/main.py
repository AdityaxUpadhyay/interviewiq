from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
import os
from typing import List
import logging
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="InterviewIQ API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client for OpenRouter
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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"
)

@app.on_event("startup")
async def startup_event():
    logger.info("Application startup complete - ready to accept requests")

# Pydantic models
class JobDescription(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    experience_level: str = Field(..., pattern="^(entry|mid|senior)$")

class InterviewQuestion(BaseModel):
    question: str
    category: str
    difficulty: str

class QuestionsResponse(BaseModel):
    questions: List[InterviewQuestion]
    job_title: str

class AnswerRequest(BaseModel):
    question: str
    answer: str
    job_context: str

class FeedbackResponse(BaseModel):
    score: int
    strengths: List[str]
    improvements: List[str]
    sample_answer: str

@app.get("/")
async def root():
    return {
        "message": "InterviewIQ API",
        "status": "running",
        "endpoints": ["/generate-questions", "/evaluate-answer"]
    }

@app.post("/generate-questions", response_model=QuestionsResponse)
async def generate_questions(job: JobDescription):
    """Generate interview questions based on job description"""
    try:
        logger.info(f"Generating questions for: {job.title}")
        
        prompt = f"""Generate 5 interview questions for this job:

Title: {job.title}
Experience Level: {job.experience_level}
Description: {job.description}

Return ONLY a JSON object with this structure:
{{
    "questions": [
        {{
            "question": "question text",
            "category": "technical|behavioral|situational",
            "difficulty": "easy|medium|hard"
        }}
    ]
}}"""
        
        response = await client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct:free",
            messages=[
                {"role": "system", "content": "You are an expert interview coach. Generate relevant, realistic interview questions based on job descriptions. Return questions in JSON format."},
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = response.choices[0].message.content
        
        # Clean response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        parsed = json.loads(response_text.strip())
        
        return QuestionsResponse(
            questions=[InterviewQuestion(**q) for q in parsed["questions"]],
            job_title=job.title
        )
        
    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

@app.post("/evaluate-answer", response_model=FeedbackResponse)
async def evaluate_answer(answer_data: AnswerRequest):
    """Evaluate user's answer and provide feedback"""
    try:
        logger.info(f"Evaluating answer for question: {answer_data.question[:50]}...")
        
        prompt = f"""Evaluate this interview answer:

Question: {answer_data.question}
Job Context: {answer_data.job_context}
Candidate's Answer: {answer_data.answer}

Return ONLY a JSON object with this structure:
{{
    "score": 7,
    "strengths": ["point 1", "point 2"],
    "improvements": ["suggestion 1", "suggestion 2"],
    "sample_answer": "A strong answer example..."
}}"""
        
        response = await client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct:free",
            messages=[
                {"role": "system", "content": "You are an expert interview coach providing constructive feedback. Analyze answers and provide scores, strengths, improvements, and sample answers. Be encouraging but honest."},
                {"role": "user", "content": prompt}
            ]
        )
        
        response_text = response.choices[0].message.content
        
        # Clean response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
            
        parsed = json.loads(response_text.strip())
        
        return FeedbackResponse(**parsed)
        
    except Exception as e:
        logger.error(f"Error evaluating answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "InterviewIQ"}

if __name__ == "__main__":
    import uvicorn
    import os
    # Get port from environment, default to 8000
    port = int(os.environ.get("PORT", 8000))
    # Log the port for debugging
    print(f"Starting server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
