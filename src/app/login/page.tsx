"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { getPengaturanHalamanSukses } from "../pengaturan/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getPengaturanHalamanSukses().then(res => setLogoUrl(res.urlLogo));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Auto-append domain if they use short username (no @ symbol)
    const formattedEmail = email.includes("@") ? email : `${email.toLowerCase().replace(/\s+/g, '')}@rumahquran.com`;

    const { data, error } = await authClient.signIn.email({
        email: formattedEmail,
        password
    });

    if (error) {
      setError(error.message || "Gagal masuk. Periksa kembali kredensial Anda.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain bg-white" />
              ) : (
                <BookOpen className="w-10 h-10 text-white" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Masuk Pengurus</CardTitle>
          <CardDescription>
            Masukkan email dan kata sandi Anda untuk mengakses sistem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <Input 
                id="email" 
                type="text" 
                placeholder="admin" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
