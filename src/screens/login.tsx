import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { LoginFormValues, loginSchema } from '@/schema/login.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../queries/auth.queries';
import { useAuthStore } from '../stores/auth.store';
import { useShow } from '@/hooks/use-show';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginScreen() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const setTokens = useAuthStore((state) => state.setTokens);
  const { toggle, shown } = useShow();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await loginMutation.mutateAsync({
        email: data.email.trim(),
        password: data.password,
      });

      setTokens(result.access, result.refresh);

      toast.add({
        title: 'Login successful!',
        type: 'success',
      });

      navigate('/');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Login failed. Please check your credentials.';
      toast.add({
        title: errorMessage,
        type: 'error',
      });
    }
  };

  const loading = isSubmitting || loginMutation.isPending;

  return (
    <div className="min-h-screen bg-primary/30 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Welcome</h1>
        <p className="mt-2 text-sm text-primary">
          Your patients are waiting. Sign in to continue care.
        </p>
      </div>
      <div className="w-full max-w-md bg-primary-foreground rounded-2xl shadow-lg border border-primary/30 p-6 md:p-8">
        <div className="text-center mb-8 flex justify-center items-center gap-3">
          <img
            src="/logo.png"
            alt="Nivo health"
            className="size-9 rounded-full object-contain border border-primary"
          />
          <h1 className="text-xl font-bold text-primary">Nivo health</h1>
        </div>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Fieldset.Root className="w-full gap-4">
            <Field.Root name="email">
              <Field.Item block>
                <Field.Control
                  id="email"
                  render={
                    <Input
                      size="lg"
                      id="email"
                      type="email"
                      placeholder="Email"
                      autoFocus
                      disabled={loading}
                      {...register('email')}
                    />
                  }
                />
              </Field.Item>

              {errors.email && (
                <Field.Error>{errors.email.message}</Field.Error>
              )}
            </Field.Root>

            <Field.Root name="password">
              <Field.Item block>
                <Field.Control
                  id="password"
                  render={
                    <div className="relative w-full">
                      <Input
                        size="lg"
                        id="password"
                        type={shown ? 'text' : 'password'}
                        placeholder="Password"
                        disabled={loading}
                        {...register('password')}
                        className="pr-8"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle();
                        }}
                        className="size-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {shown ? (
                          <EyeOff className="size-5" />
                        ) : (
                          <Eye className="size-5" />
                        )}
                      </button>
                    </div>
                  }
                />
              </Field.Item>

              {errors.password && (
                <Field.Error>{errors.password.message}</Field.Error>
              )}
            </Field.Root>
          </Fieldset.Root>

          <Button size="lg" type="submit" disabled={loading} loading={loading}>
            Get Started
          </Button>
        </Form>
        <Button
          className="w-full mt-3"
          type="submit"
          variant="link"
          onClick={() => navigate('/forgot-password')}
        >
          Forgot password?
        </Button>
      </div>
      <p className="text-center mt-6 text-xs text-primary">
        © 2026 Nivo Health. All rights reserved.
      </p>
    </div>
  );
}
