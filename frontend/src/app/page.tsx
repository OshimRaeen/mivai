import { SignInButton, UserButton, Show } from "@clerk/nextjs";

const CustomSignInBtn = () => (
  <button className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors shadow-sm">
    Sign In / Register
  </button>
);

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Mock Interview Platform</h1>
        <p className="text-lg text-zinc-400">
          Enterprise-grade peer-to-peer and AI mock interviews.
        </p>

        <div className="mt-8">
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <CustomSignInBtn />
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <div className="flex flex-col items-center gap-4">
              <p className="text-emerald-400 font-medium">You are securely authenticated!</p>
              <a href="/dashboard" className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors">
                Go to Dashboard
              </a>
              <UserButton />
            </div>
          </Show>
        </div>
      </div>
    </main>
  );
}