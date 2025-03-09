from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.assessment import router as assessment_router

app = FastAPI(title="TradeWizard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(assessment_router)

@app.get("/")
async def root():
    return {"message": "Welcome to the TradeWizard API"} 