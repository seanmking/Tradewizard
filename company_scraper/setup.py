from setuptools import setup, find_packages

setup(
    name="company_scraper",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "Scrapy>=2.12.0",
        "ipython>=8.0.0",
        "pydantic>=2.0.0",
    ],
    python_requires=">=3.8",
    author="TradeKing",
    description="A web scraper to extract company information in a standardized format",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
) 