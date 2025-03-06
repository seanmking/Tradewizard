# Export Market Intelligence Scraper Framework

A flexible web scraping framework designed to collect competitor and customer data for SMEs looking to export, regardless of their industry or target market.

## Features

- **Dynamic Industry Configuration**: Adapts to any SME across different industries
- **Competitor & Customer Discovery**: Finds relevant businesses in target markets
- **Product Data Collection**: Extracts pricing and product information
- **Market Analysis**: Processes data to provide insights
- **Regional Market Integration**: Combines product data with market conditions and regulations
- **Local AI Integration**: Uses Ollama for data analysis

## Installation

### Requirements

- Python 3.8+
- pip

### Install from Source

```bash
# Clone the repository
git clone https://github.com/tradeking/export-intelligence-scraper.git
cd export-intelligence-scraper

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install the package in development mode
pip install -e .
```

## Usage

### Create Configuration

Create a configuration file interactively:

```bash
export-intel --create-config --save-config ./config.json
```

### Run Operations

Discover market players:

```bash
export-intel --config ./config.json --discover
```

Scrape product data:

```bash
export-intel --config ./config.json --scrape
```

Analyze collected data:

```bash
export-intel --config ./config.json --analyze
```

Export data to files:

```bash
export-intel --config ./config.json --export ./export_data
```

Filter operations by market:

```bash
export-intel --config ./config.json --scrape --market "United States"
```

### Full Command-Line Options

```
usage: export-intel [-h] [--config CONFIG] [--create-config] [--save-config SAVE_CONFIG] [--db-path DB_PATH] [--discover] [--scrape] [--analyze] [--export EXPORT] [--market MARKET] [--log-file LOG_FILE] [--verbose]

SME Export Intelligence Scraper

optional arguments:
  -h, --help            show this help message and exit

Configuration:
  --config CONFIG       Path to configuration file
  --create-config       Run interactive setup to create config
  --save-config SAVE_CONFIG
                        Path to save configuration

Database:
  --db-path DB_PATH     Path to SQLite database file

Execution:
  --discover            Discover market players
  --scrape              Scrape product data
  --analyze             Analyze data
  --export EXPORT       Export data to directory
  --market MARKET       Target specific market

Logging:
  --log-file LOG_FILE   Path to log file
  --verbose             Enable verbose logging
```

## Development

### Running Tests

```bash
# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest
```

### Code Structure

```
export_intelligence/
├── core/               # Core components
│   ├── config.py       # Configuration management
│   ├── network.py      # Network operations
│   ├── storage.py      # Data storage operations
│   └── logging.py      # Logging setup
├── extractors/         # Data extraction components
├── analysis/           # Analysis components
├── reporting/          # Reporting components
├── utils/              # Utility functions
├── tests/              # Tests
└── main.py             # Main entry point
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 