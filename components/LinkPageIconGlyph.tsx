import {
  Briefcase,
  Calendar,
  Camera,
  Facebook,
  FileText,
  Github,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  ShoppingBag,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";

import type { LinkPageIcon } from "@/lib/link-pages";

const ICONS: Record<LinkPageIcon, LucideIcon> = {
  link: Link2,
  globe: Globe,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  twitter: Twitter,
  github: Github,
  mail: Mail,
  phone: Phone,
  message: MessageCircle,
  "map-pin": MapPin,
  "shopping-bag": ShoppingBag,
  calendar: Calendar,
  "file-text": FileText,
  briefcase: Briefcase,
  music: Music,
  camera: Camera,
};

export function LinkPageIconGlyph({
  icon,
  size = 17,
  className,
}: {
  icon: LinkPageIcon;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[icon] || Link2;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
