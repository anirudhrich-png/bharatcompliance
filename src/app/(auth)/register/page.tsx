"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { FloatingInput } from "@/components/ui/floating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import { LANGUAGE_LABELS } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { language: "hi" },
  });

  const language = watch("language");

  const onSubmit = async (data: RegisterFormData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = (await res.json()) as { success: boolean; error?: string };

    if (!result.success) {
      toast({
        title: "Registration failed",
        description: result.error ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-7">
        <h2
          className="text-2xl font-bold text-foreground mb-1.5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Create your account
        </h2>
        <p className="text-sm text-muted-foreground">
          Free forever — no credit card needed
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            label="Full name"
            autoComplete="name"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <FloatingInput
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>

        <FloatingInput
          label="Business name"
          error={errors.business_name?.message}
          {...register("business_name")}
        />

        <FloatingInput
          label="GSTIN (15 characters)"
          maxLength={15}
          className="uppercase"
          error={errors.gstin?.message}
          {...register("gstin")}
        />

        <FloatingInput
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="relative">
          <FloatingInput
            label="Password (min 8 chars, 1 uppercase, 1 number)"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Preferred language
          </Label>
          <Select
            value={language}
            onValueChange={(val) =>
              setValue("language", val as RegisterFormData["language"])
            }
          >
            <SelectTrigger className="h-10 rounded-lg text-sm">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(LANGUAGE_LABELS) as [string, string][]).map(
                ([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
          style={{
            background: isSubmitting
              ? "hsl(var(--primary) / 0.8)"
              : "hsl(var(--primary))",
            boxShadow: "0 2px 12px rgba(249,115,22,0.35)",
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create free account
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </motion.button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-saffron-600 hover:text-saffron-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
