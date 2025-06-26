
export const getSignInErrorMessage = (error: any): string => {
  let errorMessage = "An error occurred during login";
  
  if (error.message?.includes("Invalid login")) {
    errorMessage = "Invalid email or password. Please check your credentials.";
  } else if (error.message?.includes("timeout") || error.message?.includes("504") || error.status === 504) {
    errorMessage = "Server is temporarily overloaded. Please try again in a few minutes.";
  } else if (error.message && error.message !== "{}") {
    errorMessage = error.message;
  }
  
  return errorMessage;
};

export const getSignUpErrorMessage = (error: any): string => {
  // Handle timeout errors specifically
  if (error.message?.includes('timeout') || error.message?.includes('10 seconds')) {
    return "Signup timed out after 10 seconds. Supabase may be experiencing high traffic. Try again in 30 seconds.";
  }
  
  return error.message || "Unable to create account. Please try again.";
};

export const getMagicLinkErrorMessage = (error: any): string => {
  return error.message || "An error occurred. Please try again.";
};

export const getSignOutErrorMessage = (error: any): string => {
  return error.message || "An error occurred during sign out. Please try again.";
};
