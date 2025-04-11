import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-4">
              Last Updated: April 10, 2025
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Introduction</h2>
            <p>
              MH Sub I, LLC dba Internet Brands ("we," "our," or "us") respects your privacy and is committed to protecting it through our compliance with this Privacy Policy. This policy describes the types of information we may collect from you or that you may provide when you use our Hackathon Platform and our practices for collecting, using, maintaining, protecting, and disclosing that information.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
            <p>
              We collect several types of information from and about users of our Platform, including information:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>By which you may be personally identified, such as name, email address, or any other identifier by which you may be contacted online or offline ("personal information");</li>
              <li>That is about you but individually does not identify you, such as your hackathon preferences, team affiliations, and project submissions;</li>
              <li>About your internet connection, the equipment you use to access our Platform, and usage details.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">How We Collect Your Information</h2>
            <p>
              We collect this information:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>Directly from you when you provide it to us (such as during registration or project submission).</li>
              <li>Automatically as you navigate through the Platform (information collected automatically may include usage details, IP addresses, and information collected through cookies).</li>
              <li>From third parties, such as authentication providers when you sign in using Google or other third-party authentication methods.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
            <p>
              We use information that we collect about you or that you provide to us, including any personal information:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>To present our Platform and its contents to you.</li>
              <li>To provide you with information about hackathons, teams, and projects.</li>
              <li>To fulfill any other purpose for which you provide it, such as registering for hackathons, creating teams, or submitting projects.</li>
              <li>To provide you with notices about your account and status updates.</li>
              <li>To improve our Platform and user experience.</li>
              <li>To contact you about platform-related matters.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Disclosure of Your Information</h2>
            <p>
              We may disclose aggregated information about our users, and information that does not identify any individual, without restriction.
            </p>
            <p>
              We may disclose personal information that we collect or you provide as described in this privacy policy:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>To our subsidiaries and affiliates.</li>
              <li>To contractors, service providers, and other third parties we use to support our Platform.</li>
              <li>To fulfill the purpose for which you provide it, such as sharing team information with other team members.</li>
              <li>For any other purpose disclosed by us when you provide the information.</li>
              <li>With your consent.</li>
              <li>To comply with any court order, law, or legal process.</li>
              <li>If we believe disclosure is necessary to protect the rights, property, or safety of the company, our platform, or others.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Data Security</h2>
            <p>
              We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on secure servers behind firewalls.
            </p>
            <p>
              Unfortunately, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Platform. Any transmission of personal information is at your own risk.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Your Choices About Your Information</h2>
            <p>
              You can review and change your personal information by logging into the Platform and visiting your profile page. You may also send us an email to request access to, correct or delete any personal information that you have provided to us. We may not accommodate a request to change information if we believe the change would violate any law or legal requirement or cause the information to be incorrect.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Changes to Our Privacy Policy</h2>
            <p>
              It is our policy to post any changes we make to our privacy policy on this page. The date the privacy policy was last revised is identified at the top of the page. You are responsible for periodically visiting our Platform and this privacy policy to check for any changes.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">Contact Information</h2>
            <p>
              To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@internetbrands.com
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}