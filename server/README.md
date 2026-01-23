# FastAPI Stock Service

This project is a FastAPI application that provides an API for stock data. It allows users to retrieve stock quotes, intraday data, price depth, company information, and shareholders.

## Project Structure

```
server/
├── app/
│   ├── main.py                # Entry point of the FastAPI application
│   ├── api/                   # API routes and dependencies
│   │   ├── __init__.py
│   │   ├── deps.py            # Dependency functions for API routes
│   │   └── v1/                # Version 1 of the API
│   │       ├── __init__.py
│   │       └── routes/        # API route definitions
│   │           ├── __init__.py
│   │           └── stocks.py
│   ├── core/                  # Core application settings
│   │   ├── __init__.py
│   │   └── config.py          # Configuration settings
│   ├── models/                # Pydantic models for request/response validation
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── services/              # Business logic related to stock data
│   │   ├── __init__.py
│   │   └── stocks_service.py
│   └── utils/                 # Utility functions for stock data processing
│       ├── __init__.py
│       └── stock_utils.py
├── tests/                     # Unit tests for the application
│   ├── __init__.py
│   └── test_stocks_api.py
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── pyproject.toml             # Project dependencies and configurations
├── uvicorn.sh                 # Script to run the FastAPI application
└── README.md                  # Project documentation
```

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd stock-me-2/server
   ```

2. **Create a virtual environment**:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   Create a `.env` file in the `server` directory and add your environment variables.

5. **Run the application**:
   ```
   ./uvicorn.sh
   ```

## Usage

Once the application is running, you can access the API at `http://localhost:8000`. The API documentation is available at `http://localhost:8000/docs`.

## Endpoints

- **GET /api/v1/stocks/quote**: Retrieve stock quotes.
- **GET /api/v1/stocks/intraday**: Get intraday stock data.
- **GET /api/v1/stocks/price_depth**: Get price depth (order book) data.
- **GET /api/v1/stocks/company**: Get company information.
- **GET /api/v1/stocks/shareholders**: Get company shareholders.

## Testing

To run the tests, use the following command:
```
pytest
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.