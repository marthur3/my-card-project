import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center justify-center">
          <span className="text-2xl font-bold">Note Generator</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Log In</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Create Perfect Notes with AI
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Generate thoughtful, personalized notes for any occasion in seconds. 
                  Powered by AI, crafted with care.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/signup">
                  <Button className="px-8">
                    Get Started 
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/examples">
                  <Button variant="outline" className="px-8">
                    View Examples
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              {/* Feature 1 */}
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-lg bg-white p-6 shadow-lg">
                  <h3 className="text-xl font-bold">AI-Powered Writing</h3>
                  <p className="text-gray-500">
                    Generate personalized notes instantly using advanced AI technology.
                  </p>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-lg bg-white p-6 shadow-lg">
                  <h3 className="text-xl font-bold">Every Occasion</h3>
                  <p className="text-gray-500">
                    Perfect for thank you notes, congratulations, condolences, and more.
                  </p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-lg bg-white p-6 shadow-lg">
                  <h3 className="text-xl font-bold">Contact Management</h3>
                  <p className="text-gray-500">
                    Keep track of your recipients and their preferences effortlessly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
