from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_etfs():
    return {"message": "TODO"}
