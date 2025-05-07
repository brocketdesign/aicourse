import Link from 'next/link';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { BrainCircuit } from 'lucide-react'; // Example icon

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-8">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-blue-600" />
          <span className="font-bold sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">AI Course</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {/* Add other nav links here if needed */}
          <SignedIn>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Courses</Link>
          </SignedIn>
          <SignedOut>
            <Link href="/courses/ai-monetization" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Courses</Link>
          </SignedOut>
          <Link href="#curriculum" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Curriculum</Link>
        </nav>
        <div className="flex items-center justify-end space-x-4">
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-secondary text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-full hover:shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer">Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
};

export default Header;
