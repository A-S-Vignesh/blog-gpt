# 🧠 The Blog GPT

**The Blog GPT** is a full-stack personal blogging platform where users can write, edit, and share their thoughts. It also includes the ability to generate blog content using **Google Gemini AI**, integrated by the developer.

🔗 **Live Demo:** [thebloggpt.vercel.app](https://thebloggpt.vercel.app)

---

## 🚀 Features

- ✍️ Create, edit, and delete blog posts  
- 🤖 Blog content generation using **Google Gemini AI**  
- 📸 Upload and manage images using Cloudinary  
- 🔐 Google authentication (NextAuth)  
- 📄 Markdown editor with live preview  
- 🧠 AI content generator section  
- 🔍 SEO-optimized with dynamic metadata  
- 📊 Personalized dashboard and blog stats  
- 💬 Clean and responsive UI  

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Zustand  
- **Editor:** React Markdown, react-markdown-editor-lite  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB + Mongoose  
- **Authentication:** NextAuth with Google OAuth  
- **AI Integration:** Google Gemini API *(used by the developer for blog generation)*  
- **Image Storage:** Cloudinary  
- **Deployment:** Vercel  

---

## 🧪 Installation & Setup

```bash
# Clone the repo
git clone https://github.com/A-S-Vignesh/blog-gpt.git
cd blog-gpt

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
# Fill in all environment variables (Mongo URI, Google Auth, Cloudinary, Gemini API Key, etc.)

# Run locally
npm run dev


📄 License

This project is licensed under the MIT License.
Feel free to use, modify, and share!
🙋‍♂️ Author

Developed with ❤️ by Vignesh A S
GitHub: @A-S-Vignesh
⭐️ Give it a Star

If you like this project, please consider giving it a ⭐ on GitHub!


Let me know if you want badges (e.g., deploy status, license, tech), a contributors section, or acknowledgments.