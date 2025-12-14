"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { ArrowLeft, FileText, Users, AlertTriangle, Scale, Ban, RefreshCw, Gavel } from "lucide-react";

export default function TermsPage() {
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
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: December 14, 2024
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Agreement */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Scale className="h-6 w-6 text-primary" />
              Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using AnonWork ("the Platform"), you agree to be bound by these Terms of 
              Service. If you disagree with any part of these terms, you may not access the Platform. 
              These Terms apply to all visitors, users, and others who access or use the Platform.
            </p>
          </section>

          {/* Use of Platform */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              Use of the Platform
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>You agree to use AnonWork only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
                <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation</li>
                <li>Post content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights</li>
                <li>Attempt to gain unauthorized access to any portion of the Platform</li>
                <li>Use the Platform to send spam or unsolicited messages</li>
                <li>Interfere with or disrupt the Platform or servers</li>
                <li>Collect or store personal data about other users without their consent</li>
                <li>Use the Platform for any commercial purposes without our consent</li>
              </ul>
            </div>
          </section>

          {/* User Accounts */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                When you create an account, you must provide accurate and complete information. 
                You are responsible for safeguarding your password and for all activities that 
                occur under your account.
              </p>
              <p>
                You agree to notify us immediately of any unauthorized use of your account. 
                We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </div>
          </section>

          {/* Content Guidelines */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-primary" />
              Content Guidelines
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                AnonWork is designed for professional discussions. While we respect anonymity, 
                we have zero tolerance for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Hate speech, discrimination, or harassment of any kind</li>
                <li>Threats of violence or harm</li>
                <li>Doxxing or revealing personal information of others</li>
                <li>Posting of confidential business information that violates legal obligations</li>
                <li>Spam, scams, or misleading content</li>
                <li>Explicit or adult content</li>
                <li>Content that encourages illegal activities</li>
              </ul>
              <p className="mt-4">
                We reserve the right to remove any content that violates these guidelines and 
                to suspend or ban users who repeatedly violate them.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The Platform and its original content (excluding content provided by users), features, 
                and functionality are owned by AnonWork and are protected by international copyright, 
                trademark, and other intellectual property laws.
              </p>
              <p>
                By posting content on AnonWork, you grant us a non-exclusive, worldwide, royalty-free 
                license to use, reproduce, modify, and display such content in connection with the Platform.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Ban className="h-6 w-6 text-primary" />
              Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice or liability, 
              for any reason, including breach of these Terms. Upon termination, your right to use the 
              Platform will immediately cease. You may also delete your account at any time from your 
              account settings.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE MAKE NO WARRANTIES, 
                EXPRESS OR IMPLIED, REGARDING THE PLATFORM, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES 
                OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that the Platform will be uninterrupted, secure, or error-free. 
                We are not responsible for any content posted by users.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Gavel className="h-6 w-6 text-primary" />
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              IN NO EVENT SHALL ANONWORK, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF 
              YOUR ACCESS TO OR USE OF THE PLATFORM. OUR TOTAL LIABILITY SHALL NOT EXCEED THE 
              AMOUNT YOU PAID US, IF ANY, IN THE PAST SIX MONTHS.
            </p>
          </section>

          {/* Changes */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-primary" />
              Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms at any time. If a revision is 
              material, we will provide at least 30 days' notice prior to any new terms taking effect. 
              By continuing to access or use the Platform after revisions become effective, you agree 
              to be bound by the revised terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the 
              jurisdiction in which AnonWork operates, without regard to its conflict of law provisions. 
              Any disputes arising from these Terms will be resolved through binding arbitration.
            </p>
          </section>

          {/* Contact */}
          <section className="glass rounded-2xl border border-border/50 p-6 lg:p-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please{" "}
              <Link href="/contact" className="text-primary hover:underline">
                contact us
              </Link>
              .
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        </div>
      </div>
    </main>
  );
}

