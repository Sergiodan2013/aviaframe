# Aviaframe Portal - Client Application

React-based frontend for searching flights through the Aviaframe platform.

## Features

- **Flight Search Form**: Search for flights with origin, destination, dates, passengers, and cabin class
- **Real-time Results**: Display flight offers with detailed information
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS for a clean, modern interface

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API requests
- **Lucide React**: Icon library

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the client directory:

```env
VITE_N8N_SEARCH_URL=http://localhost:5678/webhook/drct/search
```

## Development

```bash
# Start dev server (runs on port 3000 by default)
npm run dev
```

The application will open at `http://localhost:3000` (or next available port).

## CORS Configuration

The Vite dev server is configured to proxy requests to n8n:

- Frontend: `http://localhost:3000`
- n8n webhooks: `http://localhost:5678`
- Proxy: All `/webhook/*` requests are forwarded to n8n

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── SearchForm.jsx    # Flight search form
│   │   └── FlightCard.jsx    # Flight result card
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # Application entry point
│   └── index.css              # Global styles with Tailwind
├── .env                       # Environment variables
├── vite.config.js             # Vite configuration with proxy
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json               # Dependencies and scripts
```

## Usage

1. **Start n8n**: Make sure n8n is running at `http://localhost:5678`
2. **Activate Search Workflow**: The `drct_search` workflow must be active in n8n
3. **Start Frontend**: Run `npm run dev` in the client directory
4. **Search Flights**:
   - Enter origin and destination (3-letter IATA codes, e.g., MOW, LED)
   - Select departure date (and optional return date)
   - Choose number of passengers (adults, children, infants)
   - Select cabin class
   - Click "Search Flights"

## API Integration

The frontend communicates with n8n workflows:

- **Search**: `POST /webhook/drct/search`
  - Request body: `{ origin, destination, depart_date, return_date?, adults, children, infants, cabin_class }`
  - Response: `{ search_id, offers: [...], metadata: {...} }`

## Date Format

All dates are formatted as `YYYY-MM-DD` (ISO 8601 date format) to match DRCT API requirements.

## Troubleshooting

**CORS Errors**: Make sure the Vite proxy is configured correctly in `vite.config.js`

**404 on Search**: Verify that the n8n workflow is active and the webhook URL is correct

**Empty Results**: This is expected if using test data - the DRCT sandbox may return empty offers for invalid data

## Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory.
