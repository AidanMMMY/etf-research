from fastapi import APIRouter

router = APIRouter()


@router.get("/{code}")
def get_indicators(code: str):
    return {"message": f"TODO {code}"}
