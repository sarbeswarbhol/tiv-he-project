from sqlalchemy.orm import Session
from models import User

def get_user_by_public_id(db: Session, public_id: str):
    return db.query(User).filter(User.public_id == public_id).first()