"""
Services package for handling business verification and validation.
This package contains both mock and real implementations of various services.
"""

from enum import Enum

class ServiceMode(Enum):
    MOCK = "mock"
    REAL = "real" 