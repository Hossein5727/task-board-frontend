import StarterKit from "@tiptap/starter-kit";
import { HEADING_LEVELS, isSafeHttpUrl } from "./document";

/** Single extension set for both editing and read-only rendering, matching `sanitizeDoc`. */
export const richTextExtensions = [
  StarterKit.configure({
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
    horizontalRule: false,
    hardBreak: false,
    heading: { levels: [...HEADING_LEVELS] },
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      isAllowedUri: (url) => isSafeHttpUrl(url),
      shouldAutoLink: (url) => isSafeHttpUrl(url) || isSafeHttpUrl(`https://${url}`),
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    },
  }),
];
