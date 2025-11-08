export default function TermsOfService() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-6">Terms &amp; Conditions</h1>
      <p className="mb-6 text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>

      <p className="mb-4">
        These Terms &amp; Conditions govern your use of ModelCast (&ldquo;the Service&rdquo;). By using the platform, you
        agree to these terms.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">1. Use of Service</h2>
      <p className="mb-4">
        You may use ModelCast to generate AI-based model images for personal or commercial use, depending on your plan.
        Misuse or illegal content uploads are strictly prohibited.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">2. Account &amp; Credits</h2>
      <p className="mb-4">
        Each user is granted credits based on their plan. Free Trial users receive 2 credits. Pro and Studio plans include
        additional credits per month. Credits are non-transferable.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">3. Licensing &amp; Ownership</h2>
      <p className="mb-4">
        You own the outputs generated from your uploaded content. ModelCast retains no rights over generated images. Pro
        and Studio plans include full commercial usage rights.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">4. Termination</h2>
      <p className="mb-4">
        You may delete your account at any time via the dashboard. ModelCast reserves the right to suspend accounts
        violating these terms.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">5. Limitation of Liability</h2>
      <p className="mb-4">
        ModelCast is provided &ldquo;as is.&rdquo; We make no guarantees regarding output accuracy or suitability. In no
        event shall ModelCast or its contributors be liable for indirect or consequential damages.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">7. Refunds</h2>
      <p className="mb-4">
        Payments made for Pro or Studio plans are generally non-refundable. However, users may request a refund for unused
        credits within 7 days of purchase by contacting support at{' '}
        <a href="mailto:modelcast.fit@proton.me" className="text-lime-400 hover:underline">
          modelcast.fit@proton.me
        </a>
        .
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">8. AI-Generated Content Disclaimer</h2>
      <p className="mb-4">
        ModelCast uses AI to generate model imagery. While we strive for quality and realism, results may not always
        reflect exact likenesses or product details. ModelCast is not liable for any interpretation or use of AI-generated
        outputs.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">9. Governing Law</h2>
      <p className="mb-4">
        These terms are governed by and construed in accordance with the laws of the European Union and the Republic of
        Türkiye, without regard to conflict of law principles.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-2">6. Contact</h2>
      <p>
        For questions about these terms, email us at:{' '}
        <a href="mailto:modelcast.fit@proton.me" className="text-lime-400 hover:underline">
          modelcast.fit@proton.me
        </a>
      </p>
    </main>
  )
}
