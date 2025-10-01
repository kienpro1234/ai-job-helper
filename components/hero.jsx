"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="w-full pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center md:text-left">
          <h1 className="text-5xl font-bold md:text-6xl lg:text-7xl gradient-title animate-gradient">
            A personal AI career assistant
            <br />
            Just for you
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground md:text-xl md:mx-0">
            Take your career to the next level with AI: Design your CV, generate
            cover letters, and sharpen interview skills.
          </p>
          <div className="flex justify-center md:justify-start space-x-4">
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-6 text-lg">
                Start now
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                How it works
              </Button>
            </Link>
          </div>
        </div>
        <div className="hero-image-container">
          <Image
            src="/new-banner1.png"
            width={1280}
            height={720}
            alt="AI Career Coach"
            className="rounded-lg shadow-2xl border mx-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
