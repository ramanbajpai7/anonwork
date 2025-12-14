"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { ArrowLeft, Shield, Eye, Lock, Database, UserX, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background bg-pattern">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: December 14, 2024
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary" />
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to AnonWork ("we," "our," or "us"). We are committed to protecting your privacy 
              and ensuring you have a positive experience on our platform. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you visit our website 
              and use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              Information We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Account Information</h3>
                <p>
                  When you create an account, we collect your email address (for work email verification only), 
                  username, and password. Your work email is used solely for verification purposes and is 
                  never displayed or shared with other users.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">User Content</h3>
                <p>
                  We collect the content you create on our platform, including posts, comments, messages, 
                  and any other information you choose to share. This content is associated with your 
                  anonymous username, not your real identity.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Usage Information</h3>
                <p>
                  We automatically collect certain information about your device and how you interact 
                  with our platform, including IP addresses (anonymized), browser type, pages visited, 
                  and time spent on pages.
                </p>
              </div>
            </div>
          </section>

          {/* How We Protect Your Anonymity */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <UserX className="h-6 w-6 text-primary" />
              How We Protect Your Anonymity
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>Your real identity is never revealed to other users</li>
                <li>Work email addresses are used only for verification and are stored encrypted</li>
                <li>Your posts and comments are associated only with your anonymous username</li>
                <li>We do not sell or share your personal information with third parties for marketing</li>
                <li>IP addresses are anonymized in our logs</li>
                <li>We use industry-standard encryption to protect data in transit and at rest</li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your 
              information. This includes encryption, secure servers, regular security audits, and 
              access controls. However, no method of transmission over the Internet is 100% secure, 
              and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  our contact page
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. We also use 
              analytics cookies (via Vercel Analytics) to understand how our platform is used. 
              These analytics are privacy-focused and do not track individual users across sites.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date. 
              We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          {/* Contact */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our practices, please{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact us
              </Link>
              . We are committed to resolving any concerns you may have.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}

