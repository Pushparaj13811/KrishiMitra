# Krishi Mitra

**Krishi Mitra** is an advanced platform designed to assist farmers with modern agricultural practices. The application offers video tutorials, insightful articles, and AI-driven crop disease diagnostics, helping farmers manage crops and market prices effectively.

## Features

- **Real-Time Crop Information**: Access detailed information on crop growth conditions, costs, and disease risks.
- **Video Tutorials**: Watch videos on modern farming techniques.
- **AI-Driven Crop Disease Diagnostics**: Upload images of diseased crops for AI-powered diagnosis and solutions.
- **Articles**: Read articles about advanced agricultural practices and tips.
- **Voice Search**: Use voice search in multiple languages for a better user experience.
- **Crop Price Tracking**: Monitor current crop prices and manage sales directly through the platform.

## Installation

To get started with Krishi Mitra, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Pushparaj13811/KrishiMitra.git
   ```

2. **Navigate to the project directory:**

   ```bash
   cd KrishiMitra
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Create a `.env` file in the root directory and add your environment variables:**

    ```plaintext
    PORT=Enter_Port_no
    MONGODB_URI=Your_mongodb_connection_uri

    CLOUDINARY_CLOUD_NAME=Your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=Your_cloudinary_api_key
    CLOUDINARY_API_SECRET=Your_cloudinary_api_secret

    ACCESS_TOKEN_SECRET=Your_access_token_secret
    ACCESS_TOKEN_EXPIRES_IN=Your_access_token_expiry_time
    REFRESH_TOKEN_SECRET=Your_refresh_token_secret
    REFRESH_TOKEN_EXPIRES_IN=Your_refresh_token_expiry_time
    ```


5. **Start the development server:**

   ```bash
   npm run dev
   ```

## Dependencies

The project uses the following dependencies:

- `bcrypt`: ^5.1.1
- `cloudinary`: ^2.4.0
- `cookie-parser`: ^1.4.6
- `cors`: ^2.8.5
- `dotenv`: ^16.4.5
- `express`: ^4.19.2
- `fluent-ffmpeg`: ^2.1.3
- `jsonwebtoken`: ^9.0.2
- `mongoose`: ^8.5.2
- `mongoose-aggregate-paginate-v2`: ^1.1.2
- `multer`: ^1.4.5-lts.1

Development dependencies:

- `nodemon`: ^3.1.4
- `prettier`: ^3.3.3

## Usage

1. **Real-Time Crop Information**: Use endpoints provided by the API to fetch crop-related information.
2. **Video Tutorials**: Upload and manage video content using Cloudinary.
3. **AI-Driven Diagnostics**: Implement AI models to diagnose crop diseases from uploaded images.
4. **Articles**: Manage articles and link them with relevant crops and videos.
5. **Voice Search**: Integrate voice search functionality for multi-language support.
6. **Price Tracking**: Track and manage crop prices through the provided API endpoints.

## Contributing

To contribute to this repository, please follow the guidelines outlined in our [CONTRIBUTING GUIDELINE](CONTRIBUTING.md) file.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Contact

For any questions or feedback, please reach out to:

- **Hompushparaj Mehta (Pushparaj)**
- Email: [pushparajmehta002@gmail.com](mailto:pushparajmehta002@gmail.com)

## Repository

Check out the project repository at [GitHub](https://github.com/Pushparaj13811/KrishiMitra).

