from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def get_etl_status():
    return {"message": "TODO"}
