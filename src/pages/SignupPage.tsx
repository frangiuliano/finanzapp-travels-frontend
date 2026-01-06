import { SignupForm } from '@/components/signup-form';

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  );
}
