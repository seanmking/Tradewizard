from setuptools import setup, find_packages

setup(
    name="tradekingbackend",
    version="0.1.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask>=3.0.2',
        'flask-cors>=4.0.0',
        'flask-session>=0.7.0',
        'python-dotenv>=1.0.1',
        'requests>=2.31.0',
        'gunicorn>=21.2.0',
        'cachelib>=0.12.0'
    ],
    extras_require={
        'dev': [
            'pytest>=8.0.1',
            'pytest-asyncio>=0.23.5',
            'pytest-cov>=4.1.0',
            'black>=24.1.1',
            'isort>=5.13.2'
        ]
    }
) 