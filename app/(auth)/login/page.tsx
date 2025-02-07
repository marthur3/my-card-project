import { LoginForm } from "@/components/login-form"
import { AuthTest } from "@/components/auth-test"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl space-y-6">
        <LoginForm />
        {process.env.NODE_ENV !== 'production' && <AuthTest />}
      </div>
    </div>
  )
}
