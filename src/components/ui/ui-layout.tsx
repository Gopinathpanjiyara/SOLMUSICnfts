import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppHeroProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function AppHero({ title, subtitle, children }: AppHeroProps) {
  return (
    <div className="hero py-8">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
          {subtitle && <p className="py-6">{subtitle}</p>}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
}

export function Card({ title, children, footerContent, className = '' }: CardProps) {
  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <div>{children}</div>
        {footerContent && (
          <div className="card-actions justify-end mt-2">{footerContent}</div>
        )}
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#0f1729' }}>
      <Header />
      <main className="flex-grow" style={{ backgroundColor: '#0f1729' }}>
          {children}
      </main>
      <Footer />
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center my-8">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
} 