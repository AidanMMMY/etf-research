from fastapi import APIRouter

router = APIRouter()


@router.get("/{code}/history")
def get_history(code: str):
    return {"message": f"TODO {code}"}
