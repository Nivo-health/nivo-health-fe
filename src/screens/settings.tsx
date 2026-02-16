import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Settings from 'lucide-react/dist/esm/icons/settings';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '../hooks/use-clinic';
import { useAuthStore } from '../stores/auth.store';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { data: clinic, isLoading: loading } = useClinic();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h6 className="text-sm md:text-sm font-medium text-foreground flex items-center gap-2">
            <Settings className="size-4" /> Settings
          </h6>
        </div>
        <div className="max-w-4xl">
          <Card.Root className="overflow-hidden border-primary/10">
            <Card.Header
              className="relative border border-b flex items-center justify-between px-4 py-3 border-b-primary/10 border-x-0 border-t-0"
              style={{
                background: 'var(--gradient-header)',
              }}
            >
              <Card.Title className="text-sm font-medium text-muted-foreground">
                Clinic Information
              </Card.Title>
            </Card.Header>
            <Card.Panel className="pt-6 space-y-4">
              {loading ? (
                <div className="text-sm text-gray-600">
                  Loading clinic data...
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="name">Clinic Name</Label>
                    <Input
                      id="name"
                      value={clinic?.name}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  {clinic?.address && (
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="Address">Address</Label>
                      <Input
                        id="Address"
                        value={clinic.address}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                  {clinic?.phone && (
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="Phone">Phone</Label>
                      <Input
                        id="Phone"
                        value={clinic.phone}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                  {clinic?.email && (
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="Email">Email</Label>
                      <Input
                        id="Email"
                        value={clinic.email}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                  {clinic?.website && (
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={clinic.website}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  )}
                </>
              )}
            </Card.Panel>
          </Card.Root>

          <Card.Root className="overflow-hidden border-primary/10 mt-6">
            <Card.Header
              className="relative border border-b flex items-center justify-between px-4 py-3 border-b-primary/10 border-x-0 border-t-0"
              style={{
                background: 'var(--gradient-header)',
              }}
            >
              <Card.Title className="text-sm font-medium text-muted-foreground">
                Account
              </Card.Title>
            </Card.Header>
            <Card.Panel className="pt-6">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full md:w-auto text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
              >
                Logout
              </Button>
            </Card.Panel>
          </Card.Root>
        </div>
      </div>
    </div>
  );
}
