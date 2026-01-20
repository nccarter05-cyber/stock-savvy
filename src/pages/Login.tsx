import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate('/dashboard');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const restaurantName = formData.get('restaurantName') as string;
    const inventoryDbName = formData.get('inventoryDbName') as string;

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!inventoryDbName.trim()) {
      toast({
        title: "Inventory DB Name required",
        description: "Please enter an Inventory DB Name to share inventory with your team.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Check if team with this inventory_db_name already exists using secure function
    const { data: existingTeamId } = await supabase
      .rpc('get_team_id_by_name', { team_name: inventoryDbName.trim() });
    
    const existingTeam = existingTeamId ? { id: existingTeamId } : null;

    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          restaurant_name: restaurantName,
          inventory_db_name: inventoryDbName,
        },
      },
    });

    if (error) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const newUserId = signUpData.user?.id;
    
    if (newUserId) {
      if (existingTeam) {
        // Team exists - create a join request
        const { error: requestError } = await supabase
          .from('join_requests')
          .insert({
            team_id: existingTeam.id,
            user_id: newUserId,
            status: 'pending',
          });

        if (requestError) {
          console.error('Failed to create join request:', requestError);
        }

        toast({
          title: "Account created!",
          description: "Your request to join the team has been sent. The team owner will review it.",
        });
      } else {
        // Team doesn't exist - create new team and add user as owner
        const { data: newTeam, error: teamError } = await supabase
          .from('inventory_teams')
          .insert({
            inventory_db_name: inventoryDbName.trim(),
            owner_id: newUserId,
          })
          .select('id')
          .single();

        if (teamError) {
          console.error('Failed to create team:', teamError);
        } else if (newTeam) {
          // Add user as owner in team_memberships
          const { error: memberError } = await supabase
            .from('team_memberships')
            .insert({
              team_id: newTeam.id,
              user_id: newUserId,
              role: 'owner',
            });

          if (memberError) {
            console.error('Failed to create membership:', memberError);
          }
        }

        toast({
          title: "Account created!",
          description: "You are now the owner of this inventory team.",
        });
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl md:text-2xl">Simple Inventory</CardTitle>
            <CardDescription className="text-sm">Manage your inventory easily</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input 
                    id="login-email" 
                    name="email"
                    type="email" 
                    placeholder="you@restaurant.com" 
                    required 
                    disabled={loading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="login-password" 
                      name="password"
                      type={showLoginPassword ? "text" : "password"} 
                      required 
                      disabled={loading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-center mt-3">
                  <Button 
                    type="button"
                    variant="link" 
                    className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                    onClick={() => navigate('/reset-password')}
                  >
                    Forgot your password?
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-restaurant">Restaurant Name</Label>
                  <Input 
                    id="signup-restaurant" 
                    name="restaurantName"
                    placeholder="Your Restaurant" 
                    required 
                    disabled={loading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-inventory-db">Inventory DB Name</Label>
                  <Input 
                    id="signup-inventory-db" 
                    name="inventoryDbName"
                    placeholder="shared-inventory-name" 
                    required 
                    disabled={loading}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter an existing name to request to join, or a new name to create your own team
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    name="email"
                    type="email" 
                    placeholder="you@restaurant.com" 
                    required 
                    disabled={loading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signup-password" 
                      name="password"
                      type={showSignupPassword ? "text" : "password"} 
                      required 
                      disabled={loading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                      id="signup-confirm" 
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"} 
                      required 
                      disabled={loading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
