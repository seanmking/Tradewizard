from setuptools import setup, find_packages

with open("requirements.txt") as f:
    requirements = [
        line for line in f.read().splitlines()
        if not line.startswith('#') and line.strip()
    ]

setup(
    name="export-intelligence-scraper",
    version="0.1.0",
    description="Export Market Intelligence Scraper Framework",
    author="TradeKing",
    author_email="info@tradeking.com",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "export-intel=export_intelligence.main:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Business/Industry",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
) 