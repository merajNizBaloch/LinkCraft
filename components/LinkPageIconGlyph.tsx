import {
  Briefcase,
  Calendar,
  Camera,
  Code2,
  FileText,
  Globe,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Play,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { LinkPageIcon } from "@/lib/link-pages";

const ICONS: Record<LinkPageIcon, LucideIcon> = {
  link: Link2,
  globe: Globe,
  instagram: Camera,
  facebook: Users,
  youtube: Play,
  linkedin: Briefcase,
  twitter: MessageCircle,
  github: Code2,
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
