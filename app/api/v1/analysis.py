from fastapi import APIRouter

router = APIRouter()


@router.get("/correlation")
def get_correlation():
    return {"message": "TODO"}
