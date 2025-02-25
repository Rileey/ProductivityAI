import 'dotenv/config';

export default {
  expo: {
    name: "Productivity AI",
    slug: "productivity-ai",
    // other existing config...
    extra: {
      openAIApiKey: process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_ACCESS_KEY,
      eas: {
        projectId: "your-project-id",
      },
    },
    plugins: [
      // Your existing plugins...
    ],
  },
}; 