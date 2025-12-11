"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Building2,
  Shield,
  CheckCircle,
  Loader2,
  AlertCircle,
  Camera,
  X,
  Pencil,
  Save,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { redirect } from "next/navigation";
import Image from "next/image";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ posts: 0, comments: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");

  // Display name state
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");

  // Work email verification state
  const [workEmail, setWorkEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState<"email" | "code">(
    "email"
  );
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      redirect("/login");
    }
    // Set profile photo from user data
    if (user?.profile_photo_url) {
      setProfilePhoto(user.profile_photo_url);
    }
    // Set display name from user data
    if (user?.display_name) {
      setDisplayName(user.display_name);
    }
  }, [user, authLoading]);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      // Fetch user stats here if needed
    }
    fetchStats();
  }, [user]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Please upload a JPEG, PNG, GIF, or WebP image.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image must be less than 5MB.");
      return;
    }

    setUploadingPhoto(true);
    setPhotoError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/auth/profile-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setProfilePhoto(data.photo_url);
      } else {
        setPhotoError(data.message || "Failed to upload photo");
      }
    } catch (error) {
      setPhotoError("Network error. Please try again.");
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemovePhoto() {
    setUploadingPhoto(true);
    setPhotoError("");

    try {
      const res = await fetch("/api/auth/profile-photo", {
        method: "DELETE",
      });

      if (res.ok) {
        setProfilePhoto(null);
      } else {
        const data = await res.json();
        setPhotoError(data.message || "Failed to remove photo");
      }
    } catch (error) {
      setPhotoError("Network error. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSaveDisplayName() {
    setSavingName(true);
    setNameError("");
    setNameSuccess("");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });

      const data = await res.json();

      if (res.ok) {
        setNameSuccess("Display name updated!");
        setIsEditingName(false);
        setTimeout(() => setNameSuccess(""), 3000);
      } else {
        setNameError(data.message || "Failed to update display name");
      }
    } catch (error) {
      setNameError("Network error. Please try again.");
    } finally {
      setSavingName(false);
    }
  }

  function handleCancelEditName() {
    setIsEditingName(false);
    setDisplayName(user?.display_name || "");
    setNameError("");
  }

  async function handleSendVerificationCode() {
    if (!workEmail || !workEmail.includes("@")) {
      setVerificationError("Please enter a valid work email");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const res = await fetch("/api/auth/verify-work-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_email: workEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationStep("code");
        setVerificationSuccess(data.message || "Verification code sent!");
        // Show dev code if email not configured
        if (data.dev_code) {
          setDevCode(data.dev_code);
        }
      } else {
        setVerificationError(
          data.message || "Failed to send verification code"
        );
      }
    } catch (error) {
      setVerificationError("Network error. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError("Please enter the 6-digit code");
      return;
    }

    setVerificationLoading(true);
    setVerificationError("");
    setVerificationSuccess("");

    try {
      const res = await fetch("/api/auth/verify-work-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerificationSuccess(data.message);
        setDevCode(null);
        // Refresh the page to update user data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setVerificationError(data.message || "Invalid verification code");
      }
    } catch (error) {
      setVerificationError("Network error. Please try again.");
    } finally {
      setVerificationLoading(false);
    }
  }

  function handleResendCode() {
    setVerificationStep("email");
    setVerificationCode("");
    setVerificationError("");
    setVerificationSuccess("");
    setDevCode(null);
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

            {/* Profile Card with Photo Upload */}
            <Card className="p-6 mb-6">
              <div className="flex items-start gap-4">
                {/* Profile Photo */}
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {profilePhoto ? (
                      <Image
                        src={profilePhoto}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.anon_username?.slice(5, 7).toUpperCase() || "AN"
                    )}
                  </div>

                  {/* Photo Upload Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadingPhoto ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-white hover:scale-110 transition-transform"
                        title="Change photo"
                      >
                        <Camera className="h-6 w-6" />
                      </button>
                    )}
                  </div>

                  {/* Remove Photo Button */}
                  {profilePhoto && !uploadingPhoto && (
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1">
                  {/* Display Name Section */}
                  <div className="mb-2">
                    {isEditingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter display name"
                          className="max-w-[200px] h-9"
                          maxLength={50}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveDisplayName}
                          disabled={savingName}
                          className="h-9"
                        >
                          {savingName ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditName}
                          className="h-9"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold">
                          {displayName || user.anon_username}
                        </h2>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="p-1 hover:bg-muted rounded-md transition-colors"
                          title="Edit display name"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                    {nameError && (
                      <p className="text-xs text-red-500 mt-1">{nameError}</p>
                    )}
                    {nameSuccess && (
                      <p className="text-xs text-green-500 mt-1">
                        {nameSuccess}
                      </p>
                    )}
                  </div>

                  {/* Anonymous Username */}
                  {displayName && (
                    <div className="text-sm text-muted-foreground mb-1">
                      @{user.anon_username}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {user.is_verified_employee && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified Employee
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    Member since{" "}
                    {user.created_at
                      ? formatDistanceToNow(new Date(user.created_at), {
                          addSuffix: true,
                        })
                      : "recently"}
                  </div>

                  {/* Photo upload hint */}
                  <p className="text-xs text-muted-foreground mt-2">
                    Hover over your avatar to change your profile photo
                  </p>

                  {/* Photo error */}
                  {photoError && (
                    <p className="text-xs text-red-500 mt-1">{photoError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.posts}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.comments}</div>
                  <div className="text-sm text-muted-foreground">Comments</div>
                </div>
              </div>
            </Card>

            {/* Account Details */}
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div>{user.email}</div>
                  </div>
                  {user.email_verified && (
                    <Badge variant="outline" className="ml-auto">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Role</div>
                    <div className="capitalize">{user.role}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Work Email Verification */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Work Email Verification
              </h3>

              {user.work_email_verified ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Verified Employee</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your work email has been verified. You have access to
                    private company channels and a verified badge on your posts.
                  </p>
                  {user.work_email && (
                    <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-lg">
                      <Mail className="h-4 w-4" />
                      <span>{user.work_email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Verify your work email to access private company channels
                    and get a verified employee badge.
                  </p>

                  {/* Error Message */}
                  {verificationError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{verificationError}</span>
                    </div>
                  )}

                  {/* Success Message */}
                  {verificationSuccess && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{verificationSuccess}</span>
                    </div>
                  )}

                  {/* Dev Code Display (when email not configured) */}
                  {devCode && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                      <div className="font-medium text-yellow-800">
                        📧 Email Service Not Configured
                      </div>
                      <div className="text-yellow-700 mt-1">
                        Your verification code is:{" "}
                        <span className="font-mono font-bold">{devCode}</span>
                      </div>
                      <div className="text-yellow-600 text-xs mt-2">
                        To enable real emails, add EMAIL_USER and EMAIL_PASS to
                        your .env.local
                      </div>
                    </div>
                  )}

                  {verificationStep === "email" ? (
                    /* Step 1: Enter Work Email */
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">
                          Work Email
                        </label>
                        <Input
                          type="email"
                          placeholder="your.name@company.com"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Use your company email (e.g., @google.com, @meta.com)
                        </p>
                      </div>
                      <Button
                        onClick={handleSendVerificationCode}
                        disabled={verificationLoading || !workEmail}
                        className="w-full"
                      >
                        {verificationLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Step 2: Enter Verification Code */
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Code sent to:{" "}
                        <span className="font-medium text-foreground">
                          {workEmail}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Verification Code
                        </label>
                        <Input
                          type="text"
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          className="mt-1 text-center text-lg tracking-widest font-mono"
                          maxLength={6}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleResendCode}
                          className="flex-1"
                        >
                          Change Email
                        </Button>
                        <Button
                          onClick={handleVerifyCode}
                          disabled={
                            verificationLoading || verificationCode.length !== 6
                          }
                          className="flex-1"
                        >
                          {verificationLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify Code"
                          )}
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={handleSendVerificationCode}
                        disabled={verificationLoading}
                        className="w-full text-sm"
                      >
                        Didn't receive code? Resend
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
