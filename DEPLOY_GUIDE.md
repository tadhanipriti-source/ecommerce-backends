# E-COMMERCE BACKEND - DEPLOY GUIDE

## STEP 1: GitHub Repository Create Karo

1. GitHub.com open karo
2. "New repository" click karo
3. Name: `ecommerce-backend`
4. Public repository select karo
5. "Create repository" click karo

## STEP 2: Local Git Setup

```bash
cd d:\javascript\8_2_project
git init
git add .
git commit -m "feat: complete e-commerce backend"
git remote add origin https://github.com/YOUR_USERNAME/ecommerce-backend.git
git branch -M main
git push -u origin main
```

## STEP 3: MongoDB Atlas (Free)
1. cloud.mongodb.com -> Free account
2. M0 Free Cluster create karo
3. Network Access -> 0.0.0.0/0
4. Connection string copy: mongodb+srv://user:pass@cluster.mongodb.net/ecommerce

## STEP 4: Cloudinary (Free)
1. cloudinary.com -> Free account
2. Dashboard thi: Cloud Name, API Key, API Secret copy karo

## STEP 5: Render.com Deploy
1. render.com -> GitHub thi login
2. New + -> Web Service -> Apno repo select
3. Build: npm install | Start: node server.js
4. Environment Variables add karo (see .env.example)
5. Deploy!

## Live URL
https://ecommerce-backend-XXXX.onrender.com
