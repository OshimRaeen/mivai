import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply" />
      </div>

      <div className="relative z-10">
        <SignIn 
          fallbackRedirectUrl="/dashboard" // 🚀 FORCES REDIRECT TO DASHBOARD
          appearance={{
            elements: {
              card: "shadow-2xl rounded-2xl border border-black/5",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md",
              footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold"
            }
          }}
        />
      </div>
    </main>
  );
}