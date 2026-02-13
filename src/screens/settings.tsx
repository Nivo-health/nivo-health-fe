import { useNavigate } from 'react-router-dom';
import { useClinic } from '../hooks/use-clinic';
import { useAuthStore } from '../stores/auth.store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { clinic, loading } = useClinic();
  const logout = useAuthStore((state) => state.logout);
  const clinicName = clinic?.name || 'Clinic OPD Management';
  const clinicAddress = clinic?.address || '';
  const clinicPhone = clinic?.phone || '';
  const clinicEmail = clinic?.email || '';

  const handleLogout = () => {
    logout();
    toast.add({
      type: 'success',
      title: 'Logged out successfully',
    });
    navigate('/login');
  };

  return (
    <div className="h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-teal-900 mb-6">Settings</h1>
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
                    value={clinicName}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                {clinicAddress && (
                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="Address">Address</Label>
                    <Input
                      id="Address"
                      value={clinicAddress}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}
                {clinicPhone && (
                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="Phone">Phone</Label>
                    <Input
                      id="Phone"
                      value={clinicPhone}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}
                {clinicEmail && (
                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="Email">Email</Label>
                    <Input
                      id="Email"
                      value={clinicEmail}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Clinic information is loaded from the API.
                </p>
              </>
            )}
          </Card.Panel>
        </Card.Root>

        {/* Logout Section */}
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
  );
}
