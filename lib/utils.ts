import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { courseService } from "./services/course";
import { tokenUsageService } from "./services/tokenUsage";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseContentFromMarkdown(markdown: string): string {
  // Configure marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert line breaks to <br>
  });

  // Parse markdown to HTML
  const html = marked.parse(markdown) as string;

  // Sanitize HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote',
      'a',
      'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
  });

  return cleanHtml;
}

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export const getSessionUserInfo = async () => {
  console.log("I was called")
  const id = getCookie('user_id');
  let userInfo = {
      id: "",
      tokens: 0
    };
  if (id) {
    const user = await courseService.getProfile(id)
    tokenUsageService.checkAndResetTokens(user.id);
    userInfo = {
      id: user.id,
      tokens: user.tokens
    };
    localStorage.setItem("user_info", JSON.stringify(userInfo));
  }
  return userInfo;
}
