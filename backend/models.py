from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Integer, String

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)


class FRAResult(Base):
    __tablename__ = "fra_results"

    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    classification = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    data = Column(JSON, nullable=False)

