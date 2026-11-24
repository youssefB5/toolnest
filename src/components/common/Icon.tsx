import {
  Activity, AlertTriangle, AppWindow, Archive, ArchiveRestore, ArrowDown, ArrowDownAZ, ArrowLeftRight, ArrowUp,
  ArrowUpDown, Binary, Blend, Braces, Brush, Cake, Calculator, CalendarRange, CaseSensitive, Check, ChevronDown,
  ChevronRight, CircleAlert, CircleCheck, Clock, Code, CodeXml, Combine, Copy, CopyPlus, Crop, DatabaseBackup,
  Download, ExternalLink, Eye, EyeOff, FileArchive, FileCode, FileEdit, FileImage, FileOutput, FileSearch, FileText,
  FileType, Filter, Fingerprint, FlipHorizontal, FlipVertical, Folder, Gift, GitCompare, Globe, HardDrive, Hash,
  History, Home, Image, ImageDown, ImagePlus, Images, Info, KeyRound, Languages, LayoutDashboard, LetterText, Link,
  Link2, ListOrdered, ListX, Loader2, Lock, LockKeyhole, LogOut, Megaphone, Menu, Minimize2, Monitor, Moon,
  Navigation, Palette, Pencil, Percent, Pilcrow, Pipette, Plus, QrCode, Receipt, RectangleHorizontal, RefreshCw,
  Regex, Replace, RotateCcw, RotateCw, Ruler, Save, Scaling, ScrollText, Search, Settings, Sheet, ShieldCheck,
  Smartphone, Sparkles, Split, Stamp, Star, Sun, Table, Tag, Thermometer, Trash2, Type, Upload, Users, UserX,
  WholeWord, Wrench, X, Zap, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Activity, AlertTriangle, AppWindow, Archive, ArchiveRestore, ArrowDown, ArrowDownAZ, ArrowLeftRight, ArrowUp,
  ArrowUpDown, Binary, Blend, Braces, Brush, Cake, Calculator, CalendarRange, CaseSensitive, Check, ChevronDown,
  ChevronRight, CircleAlert, CircleCheck, Clock, Code, CodeXml, Combine, Copy, CopyPlus, Crop, DatabaseBackup,
  Download, ExternalLink, Eye, EyeOff, FileArchive, FileCode, FileEdit, FileImage, FileOutput, FileSearch, FileText,
  FileType, Filter, Fingerprint, FlipHorizontal, FlipVertical, Folder, Gift, GitCompare, Globe, HardDrive, Hash,
  History, Home, Image, ImageDown, ImagePlus, Images, Info, KeyRound, Languages, LayoutDashboard, LetterText, Link,
  Link2, ListOrdered, ListX, Loader2, Lock, LockKeyhole, LogOut, Megaphone, Menu, Minimize2, Monitor, Moon,
  Navigation, Palette, Pencil, Percent, Pilcrow, Pipette, Plus, QrCode, Receipt, RectangleHorizontal, RefreshCw,
  Regex, Replace, RotateCcw, RotateCw, Ruler, Save, Scaling, ScrollText, Search, Settings, Sheet, ShieldCheck,
  Smartphone, Sparkles, Split, Stamp, Star, Sun, Table, Tag, Thermometer, Trash2, Type, Upload, Users, UserX,
  WholeWord, Wrench, X, Zap,
};

export const ICON_NAMES = Object.keys(ICONS).sort();

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.75,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const C = ICONS[name] ?? Folder;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" />;
}
