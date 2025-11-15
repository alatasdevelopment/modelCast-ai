import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ModelCast Privacy Policy",
  description: "Understand how ModelCast securely processes your uploads, protects data, and supports GDPR requests.",
  alternates: {
    canonical: "https://modelcast.fit/privacy",
  },
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <p className="mb-6 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">
        ModelCast (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) values your privacy. This policy
        explains how we handle your data when using our platform at <strong>modelcast.fit</strong>.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">1. Information We Collect</h2>
      <p className="mb-4">
        We collect only the information needed to provide our service: your email for authentication and the images you
        upload for AI generation.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">2. Image Processing &amp; Deletion</h2>
      <p className="mb-4">
        Uploaded images are processed securely through Cloudinary and FASHN AI. All generated and uploaded images are
        automatically deleted within 30 minutes. We never use or store your data for training or sharing with third
        parties.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">3. Data Security</h2>
      <p className="mb-4">
        All communications are encrypted (HTTPS). Authentication and profile data are stored safely in Supabase with
        industry-standard encryption.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">4. Third-Party Services</h2>
      <p>ModelCast uses third-party providers:</p>
      <ul className="list-disc list-inside text-gray-400 mt-2 mb-4">
        <li>Supabase — authentication &amp; profiles</li>
        <li>Cloudinary — image uploads</li>
        <li>FASHN AI — image generation</li>
        <li>Vercel — hosting infrastructure</li>
      </ul>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">5. Contact</h2>
      <p>
        For any questions, contact us at:{' '}
        <a href="mailto:modelcast.fit@proton.me" className="text-lime-400 hover:underline">
          modelcast.fit@proton.me
        </a>
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">6. Cookies &amp; Analytics</h2>
      <p className="mb-4">
        ModelCast may use privacy-friendly analytics tools (e.g., Plausible or PostHog) to understand general usage trends.
        No personal data or user tracking cookies are collected.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">7. Your Rights (GDPR)</h2>
      <p>
        If you are located in the EU, you may request data deletion or export of your user data by contacting us at{' '}
        <a href="mailto:modelcast.fit@proton.me" className="text-lime-400 hover:underline">
          modelcast.fit@proton.me
        </a>
        .
      </p>
    </main>
  )
}
