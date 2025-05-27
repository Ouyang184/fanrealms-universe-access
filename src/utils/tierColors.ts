
export const getTierColor = (name: string | undefined) => {
  switch (name?.toLowerCase()) {
    case "pro artist":
      return "bg-primary";
    case "indie developer":
      return "bg-green-600";
    case "producer plus":
      return "bg-blue-600";
    case "author's circle":
      return "bg-amber-600";
    case "pro photographer":
      return "bg-cyan-600";
    default:
      return "bg-primary";
  }
};
