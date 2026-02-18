# ingestion/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pypdf import PdfReader
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Column name aliases — maps common variations
# to our canonical column names
# ─────────────────────────────────────────────
TEACHER_ALIASES = {
    "name":        ["name", "teacher name", "faculty name", "full name"],
    "email":       ["email", "email address", "mail"],
    "designation": ["designation", "title", "position", "role"],
}

SUBJECT_ALIASES = {
    "code":                ["code", "subject code", "course code", "sub code"],
    "title":               ["title", "subject name", "subject title", "course name", "name"],
    "weekly_credits":      ["weekly_credits", "credits", "hours", "teaching hours", "credit hours"],
    "preferred_room_type": ["preferred_room_type", "room type", "type", "room", "lecture/lab"],
}

def normalize_columns(df: pd.DataFrame, aliases: dict) -> pd.DataFrame:
    """Rename df columns to canonical names using alias map."""
    rename_map = {}
    lower_cols = {c.lower().strip(): c for c in df.columns}
    for canonical, variants in aliases.items():
        for v in variants:
            if v.lower() in lower_cols:
                rename_map[lower_cols[v.lower()]] = canonical
                break
    return df.rename(columns=rename_map)

def parse_csv(contents: bytes, data_type: str) -> list:
    df = pd.read_csv(io.BytesIO(contents))
    df.columns = df.columns.str.strip()

    if data_type == "teachers":
        df = normalize_columns(df, TEACHER_ALIASES)
        # Fill defaults for missing optional columns
        if "designation" not in df.columns:
            df["designation"] = ""
        df["department_id"]   = "MIT-ISE"
        df["is_available"]    = True
        df["max_daily_slots"] = 4
        keep = ["name", "email", "designation", "department_id", "is_available", "max_daily_slots"]
        df = df[[c for c in keep if c in df.columns]]
        df = df.dropna(subset=["name", "email"])

    elif data_type == "subjects":
        df = normalize_columns(df, SUBJECT_ALIASES)
        if "preferred_room_type" not in df.columns:
            df["preferred_room_type"] = "Lecture"
        df["department_id"] = "MIT-ISE"
        keep = ["code", "title", "weekly_credits", "preferred_room_type", "department_id"]
        df = df[[c for c in keep if c in df.columns]]
        df = df.dropna(subset=["code", "title"])
        # Normalize room type
        df["preferred_room_type"] = df["preferred_room_type"].str.strip().str.title()
        df["preferred_room_type"] = df["preferred_room_type"].replace({
            "Lab": "Lab", "Laboratory": "Lab",
            "Lecture": "Lecture", "Classroom": "Lecture",
            "Seminar": "Seminar Hall", "Seminar Hall": "Seminar Hall",
        })

    return df.to_dict(orient="records")


@app.post("/extract-data")
async def extract_data(
    file: UploadFile = File(...),
    data_type: str = "teachers"   # "teachers" | "subjects"
):
    contents  = await file.read()
    filename  = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            rows = parse_csv(contents, data_type)
            return {"type": "csv", "data_type": data_type, "data": rows}

        elif filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(contents))
            text   = "\n".join(page.extract_text() or "" for page in reader.pages)
            # For PDF we return raw text — frontend shows it for manual review
            return {"type": "pdf", "data_type": data_type, "raw_text": text, "data": []}

        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use CSV or PDF.")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)