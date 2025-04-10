import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'

export default function TermsOfServicePage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-4">
              Last Updated: April 10, 2025
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Hackathon Platform operated by MH Sub I, LLC dba Internet Brands ("Company," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Platform.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">2. Changes to Terms</h2>
            <p>
              We may revise and update these Terms from time to time in our sole discretion. All changes are effective immediately when we post them. Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">3. Accessing the Platform and Account Security</h2>
            <p>
              We reserve the right to withdraw or amend the Platform, and any service or material we provide on the Platform, in our sole discretion without notice. We will not be liable if for any reason all or any part of the Platform is unavailable at any time or for any period.
            </p>
            <p>
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>Making all arrangements necessary for you to have access to the Platform.</li>
              <li>Ensuring that all persons who access the Platform through your account are aware of these Terms and comply with them.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">4. Intellectual Property Rights</h2>
            <p>
              The Platform and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement thereof), are owned by the Company, its licensors, or other providers of such material and are protected by copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <p>
              For hackathon projects submitted through the Platform:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>You retain ownership of your hackathon projects and associated intellectual property.</li>
              <li>By submitting a project, you grant us a non-exclusive, worldwide, royalty-free license to display, promote, and showcase your project within the context of the hackathon.</li>
              <li>You represent that you have all necessary rights to the content you submit.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">5. Prohibited Uses</h2>
            <p>
              You may use the Platform only for lawful purposes and in accordance with these Terms. You agree not to use the Platform:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
              <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Platform, or which may harm the Company or users of the Platform or expose them to liability.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">6. User Contributions</h2>
            <p>
              The Platform may contain message boards, chat rooms, personal profiles, forums, and other interactive features that allow users to post, submit, publish, display, or transmit content on or through the Platform.
            </p>
            <p>
              Any content you post to the Platform will be considered non-confidential and non-proprietary. By providing any content on the Platform, you grant us and our affiliates and service providers the right to use, reproduce, modify, perform, display, distribute, and otherwise disclose to third parties any such material.
            </p>
            <p>
              You represent and warrant that:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>You own or control all rights in and to the content you post and have the right to grant the license granted above.</li>
              <li>All of your content does not violate the rights of any third party.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">7. Monitoring and Enforcement; Termination</h2>
            <p>
              We have the right to:
            </p>
            <ul className="list-disc pl-6 my-4">
              <li>Remove or refuse to post any user contributions for any or no reason.</li>
              <li>Take any action with respect to any user contribution that we deem necessary or appropriate.</li>
              <li>Terminate or suspend your access to all or part of the Platform for any or no reason.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">8. Disclaimer of Warranties</h2>
            <p>
              YOUR USE OF THE PLATFORM, ITS CONTENT, AND ANY SERVICES OBTAINED THROUGH THE PLATFORM IS AT YOUR OWN RISK. THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">9. Limitation on Liability</h2>
            <p>
              IN NO EVENT WILL THE COMPANY, ITS AFFILIATES OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE PLATFORM.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">10. Governing Law and Jurisdiction</h2>
            <p>
              All matters relating to the Platform and these Terms and any dispute or claim arising therefrom or related thereto shall be governed by and construed in accordance with the internal laws of the State of California without giving effect to any choice or conflict of law provision or rule.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">11. Waiver and Severability</h2>
            <p>
              No waiver by the Company of any term or condition set forth in these Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of the Company to assert a right or provision under these Terms shall not constitute a waiver of such right or provision.
            </p>
            <p>
              If any provision of these Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms will continue in full force and effect.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-3">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at: terms@hackathonplatform.com
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}