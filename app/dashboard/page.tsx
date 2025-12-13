"use client";

import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/posts/post-card";
import { CreatePostDialog } from "@/components/posts/create-post-dialog";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MessagesWidget } from "@/components/messaging/messages-widget";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
  PenSquare,
  TrendingUp,
  Clock,
  Plus,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<"recent" | "popular">("recent");

  useEffect(() => {
    if (!authLoading && !user) {
      redirect("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(
          `/api/posts?feed_type=${feedType}&page=1&limit=20`
        );
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [feedType]);

  const handlePostCreated = (newPost: any) => {
    setPosts([newPost, ...posts]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background bg-pattern">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <div className="absolute inset-0 gradient-bg rounded-2xl blur-xl opacity-50" />
            </div>
            <p className="text-muted-foreground font-medium">
              Loading your feed...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-pattern">
      <Header
        rightContent={
          <CreatePostDialog
            onPostCreated={handlePostCreated}
            trigger={
              <Button className="gap-2 gradient-bg text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-press border-0">
                <PenSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Create Post</span>
              </Button>
            }
          />
        }
      />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-5xl mx-auto flex gap-6">
            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              {/* Welcome Card */}
              <div className="mb-8 p-6 rounded-2xl glass border border-border/50 card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl font-bold">
                        Welcome back
                        <span className="gradient-text ml-2">
                          {user?.display_name || user?.anon_username}!
                        </span>
                      </h1>
                      <Image src="/icon.png" alt="AnonWork" width={24} height={24} className="rounded" />
                    </div>
                    <p className="text-muted-foreground">
                      Here's what's happening in your community today
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold gradient-text">
                        {posts.length}
                      </p>
                      <p className="text-xs text-muted-foreground">New Posts</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feed Filters */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={feedType === "recent" ? "default" : "outline"}
                  onClick={() => setFeedType("recent")}
                  className={`gap-2 rounded-xl transition-all duration-300 ${
                    feedType === "recent"
                      ? "gradient-bg text-white shadow-lg border-0"
                      : "glass hover:bg-primary/10"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Recent
                </Button>
                <Button
                  variant={feedType === "popular" ? "default" : "outline"}
                  onClick={() => setFeedType("popular")}
                  className={`gap-2 rounded-xl transition-all duration-300 ${
                    feedType === "popular"
                      ? "gradient-bg text-white shadow-lg border-0"
                      : "glass hover:bg-primary/10"
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Popular
                </Button>
              </div>

              {/* Posts List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative mb-4">
                      <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                      <div className="absolute inset-0 gradient-bg rounded-xl blur-lg opacity-40" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      Loading posts...
                    </p>
                  </div>
                ) : posts.length > 0 ? (
                  posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="fade-in opacity-0"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      <PostCard post={post as any} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 glass rounded-2xl border border-border/50">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center">
                        <PenSquare className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute inset-0 gradient-bg rounded-2xl blur-xl opacity-40" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Be the first to share something amazing with the
                      community!
                    </p>
                    <CreatePostDialog
                      onPostCreated={handlePostCreated}
                      trigger={
                        <Button
                          size="lg"
                          className="gap-2 gradient-bg text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 btn-press border-0"
                        >
                          <Plus className="h-5 w-5" />
                          Create Your First Post
                        </Button>
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Messages Widget */}
            <div className="hidden xl:block w-72 space-y-4 shrink-0">
              <div className="sticky top-24">
                <MessagesWidget />
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
