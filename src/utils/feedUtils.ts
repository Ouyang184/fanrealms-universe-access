
import { ContentType, EventContent } from "@/types/FeedPostTypes";
import {
  Video,
  FileText,
  Download,
  Music,
  FileAudio,
  ImageIcon,
  Calendar,
  Users,
} from "lucide-react";
import React from "react";

// Type guard to check if content has a date property
export function isEventContent(content: ContentType): content is EventContent {
  return content.type === "event";
}

// Get tier badge color
export const getTierColor = (color: string) => {
  switch (color) {
    case "purple":
      return "bg-purple-600";
    case "green":
      return "bg-green-600";
    case "blue":
      return "bg-blue-600";
    case "amber":
      return "bg-amber-600";
    case "cyan":
      return "bg-cyan-600";
    case "orange":
      return "bg-orange-600";
    case "red":
      return "bg-red-600";
    default:
      return "bg-purple-600";
  }
};

// Get content type icon
export const getContentTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return React.createElement(Video, { className: "h-4 w-4" });
    case "tutorial":
      return React.createElement(FileText, { className: "h-4 w-4" });
    case "download":
      return React.createElement(Download, { className: "h-4 w-4" });
    case "post":
      return React.createElement(FileText, { className: "h-4 w-4" });
    case "course":
      return React.createElement(BookIcon, { className: "h-4 w-4" });
    case "event":
      return React.createElement(Calendar, { className: "h-4 w-4" });
    case "workshop":
      return React.createElement(Users, { className: "h-4 w-4" });
    case "audio":
      return React.createElement(FileAudio, { className: "h-4 w-4" });
    case "image":
      return React.createElement(ImageIcon, { className: "h-4 w-4" });
    case "music":
      return React.createElement(Music, { className: "h-4 w-4" });
    default:
      return React.createElement(FileText, { className: "h-4 w-4" });
  }
};

// BookIcon component
export function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      ...props,
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    React.createElement("path", {
      d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",
    })
  );
}
