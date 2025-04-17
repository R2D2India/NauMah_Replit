# NauMah - AI-Powered Pregnancy Companion

NauMah is a comprehensive AI-powered pregnancy companion and tracker designed to support expecting mothers throughout their pregnancy journey. The application provides personalized guidance, tracking tools, and interactive AI assistants to make the 9-month journey more informed and comfortable.

## Features

- **AI-Powered Assistants**: Chat and voice assistants (in English and Hindi) to answer pregnancy-related questions
- **Mood Tracker**: Track your daily emotional well-being throughout pregnancy
- **Pregnancy Progress**: Visual tracking of pregnancy progression by week
- **Baby Development Information**: Week-by-week updates on your baby's development
- **Meal Planning**: Nutritional guidance customized to your pregnancy stage
- **Medication Safety Checker**: Check if medications are safe during pregnancy

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI and Eleven Labs APIs for intelligent assistants
- **State Management**: React Query for API data fetching and caching

## Getting Started

### Prerequisites

- Node.js (version 18+)
- PostgreSQL database
- OpenAI API key
- Eleven Labs API key (for voice features)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/naumah.git
   cd naumah
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following:
   ```
   DATABASE_URL=your_postgres_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. Run database migrations
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Voice Assistant Features

- English and Hindi language support
- Pregnancy-specific knowledge base
- Voice input and output for hands-free usage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.