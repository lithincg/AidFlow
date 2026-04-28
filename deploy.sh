#!/bin/bash

# Smart Resource Allocation - Deployment Script
# Automatically builds the frontend and deploys to Firebase

echo "🚀 Starting deployment process..."

# 1. Verify dependencies
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install Node.js."
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI is not installed."
    echo "Please run: npm install -g firebase-tools"
    exit 1
fi

# 2. Build the project
echo "📦 Building the frontend application..."
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# 3. Deploy to Firebase
echo "🔥 Deploying to Firebase..."
echo "This will deploy Hosting, Cloud Functions, and Firestore Rules/Indexes."
firebase deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "Your app is now live."
else
    echo "❌ Deployment failed. Please check the logs above."
    exit 1
fi
