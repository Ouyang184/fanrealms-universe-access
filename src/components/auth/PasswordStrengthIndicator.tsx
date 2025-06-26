
import { Check, AlertCircle } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  if (!password) return null;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordStrength = [hasMinLength, hasUppercase, hasNumber, hasSpecialChar].filter(Boolean).length;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        <div
          className={`h-1 flex-1 rounded-full ${passwordStrength > 0 ? "bg-red-500" : "bg-gray-700"}`}
        ></div>
        <div
          className={`h-1 flex-1 rounded-full ${passwordStrength > 1 ? "bg-yellow-500" : "bg-gray-700"}`}
        ></div>
        <div
          className={`h-1 flex-1 rounded-full ${passwordStrength > 2 ? "bg-green-500" : "bg-gray-700"}`}
        ></div>
        <div
          className={`h-1 flex-1 rounded-full ${passwordStrength > 3 ? "bg-green-500" : "bg-gray-700"}`}
        ></div>
      </div>

      <ul className="text-xs space-y-1 text-gray-400">
        <li className="flex items-center gap-1">
          {hasMinLength ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-500" />
          )}
          At least 8 characters
        </li>
        <li className="flex items-center gap-1">
          {hasUppercase ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-500" />
          )}
          At least one uppercase letter
        </li>
        <li className="flex items-center gap-1">
          {hasNumber ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-500" />
          )}
          At least one number
        </li>
        <li className="flex items-center gap-1">
          {hasSpecialChar ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-gray-500" />
          )}
          At least one special character
        </li>
      </ul>
    </div>
  );
};
